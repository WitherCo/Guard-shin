import discord
from discord.ext import commands
import logging
import asyncio
import datetime

logger = logging.getLogger('guard-shin.admin')

class Admin(commands.Cog):
    """Admin commands for server management"""
    
    def __init__(self, bot):
        self.bot = bot
        
    @commands.command(name="prefix")
    @commands.has_permissions(administrator=True)
    async def change_prefix(self, ctx, new_prefix=None):
        """Change the bot's prefix for this server"""
        if new_prefix is None:
            current_prefix = self.bot.get_guild_prefix(ctx.guild.id)
            return await ctx.send(f"Current prefix is `{current_prefix}`")
            
        if len(new_prefix) > 10:
            return await ctx.send("Prefix cannot be longer than 10 characters.")
            
        self.bot.set_guild_prefix(ctx.guild.id, new_prefix)
        await ctx.send(f"Prefix changed to `{new_prefix}`")
        
    @commands.command(name="clear", aliases=["purge", "prune"])
    @commands.has_permissions(manage_messages=True)
    @commands.bot_has_permissions(manage_messages=True)
    async def clear(self, ctx, amount: int):
        """Delete a specified number of messages"""
        if amount <= 0:
            return await ctx.send("Please provide a positive number of messages to delete.")
            
        if amount > 100:
            return await ctx.send("You can only delete up to 100 messages at once.")
            
        deleted = await ctx.channel.purge(limit=amount + 1)  # +1 to include the command message
        
        msg = await ctx.send(f"Deleted {len(deleted) - 1} messages.")
        await asyncio.sleep(3)
        await msg.delete()
        
    @commands.command(name="kick")
    @commands.has_permissions(kick_members=True)
    @commands.bot_has_permissions(kick_members=True)
    async def kick(self, ctx, member: discord.Member, *, reason=None):
        """Kick a member from the server"""
        if member == ctx.author:
            return await ctx.send("You cannot kick yourself.")
            
        if member.top_role >= ctx.author.top_role and ctx.author != ctx.guild.owner:
            return await ctx.send("You cannot kick someone with a higher or equal role.")
            
        if member.top_role >= ctx.guild.me.top_role:
            return await ctx.send("I cannot kick someone with a higher or equal role than me.")
            
        # Default reason if none provided
        reason = reason or f"Kicked by {ctx.author}"
        
        try:
            # Send DM to the member
            try:
                embed = discord.Embed(
                    title="You have been kicked",
                    description=f"You have been kicked from {ctx.guild.name}.",
                    color=discord.Color.red()
                )
                embed.add_field(name="Reason", value=reason)
                embed.set_footer(text=f"Kicked by {ctx.author}")
                
                await member.send(embed=embed)
            except:
                # Member might have DMs disabled
                pass
                
            # Kick the member
            await member.kick(reason=reason)
            
            # Send confirmation
            embed = discord.Embed(
                title="Member Kicked",
                description=f"{member.mention} has been kicked from the server.",
                color=discord.Color.orange()
            )
            embed.add_field(name="Reason", value=reason)
            embed.set_footer(text=f"Kicked by {ctx.author}")
            
            await ctx.send(embed=embed)
            
        except discord.Forbidden:
            await ctx.send("I don't have permission to kick that member.")
        except discord.HTTPException as e:
            await ctx.send(f"An error occurred while kicking: {e}")
            
    @commands.command(name="ban")
    @commands.has_permissions(ban_members=True)
    @commands.bot_has_permissions(ban_members=True)
    async def ban(self, ctx, member: discord.Member, *, reason=None):
        """Ban a member from the server"""
        if member == ctx.author:
            return await ctx.send("You cannot ban yourself.")
            
        if member.top_role >= ctx.author.top_role and ctx.author != ctx.guild.owner:
            return await ctx.send("You cannot ban someone with a higher or equal role.")
            
        if member.top_role >= ctx.guild.me.top_role:
            return await ctx.send("I cannot ban someone with a higher or equal role than me.")
            
        # Default reason if none provided
        reason = reason or f"Banned by {ctx.author}"
        
        try:
            # Send DM to the member
            try:
                embed = discord.Embed(
                    title="You have been banned",
                    description=f"You have been banned from {ctx.guild.name}.",
                    color=discord.Color.red()
                )
                embed.add_field(name="Reason", value=reason)
                embed.set_footer(text=f"Banned by {ctx.author}")
                
                await member.send(embed=embed)
            except:
                # Member might have DMs disabled
                pass
                
            # Ban the member
            await member.ban(reason=reason, delete_message_days=1)
            
            # Send confirmation
            embed = discord.Embed(
                title="Member Banned",
                description=f"{member.mention} has been banned from the server.",
                color=discord.Color.red()
            )
            embed.add_field(name="Reason", value=reason)
            embed.set_footer(text=f"Banned by {ctx.author}")
            
            await ctx.send(embed=embed)
            
        except discord.Forbidden:
            await ctx.send("I don't have permission to ban that member.")
        except discord.HTTPException as e:
            await ctx.send(f"An error occurred while banning: {e}")
            
    @commands.command(name="unban")
    @commands.has_permissions(ban_members=True)
    @commands.bot_has_permissions(ban_members=True)
    async def unban(self, ctx, *, user_id_or_name):
        """Unban a user from the server"""
        try:
            # Try to interpret the input as a user ID
            user_id = int(user_id_or_name)
            try:
                user = await self.bot.fetch_user(user_id)
            except discord.NotFound:
                return await ctx.send(f"Could not find a user with ID {user_id}.")
        except ValueError:
            # If not a valid ID, assume it's a username#discriminator
            if "#" not in user_id_or_name:
                return await ctx.send("Please provide a valid user ID or username#discriminator.")
                
            username, discriminator = user_id_or_name.rsplit("#", 1)
            
            # Get ban list
            banned_users = [entry async for entry in ctx.guild.bans()]
            
            user = discord.utils.get(
                [ban_entry.user for ban_entry in banned_users],
                name=username,
                discriminator=discriminator
            )
            
            if user is None:
                return await ctx.send(f"Could not find a banned user named {user_id_or_name}.")
                
        # Attempt to unban the user
        try:
            await ctx.guild.unban(user, reason=f"Unbanned by {ctx.author}")
            
            embed = discord.Embed(
                title="User Unbanned",
                description=f"{user.mention} has been unbanned from the server.",
                color=discord.Color.green()
            )
            embed.set_footer(text=f"Unbanned by {ctx.author}")
            
            await ctx.send(embed=embed)
            
        except discord.Forbidden:
            await ctx.send("I don't have permission to unban users.")
        except discord.HTTPException as e:
            await ctx.send(f"An error occurred while unbanning: {e}")
            
    @commands.command(name="mute")
    @commands.has_permissions(manage_roles=True)
    @commands.bot_has_permissions(manage_roles=True)
    async def mute(self, ctx, member: discord.Member, *, reason=None):
        """Mute a member (prevents sending messages)"""
        if member == ctx.author:
            return await ctx.send("You cannot mute yourself.")
            
        if member.top_role >= ctx.author.top_role and ctx.author != ctx.guild.owner:
            return await ctx.send("You cannot mute someone with a higher or equal role.")
            
        if member.top_role >= ctx.guild.me.top_role:
            return await ctx.send("I cannot mute someone with a higher or equal role than me.")
            
        # Check for or create a muted role
        muted_role = discord.utils.get(ctx.guild.roles, name="Muted")
        
        if muted_role is None:
            # Create the muted role if it doesn't exist
            try:
                muted_role = await ctx.guild.create_role(
                    name="Muted",
                    reason="Created for muting members"
                )
                
                # Update channel permissions for the muted role
                for channel in ctx.guild.channels:
                    try:
                        await channel.set_permissions(
                            muted_role,
                            send_messages=False,
                            speak=False,
                            add_reactions=False
                        )
                    except:
                        pass
                        
            except discord.Forbidden:
                return await ctx.send("I don't have permission to create roles.")
                
        # Default reason if none provided
        reason = reason or f"Muted by {ctx.author}"
        
        try:
            # Add the muted role
            await member.add_roles(muted_role, reason=reason)
            
            # Send confirmation
            embed = discord.Embed(
                title="Member Muted",
                description=f"{member.mention} has been muted.",
                color=discord.Color.orange()
            )
            embed.add_field(name="Reason", value=reason)
            embed.set_footer(text=f"Muted by {ctx.author}")
            
            await ctx.send(embed=embed)
            
        except discord.Forbidden:
            await ctx.send("I don't have permission to manage roles for that member.")
        except discord.HTTPException as e:
            await ctx.send(f"An error occurred while muting: {e}")
            
    @commands.command(name="unmute")
    @commands.has_permissions(manage_roles=True)
    @commands.bot_has_permissions(manage_roles=True)
    async def unmute(self, ctx, member: discord.Member, *, reason=None):
        """Unmute a muted member"""
        muted_role = discord.utils.get(ctx.guild.roles, name="Muted")
        
        if muted_role is None:
            return await ctx.send("There is no Muted role in this server.")
            
        if muted_role not in member.roles:
            return await ctx.send(f"{member.mention} is not muted.")
            
        # Default reason if none provided
        reason = reason or f"Unmuted by {ctx.author}"
        
        try:
            # Remove the muted role
            await member.remove_roles(muted_role, reason=reason)
            
            # Send confirmation
            embed = discord.Embed(
                title="Member Unmuted",
                description=f"{member.mention} has been unmuted.",
                color=discord.Color.green()
            )
            embed.set_footer(text=f"Unmuted by {ctx.author}")
            
            await ctx.send(embed=embed)
            
        except discord.Forbidden:
            await ctx.send("I don't have permission to manage roles for that member.")
        except discord.HTTPException as e:
            await ctx.send(f"An error occurred while unmuting: {e}")

async def setup(bot):
    await bot.add_cog(Admin(bot))