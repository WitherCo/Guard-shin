import discord
from discord.ext import commands
import re
import logging
import json
import os
import asyncio
from collections import defaultdict, deque
import datetime

logger = logging.getLogger('guard-shin')

# Profanity filter word list (comprehensive list based on Wick's filter)
DEFAULT_FILTER_WORDS = [
    # Common profanity
    "asshole", "bitch", "cunt", "dick", "fag", "fuck", "nigga", "nigger", "pussy", "shit", "slut", "whore",
    # Variations with common substitutions
    "a$$", "a$$hole", "b!tch", "b1tch", "c*nt", "d!ck", "d1ck", "f*ck", "f**k", "f@ck", "f4g", "n1gga", "n1gger", 
    "p*ssy", "pu$$y", "sh!t", "sh1t", "$hit", "$lut", "wh0re",
    # Sexual terms
    "blowjob", "cumshot", "deepthroat", "handjob", "masturbate", "orgasm", "penis", "vagina",
    # Self-harm/violence
    "suicide", "kill yourself", "kys", "slit", "wrists", "hang yourself", "shoot yourself"
]

# Scam link detection terms and patterns
SCAM_PATTERNS = [
    r'free\s+nitro', r'steam\s+gift', r'free\s+robux', r'free\s+vbucks', 
    r'csgo\s+skins', r'nitro\s+giveaway', r'discord\s+giveaway',
    r'gift\s+card', r'steam\s+key', r'verification\s+required',
    r'claim\s+your', r'click\s+here\s+to\s+get', r'limited\s+time\s+offer'
]

# Potentially dangerous domains (example list)
DANGEROUS_DOMAINS = [
    "discordgift", "discorcl", "dlscord", "discorb", "discrod", "steamcomminity", 
    "streancommunity", "dlscordnitro", "nitro-discord", "free-nitros", 
    "discord-app", "discordapp.gift", "discord.gift.com", "discord-airdrop",
    "steamcommumity", "disocrd", "discorde", "steampowered.pro", "stearmcommunity"
]

