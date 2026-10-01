<div align="center">

# ROck

### A small, server-ready Discord bot powered by slash commands.

![Node.js 22.12+](https://img.shields.io/badge/Node.js-22.12%2B-43853d?logo=node.js&logoColor=white)
![discord.js 14](https://img.shields.io/badge/discord.js-v14-5865F2?logo=discord&logoColor=white)
![Slash commands](https://img.shields.io/badge/commands-slash-2f855a)

</div>

ROck brings everyday server utilities, lighthearted commands, and basic moderation together in a JavaScript bot. Commands are registered with Discord and are available from the `/` command picker.

## Get started

**Requirements:** Node.js 22.12 or later and a Discord application with a bot user.

```bash
npm install
cp .env.example .env
```

Add your bot token to `.env`:

```dotenv
DISCORD_TOKEN=your_bot_token
```

Invite the bot with the `bot` and `applications.commands` OAuth2 scopes, then run:

```bash
npm start
```

The bot registers commands when it connects. Global commands can take a while to appear. For immediate testing in one server, add a guild ID to `.env`:

```dotenv
DISCORD_GUILD_ID=your_test_server_id
```

Remove that setting to register commands globally. Keep `.env` private; it is excluded from Git.

## Commands

| Category | Commands |
| --- | --- |
| **Quick tools** | `/ping`, `/choose`, `/8ball`, `/coinflip`, `/roll`, `/emojify` |
| **Server & profiles** | `/membercount`, `/serverinfo`, `/userinfo`, `/avatar` |
| **For fun** | `/slap`, `/bulla`, `/joke`, `/quote`, `/wiki` |
| **Moderation** | `/kick`, `/mute`, `/unmute`, `/warn` |

Commands with options guide you through their inputs in Discord. For example, `/choose` accepts comma-separated options, and `/userinfo` can take an optional member.

## Permissions

Moderation commands are limited by Discord command permissions and require the bot to have the matching server permissions. The bot's highest role must also be above any member it moderates. Available moderation actions depend on those permissions and the server's role hierarchy.

## Development

```bash
npm run check
```

The previous Python implementation remains in `main.py` for reference. `index.js` is the active bot entry point.
