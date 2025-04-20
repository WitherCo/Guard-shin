# JMusicBot Command Guide

## Introduction

Guard-shin now offers enhanced music playback through JMusicBot integration. This system provides superior audio quality, better stability, and expanded features compared to the standard JavaScript-based music player.

## Available Commands

JMusicBot commands can be used in two ways:
1. **Slash Commands** - Use the `/jm...` commands (such as `/jmplay`, `/jmskip`, etc.)
2. **Direct Commands** - Type commands directly in chat with the `;` prefix (such as `;play`, `;skip`, etc.)

> **Note:** New slash commands may take up to an hour to appear in all Discord servers after being added. They will appear faster in our [support server](https://discord.gg/g3rFbaW6gw).

## Command List

### Basic Commands (Available to everyone)

| Slash Command | Direct Command | Description |
|---------------|----------------|-------------|
| `/jmplay [query]` | `;play [query]` | Play a song from YouTube/URL or add it to queue |
| `/jmskip` | `;skip` | Skip the current song |
| `/jmstop` | `;stop` | Stop playback and clear the queue |
| `/jmqueue` | `;queue` | Show the current music queue |
| `/jmpause` | `;pause` | Pause the current song |
| `/jmresume` | `;resume` | Resume playback after pausing |
| `/jmnp` | `;np` | Display information about the current song |
| `/jmstatus` | `;status` | Check if JMusicBot is active |
| `/jmhelp` | `;help` | Show help information |

### Premium Commands (✨ Premium users only)

| Slash Command | Direct Command | Description |
|---------------|----------------|-------------|
| `/jmvolume [level]` | `;volume [level]` | Adjust the volume (0-100) |
| `/jmloop [mode]` | `;loop [mode]` | Toggle loop mode (off/song/queue) |
| `/jmplaylist [url]` | `;playlist [url]` | Play a whole playlist from URL |
| `/jmlyrics [song]` | `;lyrics [song]` | Get lyrics for the current or specified song |

## How It Works

The JMusicBot system works alongside our JavaScript music player. If JMusicBot is running, commands are forwarded to it. If not, the regular JavaScript player is used as a fallback.

### Benefits of JMusicBot:

- ✅ Higher quality audio playback
- ✅ Better stability with prolonged usage
- ✅ Support for more platforms and formats
- ✅ Advanced features like lyrics and playlist support
- ✅ More efficient resource usage

## Troubleshooting

- **Commands not appearing?** New slash commands can take up to an hour to propagate to all Discord servers. In the meantime, you can use the direct commands with the `;` prefix.
- **Audio cutting out?** Try using the volume command to lower the volume slightly.
- **Bot not responding to music commands?** Use `/jmstatus` to check if JMusicBot is active. If not, try again later or use the regular music commands (without the "jm" prefix).

## Get Premium

Premium features include volume control, loop mode, playlist support, and lyrics. Join our [support server](https://discord.gg/g3rFbaW6gw) to purchase premium.