class AutoMod(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
        
        # Configuration and settings
        self.settings = {}  # guild_id -> settings
        
        # Tracking data for anti-spam
        self.user_message_times = defaultdict(lambda: defaultdict(deque))  # guild_id -> user_id -> deque of message timestamps
        self.user_warns = defaultdict(lambda: defaultdict(int))  # guild_id -> user_id -> warn count
        
        # Initialize settings for each guild
        self.load_settings()
    
    def load_settings(self):
        """Load auto-moderation settings from storage"""
        # This would normally load from a database
        # For now, we'll use default settings for all guilds
        default_settings = {
            'enabled': True,
            'profanity_filter': {
                'enabled': True,
                'words': DEFAULT_FILTER_WORDS,
                'action': 'warn',  # warn, delete, mute, kick, ban
                'warn_threshold': 3  # Number of warnings before taking stronger action
            },
            'link_filter': {
                'enabled': True,
                'allowed_domains': ["discord.com", "discordapp.com", "discord.gg"],
                'action': 'warn',
                'warn_threshold': 2  # Number of warnings before taking stronger action
            },
            'scam_detection': {
                'enabled': True,
                'patterns': SCAM_PATTERNS,
                'dangerous_domains': DANGEROUS_DOMAINS,
                'action': 'delete',
                'notify_admins': True
            },
            'spam_protection': {
                'enabled': True,
                'message_threshold': 5,  # Number of messages
                'time_threshold': 5,  # Time window in seconds
                'action': 'mute',
                'mute_duration': 300  # 5 minutes
            },
            'repeated_text': {
                'enabled': True,
                'threshold': 4,  # Number of repeated phrases/characters
                'action': 'warn',
                'warn_threshold': 2
            },
            'caps_filter': {
                'enabled': True,
                'threshold': 70,  # Percentage of uppercase
                'min_length': 8,  # Minimum message length to check
                'action': 'warn',
                'warn_threshold': 2
            },
            'mention_spam': {
                'enabled': True,
                'threshold': 5,  # Number of mentions
                'action': 'mute',
                'mute_duration': 300  # 5 minutes
            },
            'invite_filter': {
                'enabled': True,
                'allow_partnered': True,
                'whitelist': [],  # List of allowed server IDs
                'action': 'delete',
                'warn_threshold': 2
            },
            'zalgo_text': {
                'enabled': True,
                'action': 'delete',
                'warn_threshold': 2
            },
            'emoji_spam': {
                'enabled': True,
                'threshold': 6,  # Max emojis per message
                'percentage_threshold': 50,  # Percentage of message that is emojis
                'action': 'warn',
                'warn_threshold': 2
            },
            'new_account_filter': {
                'enabled': True,
                'min_age_days': 7,  # Minimum account age in days
                'action': 'monitor',  # monitor, restrict, kick
                'restricted_channels': []  # List of channel IDs new users can access
            },
            'anti_phishing': {
                'enabled': True,
                'action': 'delete',
                'notify_mods': True
            },
            'anti_token_grabber': {
                'enabled': True,
                'action': 'delete',
                'notify_mods': True
            },
            'anti_ip_grabber': {
                'enabled': True,
                'action': 'delete',
                'notify_mods': True
            },
            'logging': {
                'enabled': True,
                'log_channel': None,  # Channel ID for logs
                'log_level': 'all'  # all, warnings, violations, none
            }
        }
        
        # Apply default settings to all guilds
        for guild in self.bot.guilds:
            self.settings[guild.id] = default_settings.copy()
    
    @commands.Cog.listener()
    async def on_message(self, message):
        """Process messages for auto-moderation"""
        # Skip messages from bots or system messages
        if message.author.bot or not message.guild:
            return
        
        # Skip messages from moderators or administrators
        if message.author.guild_permissions.manage_messages:
            return
        
        # Get settings for this guild
        guild_settings = self.settings.get(message.guild.id, {})
        
        # Skip if auto-mod is disabled for this guild
        if not guild_settings.get('enabled', False):
            return
        
        # Check various filters in order of severity
        # 1. Anti-phishing/scam detection (highest priority)
        if await self.check_phishing(message, guild_settings):
            return
            
        # 2. Anti-token grabber
        if await self.check_token_grabber(message, guild_settings):
            return
            
        # 3. Anti-IP grabber
        if await self.check_ip_grabber(message, guild_settings):
            return
        
        # 4. Scam detection
        if await self.check_scam(message, guild_settings):
            return
        
        # 5. Profanity filter
        if await self.check_profanity(message, guild_settings):
            return
        
        # 6. Link filter
        if await self.check_links(message, guild_settings):
            return
            
        # 7. Invite filter
        if await self.check_invites(message, guild_settings):
            return
        
        # 8. Spam protection
        if await self.check_spam(message, guild_settings):
            return
        
        # 9. Repeated text
        if await self.check_repeated_text(message, guild_settings):
            return
        
        # 10. Caps filter
        if await self.check_caps(message, guild_settings):
            return
        
        # 11. Mention spam
        if await self.check_mention_spam(message, guild_settings):
            return
            
        # 12. Zalgo text
        if await self.check_zalgo(message, guild_settings):
            return
            
        # 13. Emoji spam
        if await self.check_emoji_spam(message, guild_settings):
            return
            
        # 14. New account checks
        if await self.check_new_account(message, guild_settings):
            return
    
    async def check_profanity(self, message, settings):
        """Check message for profanity/filtered words"""
        if not settings.get('profanity_filter', {}).get('enabled', False):
            return False
        
        # Get filtered words
        filtered_words = settings.get('profanity_filter', {}).get('words', [])
        
        # Check for matches
        content = message.content.lower()
        
        # Simple word matching (a more complex implementation would use regex patterns and word boundaries)
        found_words = []
        for word in filtered_words:
            if word.lower() in content:
                found_words.append(word)
        
        if found_words:
            # Take action based on settings
            action = settings.get('profanity_filter', {}).get('action', 'warn')
            await self.take_action(message, action, 
                                  reason=f"Filtered words detected: {', '.join(found_words)}",
                                  filter_type="profanity",
                                  settings=settings.get('profanity_filter', {}))
            return True
        
        return False
    
    async def check_links(self, message, settings):
        """Check message for unauthorized links"""
        if not settings.get('link_filter', {}).get('enabled', False):
            return False
        
        # Find URLs in the message
        # This is a simple URL regex pattern - a more comprehensive one would be used in production
        url_pattern = r'https?://(?:[-\w.]|(?:%[\da-fA-F]{2}))+'
        urls = re.findall(url_pattern, message.content)
        
        if not urls:
            return False
        
        # Get allowed domains
        allowed_domains = settings.get('link_filter', {}).get('allowed_domains', [])
        
        # Check if any URLs are not from allowed domains
        unauthorized_urls = []
        for url in urls:
            is_allowed = False
            for domain in allowed_domains:
                if domain.lower() in url.lower():
                    is_allowed = True
                    break
            
            if not is_allowed:
                unauthorized_urls.append(url)
        
        if unauthorized_urls:
            # Take action based on settings
            action = settings.get('link_filter', {}).get('action', 'warn')
            await self.take_action(message, action, 
                                  reason=f"Unauthorized links posted: {', '.join(unauthorized_urls)}",
                                  filter_type="link",
                                  settings=settings.get('link_filter', {}))
            return True
        
        return False
    
    async def check_spam(self, message, settings):
        """Check for message spam (rate limiting)"""
        if not settings.get('spam_protection', {}).get('enabled', False):
            return False
        
        # Get settings
        message_threshold = settings.get('spam_protection', {}).get('message_threshold', 5)
        time_threshold = settings.get('spam_protection', {}).get('time_threshold', 5)
        
        # Get or create user's message history
        guild_id = message.guild.id
        user_id = message.author.id
        
        # Add current message timestamp
        now = datetime.datetime.now()
        self.user_message_times[guild_id][user_id].append(now)
        
        # Keep only messages within the time window
        cutoff_time = now - datetime.timedelta(seconds=time_threshold)
        self.user_message_times[guild_id][user_id] = deque(
            [t for t in self.user_message_times[guild_id][user_id] if t > cutoff_time],
            maxlen=100
        )
        
        # Check if number of messages exceeds threshold
        recent_messages = len(self.user_message_times[guild_id][user_id])
        
        if recent_messages >= message_threshold:
            # Take action based on settings
            action = settings.get('spam_protection', {}).get('action', 'mute')
            await self.take_action(message, action, 
                                  reason=f"Message spam detected: {recent_messages} messages in {time_threshold} seconds",
                                  filter_type="spam",
                                  settings=settings.get('spam_protection', {}))
            
            # Clear the user's message history to avoid multiple triggers
            self.user_message_times[guild_id][user_id].clear()
            return True
        
        return False
    
    async def check_caps(self, message, settings):
        """Check for excessive caps usage"""
        if not settings.get('caps_filter', {}).get('enabled', False):
            return False
        
        # Get settings
        threshold = settings.get('caps_filter', {}).get('threshold', 70)
        min_length = settings.get('caps_filter', {}).get('min_length', 8)
        
        # Skip short messages
        if len(message.content) < min_length:
            return False
        
        # Count uppercase letters
        uppercase_count = sum(1 for c in message.content if c.isupper())
        letter_count = sum(1 for c in message.content if c.isalpha())
        
        # Skip messages with few letters
        if letter_count < min_length:
            return False
        
        # Calculate percentage
        caps_percentage = (uppercase_count / letter_count) * 100
        
        if caps_percentage >= threshold:
            # Take action based on settings
            action = settings.get('caps_filter', {}).get('action', 'warn')
            await self.take_action(message, action, 
                                  reason=f"Excessive caps usage: {caps_percentage:.1f}% of letters are uppercase",
                                  filter_type="caps",
                                  settings=settings.get('caps_filter', {}))
            return True
        
        return False
    
    async def check_mention_spam(self, message, settings):
        """Check for mention spam"""
        if not settings.get('mention_spam', {}).get('enabled', False):
            return False
        
        # Get settings
        threshold = settings.get('mention_spam', {}).get('threshold', 5)
        
        # Count user mentions
        mention_count = len(message.mentions)
        
        # Count role mentions
        mention_count += len(message.role_mentions)
        
        if mention_count >= threshold:
            # Take action based on settings
            action = settings.get('mention_spam', {}).get('action', 'mute')
            await self.take_action(message, action, 
                                  reason=f"Mention spam detected: {mention_count} mentions in a single message",
                                  filter_type="mention_spam",
                                  settings=settings.get('mention_spam', {}))
            return True
        
        return False
    
    async def take_action(self, message, action, reason, filter_type, settings):
        """Take moderation action based on violation type and settings"""
        # Log the violation
        logger.info(f"Auto-mod triggered: {filter_type} in {message.guild.name} ({message.guild.id}) by {message.author} ({message.author.id}): {reason}")
        
        # Delete message if needed (for most actions)
        if action != "none":
            try:
                await message.delete()
            except discord.errors.NotFound:
                pass  # Message may have been deleted already
            except discord.errors.Forbidden:
                logger.warning(f"Missing permissions to delete message in {message.guild.name}")
        
        # Track warnings
        guild_id = message.guild.id
        user_id = message.author.id
        
        if action == "warn":
            # Increment warning count
            self.user_warns[guild_id][user_id] += 1
            warn_count = self.user_warns[guild_id][user_id]
            
            # Get warning threshold for escalation
            warn_threshold = settings.get('warn_threshold', 3)
            
            # Send warning message
            try:
                await message.channel.send(
                    f"{message.author.mention} Warning ({warn_count}/{warn_threshold}): {reason}",
                    delete_after=10
                )
            except discord.errors.Forbidden:
                pass
            
            # Check if we should escalate after multiple warnings
            if warn_count >= warn_threshold:
                # Reset warnings
                self.user_warns[guild_id][user_id] = 0
                
                # Escalate to mute
                await self.take_action(message, "mute", 
                                      reason=f"Received {warn_threshold} warnings",
                                      filter_type=filter_type,
                                      settings=settings)
        
        elif action == "mute" or action == "timeout":
            # Get mute duration
            duration = settings.get('mute_duration', 300)  # Default 5 minutes
            
            try:
                # Apply timeout (Discord's version of mute)
                until = discord.utils.utcnow() + datetime.timedelta(seconds=duration)
                await message.author.timeout(until=until, reason=reason)
                
                # Notify channel
                await message.channel.send(
                    f"{message.author.mention} has been muted for {duration // 60} minutes: {reason}",
                    delete_after=10
                )
            except discord.errors.Forbidden:
                logger.warning(f"Missing permissions to timeout user in {message.guild.name}")
        
        elif action == "kick":
            try:
                # Try to DM the user first
                try:
                    await message.author.send(f"You have been kicked from {message.guild.name}: {reason}")
                except:
                    pass  # Can't DM
                
                # Kick the user
                await message.guild.kick(message.author, reason=reason)
                
                # Notify channel
                await message.channel.send(
                    f"{message.author} has been kicked: {reason}",
                    delete_after=10
                )
            except discord.errors.Forbidden:
                logger.warning(f"Missing permissions to kick user in {message.guild.name}")
        
        elif action == "ban":
            try:
                # Try to DM the user first
                try:
                    await message.author.send(f"You have been banned from {message.guild.name}: {reason}")
                except:
                    pass  # Can't DM
                
                # Ban the user
                await message.guild.ban(message.author, reason=reason, delete_message_days=1)
                
                # Notify channel
                await message.channel.send(
                    f"{message.author} has been banned: {reason}",
                    delete_after=10
                )
            except discord.errors.Forbidden:
                logger.warning(f"Missing permissions to ban user in {message.guild.name}")
    
    async def check_phishing(self, message, settings):
        """Check message for phishing links"""
        if not settings.get('anti_phishing', {}).get('enabled', False):
            return False
            
        # Find URLs in the message
        url_pattern = r'https?://(?:[-\w.]|(?:%[\da-fA-F]{2}))+'
        urls = re.findall(url_pattern, message.content)
        
        if not urls:
            return False
        
        # Check against known phishing domains
        for url in urls:
            url_lower = url.lower()
            
            # Common phishing patterns
            phishing_patterns = [
                "discord-nitro", "free-nitro", "steam-gift", "nitrogift",
                "steamgiveaway", "discordgift", "gift.com", "discord.gift", 
                "discocrd", "dlscord", "discorb"
            ]
            
            for pattern in phishing_patterns:
                if pattern in url_lower:
                    action = settings.get('anti_phishing', {}).get('action', 'delete')
                    
                    # Notify moderators if enabled
                    if settings.get('anti_phishing', {}).get('notify_mods', True):
                        try:
                            # Try to find a log channel
                            log_channel_id = settings.get('logging', {}).get('log_channel')
                            if log_channel_id:
                                log_channel = message.guild.get_channel(log_channel_id)
                                if log_channel:
                                    embed = discord.Embed(
                                        title="⚠️ Phishing Link Detected",
                                        description=f"User {message.author.mention} posted a potential phishing link",
                                        color=discord.Color.red(),
                                        timestamp=discord.utils.utcnow()
                                    )
                                    embed.add_field(name="Channel", value=message.channel.mention)
                                    embed.add_field(name="Content", value=message.content[:1000] if len(message.content) <= 1000 else f"{message.content[:997]}...")
                                    embed.add_field(name="Detected URL", value=url)
                                    embed.set_footer(text=f"User ID: {message.author.id}")
                                    
                                    await log_channel.send(embed=embed)
                        except Exception as e:
                            logger.error(f"Failed to send phishing notification: {e}")
                    
                    await self.take_action(message, action, 
                                         reason=f"Potential phishing link detected: {url}",
                                         filter_type="phishing",
                                         settings=settings.get('anti_phishing', {}))
                    return True
        
        return False
    
    async def check_token_grabber(self, message, settings):
        """Check message for potential Discord token grabbers"""
        if not settings.get('anti_token_grabber', {}).get('enabled', False):
            return False
            
        # Token grabber patterns (JavaScript code snippets that might steal tokens)
        patterns = [
            r'localStorage\.getItem\([\'"]token[\'"]\)',
            r'localStorage\[[\'"]token[\'"]\]',
            r'document\.cookie',
            r'\.send\(.*token',
            r'\.post\(.*token',
            r'\.get\(.*token'
        ]
        
        for pattern in patterns:
            if re.search(pattern, message.content):
                action = settings.get('anti_token_grabber', {}).get('action', 'delete')
                
                # Notify moderators if enabled
                if settings.get('anti_token_grabber', {}).get('notify_mods', True):
                    try:
                        # Similar notification code as in check_phishing
                        log_channel_id = settings.get('logging', {}).get('log_channel')
                        if log_channel_id:
                            log_channel = message.guild.get_channel(log_channel_id)
                            if log_channel:
                                embed = discord.Embed(
                                    title="⚠️ Potential Token Grabber Detected",
                                    description=f"User {message.author.mention} posted a potential token grabber",
                                    color=discord.Color.red(),
                                    timestamp=discord.utils.utcnow()
                                )
                                embed.add_field(name="Channel", value=message.channel.mention)
                                embed.add_field(name="Content", value=message.content[:1000] if len(message.content) <= 1000 else f"{message.content[:997]}...")
                                embed.set_footer(text=f"User ID: {message.author.id}")
                                
                                await log_channel.send(embed=embed)
                    except Exception as e:
                        logger.error(f"Failed to send token grabber notification: {e}")
                
                await self.take_action(message, action, 
                                     reason=f"Potential token grabber detected",
                                     filter_type="token_grabber",
                                     settings=settings.get('anti_token_grabber', {}))
                return True
        
        return False
    
    async def check_ip_grabber(self, message, settings):
        """Check message for potential IP grabbers/loggers"""
        if not settings.get('anti_ip_grabber', {}).get('enabled', False):
            return False
            
        # Find URLs in the message
        url_pattern = r'https?://(?:[-\w.]|(?:%[\da-fA-F]{2}))+'
        urls = re.findall(url_pattern, message.content)
        
        if not urls:
            return False
        
        # Known IP grabber domains
        suspicious_domains = [
            "grabify", "iplogger", "ipgrabber", "iplist", "2no", "yip", "ps3cfw",
            "linkspy", "iptrack", "ip-tracker", "logger", "ipsniff", "ip-sniff",
            "webresolver", "whatismyip", "blasze", "grabify.link", "iplogger.org"
        ]
        
        for url in urls:
            url_lower = url.lower()
            
            for domain in suspicious_domains:
                if domain in url_lower:
                    action = settings.get('anti_ip_grabber', {}).get('action', 'delete')
                    
                    # Notify moderators if enabled
                    if settings.get('anti_ip_grabber', {}).get('notify_mods', True):
                        try:
                            # Similar notification code as in check_phishing
                            log_channel_id = settings.get('logging', {}).get('log_channel')
                            if log_channel_id:
                                log_channel = message.guild.get_channel(log_channel_id)
                                if log_channel:
                                    embed = discord.Embed(
                                        title="⚠️ Potential IP Grabber Detected",
                                        description=f"User {message.author.mention} posted a potential IP grabber link",
                                        color=discord.Color.red(),
                                        timestamp=discord.utils.utcnow()
                                    )
                                    embed.add_field(name="Channel", value=message.channel.mention)
                                    embed.add_field(name="Content", value=message.content[:1000] if len(message.content) <= 1000 else f"{message.content[:997]}...")
                                    embed.add_field(name="Detected URL", value=url)
                                    embed.set_footer(text=f"User ID: {message.author.id}")
                                    
                                    await log_channel.send(embed=embed)
                        except Exception as e:
                            logger.error(f"Failed to send IP grabber notification: {e}")
                    
                    await self.take_action(message, action, 
                                         reason=f"Potential IP grabber detected: {url}",
                                         filter_type="ip_grabber",
                                         settings=settings.get('anti_ip_grabber', {}))
                    return True
        
        return False
    
    async def check_scam(self, message, settings):
        """Check message for scam content"""
        if not settings.get('scam_detection', {}).get('enabled', False):
            return False
            
        # Check for scam patterns in message content
        content_lower = message.content.lower()
        patterns = settings.get('scam_detection', {}).get('patterns', SCAM_PATTERNS)
        
        for pattern in patterns:
            if re.search(pattern, content_lower):
                action = settings.get('scam_detection', {}).get('action', 'delete')
                
                # Notify admins if enabled
                if settings.get('scam_detection', {}).get('notify_admins', True):
                    try:
                        log_channel_id = settings.get('logging', {}).get('log_channel')
                        if log_channel_id:
                            log_channel = message.guild.get_channel(log_channel_id)
                            if log_channel:
                                embed = discord.Embed(
                                    title="⚠️ Potential Scam Detected",
                                    description=f"User {message.author.mention} posted a message matching scam patterns",
                                    color=discord.Color.red(),
                                    timestamp=discord.utils.utcnow()
                                )
                                embed.add_field(name="Channel", value=message.channel.mention)
                                embed.add_field(name="Content", value=message.content[:1000] if len(message.content) <= 1000 else f"{message.content[:997]}...")
                                embed.add_field(name="Matched Pattern", value=pattern)
                                embed.set_footer(text=f"User ID: {message.author.id}")
                                
                                await log_channel.send(embed=embed)
                    except Exception as e:
                        logger.error(f"Failed to send scam notification: {e}")
                
                await self.take_action(message, action, 
                                     reason=f"Potential scam detected",
                                     filter_type="scam",
                                     settings=settings.get('scam_detection', {}))
                return True
        
        # Check URLs for dangerous domains
        url_pattern = r'https?://(?:[-\w.]|(?:%[\da-fA-F]{2}))+'
        urls = re.findall(url_pattern, message.content)
        
        if urls:
            dangerous_domains = settings.get('scam_detection', {}).get('dangerous_domains', DANGEROUS_DOMAINS)
            
            for url in urls:
                url_lower = url.lower()
                
                for domain in dangerous_domains:
                    if domain in url_lower:
                        action = settings.get('scam_detection', {}).get('action', 'delete')
                        
                        # Notify admins if enabled
                        if settings.get('scam_detection', {}).get('notify_admins', True):
                            try:
                                log_channel_id = settings.get('logging', {}).get('log_channel')
                                if log_channel_id:
                                    log_channel = message.guild.get_channel(log_channel_id)
                                    if log_channel:
                                        embed = discord.Embed(
                                            title="⚠️ Dangerous Domain Detected",
                                            description=f"User {message.author.mention} posted a link to a dangerous domain",
                                            color=discord.Color.red(),
                                            timestamp=discord.utils.utcnow()
                                        )
                                        embed.add_field(name="Channel", value=message.channel.mention)
                                        embed.add_field(name="Content", value=message.content[:1000] if len(message.content) <= 1000 else f"{message.content[:997]}...")
                                        embed.add_field(name="Dangerous Domain", value=domain)
                                        embed.add_field(name="Full URL", value=url)
                                        embed.set_footer(text=f"User ID: {message.author.id}")
                                        
                                        await log_channel.send(embed=embed)
                            except Exception as e:
                                logger.error(f"Failed to send dangerous domain notification: {e}")
                        
                        await self.take_action(message, action, 
                                             reason=f"Dangerous domain detected: {url}",
                                             filter_type="dangerous_domain",
                                             settings=settings.get('scam_detection', {}))
                        return True
        
        return False
    
    async def check_invites(self, message, settings):
        """Check message for Discord invite links"""
        if not settings.get('invite_filter', {}).get('enabled', False):
            return False
            
        # Find Discord invite links
        invite_pattern = r'(?:https?://)?(?:www\.)?(?:discord\.(?:gg|io|me|li|com)/|discordapp\.com/invite/)([a-zA-Z0-9-]+)'
        invites = re.findall(invite_pattern, message.content)
        
        if not invites:
            return False
        
        # Get whitelist
        whitelist = settings.get('invite_filter', {}).get('whitelist', [])
        allow_partnered = settings.get('invite_filter', {}).get('allow_partnered', True)
        
        # Check each invite
        for invite_code in invites:
            try:
                # Fetch the invite to get the guild
                invite = await self.bot.fetch_invite(invite_code)
                
                # Skip if this server's invite
                if invite.guild.id == message.guild.id:
                    continue
                
                # Skip if whitelisted
                if str(invite.guild.id) in whitelist:
                    continue
                
                # Skip if partnered/verified and allowed
                if allow_partnered and (invite.guild.features and 
                                       ("PARTNERED" in invite.guild.features or 
                                        "VERIFIED" in invite.guild.features)):
                    continue
                
                # Otherwise, take action
                action = settings.get('invite_filter', {}).get('action', 'delete')
                await self.take_action(message, action, 
                                     reason=f"Unauthorized Discord invite: {invite.guild.name}",
                                     filter_type="invite",
                                     settings=settings.get('invite_filter', {}))
                return True
                
            except discord.NotFound:
                # Invalid invite, could still take action here
                pass
            except Exception as e:
                logger.error(f"Error checking invite: {e}")
        
        return False
    
    async def check_repeated_text(self, message, settings):
        """Check for repeated text/characters"""
        if not settings.get('repeated_text', {}).get('enabled', False):
            return False
            
        content = message.content
        
        # Check for repeated characters (like "aaaaaaaa")
        threshold = settings.get('repeated_text', {}).get('threshold', 4)
        
        # Find sequences of 4+ repeated characters
        repeated_chars = re.findall(r'(.)\1{' + str(threshold-1) + ',}', content)
        
        if repeated_chars:
            action = settings.get('repeated_text', {}).get('action', 'warn')
            await self.take_action(message, action, 
                                 reason=f"Message contains excessive repetition",
                                 filter_type="repeated_text",
                                 settings=settings.get('repeated_text', {}))
            return True
        
        # Check for repeated words
        words = re.findall(r'\b(\w+)\b', content.lower())
        if len(words) >= threshold:
            # Count word occurrences
            word_counts = {}
            for word in words:
                if len(word) >= 3:  # Only check words with 3+ chars
                    word_counts[word] = word_counts.get(word, 0) + 1
            
            # Check if any word appears too many times
            for word, count in word_counts.items():
                if count >= threshold:
                    action = settings.get('repeated_text', {}).get('action', 'warn')
                    await self.take_action(message, action, 
                                         reason=f"Message contains repeated text ('{word}' used {count} times)",
                                         filter_type="repeated_text",
                                         settings=settings.get('repeated_text', {}))
                    return True
        
        return False
    
    async def check_zalgo(self, message, settings):
        """Check for zalgo text (text with excessive combining characters)"""
        if not settings.get('zalgo_text', {}).get('enabled', False):
            return False
            
        # Zalgo detection: check for combining characters
        zalgo_pattern = r'[\u0300-\u036F\u0489]{3,}'
        
        if re.search(zalgo_pattern, message.content):
            action = settings.get('zalgo_text', {}).get('action', 'delete')
            await self.take_action(message, action, 
                                 reason="Zalgo text detected",
                                 filter_type="zalgo",
                                 settings=settings.get('zalgo_text', {}))
            return True
            
        return False
    
    async def check_emoji_spam(self, message, settings):
        """Check for excessive use of emojis"""
        if not settings.get('emoji_spam', {}).get('enabled', False):
            return False
            
        # Emoji patterns
        standard_emoji = r'[\U0001F000-\U0001F9FF]|\u200d|\u2600-\u27FF'
        custom_emoji = r'<a?:[a-zA-Z0-9_]+:[0-9]+>'
        
        # Find all emojis in the message
        standard_matches = re.findall(standard_emoji, message.content)
        custom_matches = re.findall(custom_emoji, message.content)
        
        emoji_count = len(standard_matches) + len(custom_matches)
        
        # Get settings
        threshold = settings.get('emoji_spam', {}).get('threshold', 6)
        percentage_threshold = settings.get('emoji_spam', {}).get('percentage_threshold', 50)
        
        # Check against threshold
        if emoji_count >= threshold:
            action = settings.get('emoji_spam', {}).get('action', 'warn')
            await self.take_action(message, action, 
                                 reason=f"Emoji spam detected ({emoji_count} emojis)",
                                 filter_type="emoji_spam",
                                 settings=settings.get('emoji_spam', {}))
            return True
        
        # Check emoji density (percentage of message)
        if message.content and len(message.content) > 0:
            # Calculate characters used by emojis
            emoji_chars = sum(len(match) for match in standard_matches) + sum(len(match) for match in custom_matches)
            
            # Calculate percentage
            emoji_percentage = (emoji_chars / len(message.content)) * 100
            
            if emoji_percentage >= percentage_threshold:
                action = settings.get('emoji_spam', {}).get('action', 'warn')
                await self.take_action(message, action, 
                                     reason=f"High emoji density ({emoji_percentage:.1f}% of message)",
                                     filter_type="emoji_spam",
                                     settings=settings.get('emoji_spam', {}))
                return True
                
        return False
    
    async def check_new_account(self, message, settings):
        """Check for new Discord accounts"""
        if not settings.get('new_account_filter', {}).get('enabled', False):
            return False
            
        min_age_days = settings.get('new_account_filter', {}).get('min_age_days', 7)
        action = settings.get('new_account_filter', {}).get('action', 'monitor')
        
        # Calculate account age
        now = discord.utils.utcnow()
        account_age = (now - message.author.created_at).days
        
        if account_age < min_age_days:
            # Just monitor
            if action == "monitor":
                try:
                    log_channel_id = settings.get('logging', {}).get('log_channel')
                    if log_channel_id:
                        log_channel = message.guild.get_channel(log_channel_id)
                        if log_channel:
                            embed = discord.Embed(
                                title="New Account Alert",
                                description=f"User {message.author.mention} has a new Discord account",
                                color=discord.Color.gold(),
                                timestamp=discord.utils.utcnow()
                            )
                            embed.add_field(name="Account Age", value=f"{account_age} days")
                            embed.add_field(name="Channel", value=message.channel.mention)
                            embed.add_field(name="Message", value=message.content[:1000] if len(message.content) <= 1000 else f"{message.content[:997]}...")
                            embed.set_footer(text=f"User ID: {message.author.id}")
                            
                            await log_channel.send(embed=embed)
                except Exception as e:
                    logger.error(f"Failed to send new account notification: {e}")
                    
                return False  # Continue processing message
            
            # Restrict to specific channels
            elif action == "restrict":
                restricted_channels = settings.get('new_account_filter', {}).get('restricted_channels', [])
                
                if restricted_channels and message.channel.id not in restricted_channels:
                    try:
                        await message.delete()
                        try:
                            await message.author.send(
                                f"Your message in {message.guild.name} was removed because your account is less than {min_age_days} days old. "
                                f"You can only post in designated channels until your account is older."
                            )
                        except:
                            pass  # Can't DM
                    except:
                        pass  # Can't delete
                    
                    return True
            
            # Kick new accounts
            elif action == "kick":
                try:
                    await message.author.send(
                        f"You have been removed from {message.guild.name} because your account is less than {min_age_days} days old. "
                        f"Please try joining again when your account is older."
                    )
                except:
                    pass  # Can't DM
                
                try:
                    await message.guild.kick(
                        message.author,
                        reason=f"Account less than {min_age_days} days old (Auto-mod)"
                    )
                    return True
                except:
                    logger.error(f"Failed to kick new account: {message.author.id}")
        
        return False
        
    @commands.command(name="automod")
    @commands.has_permissions(administrator=True)
    async def automod(self, ctx, setting=None, option=None, *, value=None):
        """Configure auto-moderation settings"""
        guild = ctx.guild
        
        # Initialize settings if they don't exist
        if guild.id not in self.settings:
            self.load_settings()
        
        # Show status if no setting specified
        if not setting or setting.lower() in ["status", "check"]:
            settings = self.settings[guild.id]
            
            embed = discord.Embed(
                title="Auto-Moderation Status",
                color=discord.Color.blue()
            )
            
            embed.add_field(name="Enabled", value="✅ Yes" if settings.get('enabled', False) else "❌ No")
            
            # Profanity filter status
            pf = settings.get('profanity_filter', {})
            embed.add_field(
                name="Profanity Filter",
                value=f"{'✅ Enabled' if pf.get('enabled', False) else '❌ Disabled'}\nAction: {pf.get('action', 'warn')}\nWords: {len(pf.get('words', []))} words filtered"
            )
            
            # Link filter status
            lf = settings.get('link_filter', {})
            embed.add_field(
                name="Link Filter",
                value=f"{'✅ Enabled' if lf.get('enabled', False) else '❌ Disabled'}\nAction: {lf.get('action', 'warn')}\nAllowed domains: {len(lf.get('allowed_domains', []))}"
            )
            
            # Spam protection status
            sp = settings.get('spam_protection', {})
            embed.add_field(
                name="Spam Protection",
                value=f"{'✅ Enabled' if sp.get('enabled', False) else '❌ Disabled'}\nAction: {sp.get('action', 'mute')}\nThreshold: {sp.get('message_threshold', 5)} msgs in {sp.get('time_threshold', 5)}s"
            )
            
            # Caps filter status
            cf = settings.get('caps_filter', {})
            embed.add_field(
                name="Caps Filter",
                value=f"{'✅ Enabled' if cf.get('enabled', False) else '❌ Disabled'}\nAction: {cf.get('action', 'warn')}\nThreshold: {cf.get('threshold', 70)}% uppercase"
            )
            
            # Mention spam status
            ms = settings.get('mention_spam', {})
            embed.add_field(
                name="Mention Spam",
                value=f"{'✅ Enabled' if ms.get('enabled', False) else '❌ Disabled'}\nAction: {ms.get('action', 'mute')}\nThreshold: {ms.get('threshold', 5)} mentions"
            )
            
            await ctx.send(embed=embed)
            return
        
        # Toggle main auto-mod on/off
        if setting.lower() in ["on", "enable", "true", "yes"]:
            self.settings[guild.id]['enabled'] = True
            await ctx.send("✅ Auto-moderation has been **enabled**.")
            return
        
        elif setting.lower() in ["off", "disable", "false", "no"]:
            self.settings[guild.id]['enabled'] = False
            await ctx.send("❌ Auto-moderation has been **disabled**.")
            return
        
        # Configure specific filters
        if setting.lower() in ["profanity", "words", "filter"]:
            if not option:
                await ctx.send("⚠️ Please specify an option: `on`, `off`, `action`, `list`, `add`, or `remove`.")
                return
            
            # Toggle profanity filter on/off
            if option.lower() in ["on", "enable", "true", "yes"]:
                self.settings[guild.id]['profanity_filter']['enabled'] = True
                await ctx.send("✅ Profanity filter has been **enabled**.")
            
            elif option.lower() in ["off", "disable", "false", "no"]:
                self.settings[guild.id]['profanity_filter']['enabled'] = False
                await ctx.send("❌ Profanity filter has been **disabled**.")
            
            # Set action
            elif option.lower() == "action":
                if not value or value.lower() not in ["warn", "delete", "mute", "kick", "ban"]:
                    await ctx.send("⚠️ Please specify a valid action: `warn`, `delete`, `mute`, `kick`, or `ban`.")
                    return
                
                self.settings[guild.id]['profanity_filter']['action'] = value.lower()
                await ctx.send(f"✅ Profanity filter action set to **{value.lower()}**.")
            
            # List filtered words
            elif option.lower() == "list":
                filtered_words = self.settings[guild.id]['profanity_filter'].get('words', [])
                
                if not filtered_words:
                    await ctx.send("No words are currently filtered.")
                    return
                
                # Format words for display
                chunks = [filtered_words[i:i+20] for i in range(0, len(filtered_words), 20)]
                
                for i, chunk in enumerate(chunks):
                    embed = discord.Embed(
                        title=f"Filtered Words (Page {i+1}/{len(chunks)})",
                        description="||" + "||, ||".join(chunk) + "||",
                        color=discord.Color.red()
                    )
                    await ctx.send(embed=embed)
            
            # Add filtered word
            elif option.lower() == "add":
                if not value:
                    await ctx.send("⚠️ Please specify a word to add to the filter.")
                    return
                
                words_to_add = [w.strip() for w in value.split(",")]
                added = []
                
                for word in words_to_add:
                    if word and word not in self.settings[guild.id]['profanity_filter']['words']:
                        self.settings[guild.id]['profanity_filter']['words'].append(word)
                        added.append(word)
                
                if added:
                    await ctx.send(f"✅ Added {len(added)} word(s) to the filter: ||{', '.join(added)}||")
                else:
                    await ctx.send("⚠️ No new words were added to the filter.")
            
            # Remove filtered word
            elif option.lower() == "remove":
                if not value:
                    await ctx.send("⚠️ Please specify a word to remove from the filter.")
                    return
                
                words_to_remove = [w.strip() for w in value.split(",")]
                removed = []
                
                for word in words_to_remove:
                    if word and word in self.settings[guild.id]['profanity_filter']['words']:
                        self.settings[guild.id]['profanity_filter']['words'].remove(word)
                        removed.append(word)
                
                if removed:
                    await ctx.send(f"✅ Removed {len(removed)} word(s) from the filter: {', '.join(removed)}")
                else:
                    await ctx.send("⚠️ None of the specified words were found in the filter.")
            
            else:
                await ctx.send("⚠️ Invalid option. Please use `on`, `off`, `action`, `list`, `add`, or `remove`.")
        
        # Configure link filter
        elif setting.lower() in ["links", "link", "urls"]:
            if not option:
                await ctx.send("⚠️ Please specify an option: `on`, `off`, `action`, `list`, `add`, or `remove`.")
                return
            
            # Toggle link filter on/off
            if option.lower() in ["on", "enable", "true", "yes"]:
                self.settings[guild.id]['link_filter']['enabled'] = True
                await ctx.send("✅ Link filter has been **enabled**.")
            
            elif option.lower() in ["off", "disable", "false", "no"]:
                self.settings[guild.id]['link_filter']['enabled'] = False
                await ctx.send("❌ Link filter has been **disabled**.")
            
            # Set action
            elif option.lower() == "action":
                if not value or value.lower() not in ["warn", "delete", "mute", "kick", "ban"]:
                    await ctx.send("⚠️ Please specify a valid action: `warn`, `delete`, `mute`, `kick`, or `ban`.")
                    return
                
                self.settings[guild.id]['link_filter']['action'] = value.lower()
                await ctx.send(f"✅ Link filter action set to **{value.lower()}**.")
            
            # List allowed domains
            elif option.lower() == "list":
                allowed_domains = self.settings[guild.id]['link_filter'].get('allowed_domains', [])
                
                if not allowed_domains:
                    await ctx.send("No domains are currently allowed.")
                    return
                
                embed = discord.Embed(
                    title="Allowed Domains",
                    description="\n".join(allowed_domains),
                    color=discord.Color.green()
                )
                await ctx.send(embed=embed)
            
            # Add allowed domain
            elif option.lower() == "add":
                if not value:
                    await ctx.send("⚠️ Please specify a domain to add to the allowed list.")
                    return
                
                domains_to_add = [d.strip() for d in value.split(",")]
                added = []
                
                for domain in domains_to_add:
                    if domain and domain not in self.settings[guild.id]['link_filter']['allowed_domains']:
                        self.settings[guild.id]['link_filter']['allowed_domains'].append(domain)
                        added.append(domain)
                
                if added:
                    await ctx.send(f"✅ Added {len(added)} domain(s) to the allowed list: {', '.join(added)}")
                else:
                    await ctx.send("⚠️ No new domains were added to the allowed list.")
            
            # Remove allowed domain
            elif option.lower() == "remove":
                if not value:
                    await ctx.send("⚠️ Please specify a domain to remove from the allowed list.")
                    return
                
                domains_to_remove = [d.strip() for d in value.split(",")]
                removed = []
                
                for domain in domains_to_remove:
                    if domain and domain in self.settings[guild.id]['link_filter']['allowed_domains']:
                        self.settings[guild.id]['link_filter']['allowed_domains'].remove(domain)
                        removed.append(domain)
                
                if removed:
                    await ctx.send(f"✅ Removed {len(removed)} domain(s) from the allowed list: {', '.join(removed)}")
                else:
                    await ctx.send("⚠️ None of the specified domains were found in the allowed list.")
            
            else:
                await ctx.send("⚠️ Invalid option. Please use `on`, `off`, `action`, `list`, `add`, or `remove`.")
        
        # Configure spam protection
        elif setting.lower() in ["spam", "antispam", "rate"]:
            if not option:
                await ctx.send("⚠️ Please specify an option: `on`, `off`, `action`, `threshold`, or `window`.")
                return
            
            # Toggle spam protection on/off
            if option.lower() in ["on", "enable", "true", "yes"]:
                self.settings[guild.id]['spam_protection']['enabled'] = True
                await ctx.send("✅ Spam protection has been **enabled**.")
            
            elif option.lower() in ["off", "disable", "false", "no"]:
                self.settings[guild.id]['spam_protection']['enabled'] = False
                await ctx.send("❌ Spam protection has been **disabled**.")
            
            # Set action
            elif option.lower() == "action":
                if not value or value.lower() not in ["warn", "delete", "mute", "kick", "ban"]:
                    await ctx.send("⚠️ Please specify a valid action: `warn`, `delete`, `mute`, `kick`, or `ban`.")
                    return
                
                self.settings[guild.id]['spam_protection']['action'] = value.lower()
                await ctx.send(f"✅ Spam protection action set to **{value.lower()}**.")
            
            # Set message threshold
            elif option.lower() == "threshold":
                if not value:
                    await ctx.send("⚠️ Please specify a threshold (number of messages).")
                    return
                
                try:
                    threshold = int(value)
                    if threshold < 3 or threshold > 20:
                        await ctx.send("⚠️ Threshold must be between 3 and 20 messages.")
                        return
                    
                    self.settings[guild.id]['spam_protection']['message_threshold'] = threshold
                    await ctx.send(f"✅ Spam threshold set to **{threshold} messages**.")
                
                except ValueError:
                    await ctx.send("⚠️ Please specify a valid number.")
            
            # Set time window
            elif option.lower() == "window":
                if not value:
                    await ctx.send("⚠️ Please specify a time window in seconds.")
                    return
                
                try:
                    window = int(value)
                    if window < 3 or window > 30:
                        await ctx.send("⚠️ Time window must be between 3 and 30 seconds.")
                        return
                    
                    self.settings[guild.id]['spam_protection']['time_threshold'] = window
                    await ctx.send(f"✅ Spam time window set to **{window} seconds**.")
                
                except ValueError:
                    await ctx.send("⚠️ Please specify a valid number.")
            
            else:
                await ctx.send("⚠️ Invalid option. Please use `on`, `off`, `action`, `threshold`, or `window`.")
        
        # Unknown setting
        else:
            await ctx.send("⚠️ Unknown setting. Available settings: `profanity`, `links`, `spam`.")
    
    def cog_unload(self):
        """Save settings when the cog is unloaded"""
        # In a real implementation, we would save settings to a database here
        pass

async def setup(bot):
    await bot.add_cog(AutoMod(bot))