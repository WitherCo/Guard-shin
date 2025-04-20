# Auto-Moderation Guide

Guard-shin provides a powerful auto-moderation system to help maintain a clean and safe environment in your Discord server.

## Getting Started with Auto-Moderation

To begin configuring auto-moderation, use the command:
```
/automod
```

This will open an interactive menu to configure various auto-moderation features.

## Available Auto-Moderation Features

### Profanity Filter

Automatically detects and filters messages containing profanity.

**Configuration:**
```
/filter profanity enable
```

You can customize the severity level:
```
/filter profanity severity <low|medium|high>
```

### Anti-Spam

Prevents users from spamming messages, emotes, or mentions.

**Configuration:**
```
/antispam enable
```

Options include:
- Message threshold: `/antispam messages <count> <seconds>`
- Emote threshold: `/antispam emotes <count> <seconds>`
- Mention threshold: `/antispam mentions <count>`

### Link Protection

Controls which types of links can be posted in your server.

**Configuration:**
```
/filter links enable
```

Options include:
- Allow/disallow Discord invites: `/filter invites <allow|deny>`
- Allow/disallow social media: `/filter social <allow|deny>`
- Custom domain whitelist/blacklist: `/filter domains <add|remove> <domain>`

### Caps Filter

Prevents excessive use of capital letters.

**Configuration:**
```
/filter caps enable <percentage>`
```
Where `percentage` is the maximum percentage of capital letters allowed (recommended: 70%).

### Mass Mention Protection

Prevents abuse of @everyone, @here, or mass user mentions.

**Configuration:**
```
/filter mentions enable <threshold>`
```
Where `threshold` is the maximum number of mentions allowed in a single message.

## Automated Actions

For each violation, you can configure one or more automated actions:

### Available Actions

- **Delete Message**: Removes the offending message
- **Warning**: Issues a warning to the user
- **Timeout (Mute)**: Temporarily mutes the user
- **Kick**: Removes the user from the server (they can rejoin with an invite)
- **Ban**: Permanently removes the user from the server

### Configuring Actions

To set actions for a specific filter:
```
/automod actions <filter_name> <action1,action2,...>
```

Example:
```
/automod actions profanity delete,warn
```

## Exemptions

You can exempt certain roles, channels, or users from auto-moderation.

### Role Exemptions
```
/automod exempt role <role_name>
```

### Channel Exemptions
```
/automod exempt channel <channel_name>
```

### User Exemptions
```
/automod exempt user <username>
```

## Logging

To monitor auto-moderation actions, set up a moderation log channel:
```
/logs moderation <channel>
```

This channel will receive detailed information about every auto-moderation action taken.

## Premium Auto-Moderation Features

With a premium subscription, Guard-shin offers enhanced auto-moderation capabilities:

- **AI-powered content filtering**: More accurate detection of inappropriate content
- **Context-aware moderation**: Understands message context to reduce false positives
- **Custom filter word lists**: Create personalized lists of allowed/blocked words
- **Advanced regex filtering**: Use regular expressions for complex pattern matching
- **Auto-moderation analytics**: Track and analyze moderation actions over time

To access these features, use:
```
/premium activate
```

## Best Practices

1. **Start with minimal settings**: Begin with basic settings and gradually increase strictness as needed
2. **Use a test channel**: Test your auto-moderation settings in a private channel first
3. **Balance moderation and freedom**: Overly strict settings can frustrate users
4. **Regularly review logs**: Check moderation logs to ensure the system is working as expected
5. **Communicate rules clearly**: Make sure server members understand what content is not allowed