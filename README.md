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
MEMBER_EVENT_CHANNEL_ID=your_server_text_channel_id
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

Set `MEMBER_EVENT_CHANNEL_ID` to the server text channel ID for styled welcome cards. To post departure cards elsewhere, set `LEAVE_EVENT_CHANNEL_ID` to a different text channel ID; if omitted, departure cards continue to use `MEMBER_EVENT_CHANNEL_ID`. On joining, members also receive a welcome DM; when someone leaves, the bot attempts to DM them a departure summary. When a role is added or removed, the member receives a DM listing the role changes, with congratulations for newly added roles. DMs can fail when a member has closed their DMs, so the event card is the dependable record for joins and departures. Enable the **Server Members Intent** for the bot in the Discord Developer Portal; the bot already requests this intent.

Set `SERVER_LOG_CHANNEL_ID` to a private server text channel to enable detailed event logs, separate from the welcome/departure channel. Logs cover member joins/leaves, moderation and ban actions, channel/role changes, voice joins/leaves/moves and mute/deafen/camera/stream changes, and chat messages, edits, deletions, and attachments. Ordinary non-bot messages are logged with their text; messages in the log channel are excluded to prevent recursion. Message content is sensitive; restrict access to this channel to trusted moderators and administrators and follow your community's privacy rules. Enable **Server Members Intent**, **Message Content Intent**, and the bot's **View Audit Log** permission in Discord. The bot also needs permission to view the configured log channel and send embeds there. Enable **Server Voice States Intent** in the Developer Portal for voice activity events. Deleted message text is available only if the bot had the message cached before deletion.

To show live totals in voice channels, set `ALL_MEMBERS_COUNT_CHANNEL_ID`, `MEMBERS_COUNT_CHANNEL_ID`, and `BOTS_COUNT_CHANNEL_ID` to the corresponding voice-channel IDs. On startup, the bot counts the server's members and bots, then updates the channel names when someone joins or leaves. The bot needs **Manage Channels** permission to rename them; the **Server Members Intent** is also required.

The bot rotates through randomized Watching, Playing, Listening, Competing, and Streaming statuses once a minute, with a rotating online/idle/Do Not Disturb presence.

On ordinary human chat, the bot has a 1-in-30 chance to add a random funny reaction, with a five-minute cooldown per server. It skips filtered messages, counting-game channels, and the configured event/log channels. The bot needs **Add Reactions** permission in a channel for reactions to appear.

The bot also has a 1-in-25 chance to reply to an eligible chat message, with a 30-minute cooldown per server. It locally checks a message for broad cues like greetings, thanks, study deadlines, wins, or rough days, then chooses a matching funny or encouraging line; otherwise it may send a lighthearted general reply. It does not send message text to an external service or store it for this feature. Replies skip filtered messages, counting-game channels, and configured event/log channels, and do not ping the author.

It can also post an interactive, context-inspired poll at random (about a 1-in-80 chance per eligible message, with a 45-minute cooldown per server). It matches broad local topics such as games, food, music, work, or rest, and uses a generic server-vibe poll when none match. Members vote using buttons, can change their vote, and see live totals; after five minutes the bot closes the poll and shows the result. It does not quote or externally process the triggering message, and skips filtered messages, counting-game channels, and configured event/log channels.

## Commands

| Category | Commands |
| --- | --- |
| **Quick tools** | `/help`, `/ping`, `/choose`, `/8ball`, `/coinflip`, `/roll`, `/emojify` |
| **Server & profiles** | `/membercount`, `/serverinfo`, `/userinfo`, `/avatar`, `/level`, `/leaderboard`, `/profile`, `/inventory`, `/gameleaderboard` |
| **For fun** | `/pepe`, `/slap`, `/bulla`, `/joke`, `/quote`, `/wiki` |
| **Games & economy** | `/beg`, `/hunt`, `/dig`, `/rob`, `/gamble`, `/fish`, `/hack`, `/highlow`, `/crime`, `/job`, `/tictactoe`, `/countingstart`, `/countingstop` |
| **Moderation** | `/badword`, `/kick`, `/mute`, `/unmute`, `/warn` |
| **Messaging** | `/dm`, `/send` |

Use `/help` for a categorized command guide. Commands with options guide you through their inputs in Discord. For example, `/choose` accepts comma-separated options, and `/userinfo` can take an optional member.

`/pepe` shows a playful, randomly generated Pepe vibe score for you or a selected member. It is just a meme-style check, not a real measurement.

`/badword add`, `/badword remove`, and `/badword list` manage up to 50 case-insensitive words or phrases per server; entries persist in `level.db`. Members without **Manage Messages** have matching messages deleted, receive a DM warning, and see a temporary channel notice. The action is sent to `SERVER_LOG_CHANNEL_ID` when configured. Matching is whole-word/phrase based, so a filtered word does not match as a substring inside a longer word. The bot needs **Manage Messages** in each channel where it should enforce the filter. Messages from moderators with **Manage Messages** are exempt.

Server messages earn 15–25 XP, with a one-minute cooldown per member. Each 100 XP advances a level. `/level` shows your progress (or another member’s), and `/leaderboard` ranks the server. Progress is stored in the existing `level.db` SQLite file; no database migration is needed for this upgrade. Back up that file with the bot’s data. If you later run multiple bot instances or move to managed hosting, migrate the data to a shared database such as PostgreSQL.

The economy commands give members different ways to earn cash and collectibles: `/beg`, `/hunt`, `/dig`, `/fish`, and `/job` pay out; `/rob` attempts to transfer cash from another player; `/crime` and `/hack` have risky outcomes; `/gamble` risks a chosen wager; and `/highlow` presents Higher/Lower buttons for a player-controlled round. Most game results animate through short embed updates; `/highlow` and `/tictactoe` use interactive buttons. Each economy action has its own cooldown. Robbery targets must be another human member, and their wallet cannot be driven below zero.

While members are chatting, a server gets a random loot drop every 5–15 minutes. The drop appears in the most recently active eligible text channel and expires after two minutes; the first member to press **SNATCH THE LOOT** wins its cash and a random collectible. Collectibles use weighted rarity tiers, from Common to Legendary. Rewards and inventories are server-specific and persist in `level.db`. Use `/profile` to see a member’s level, wallet, and collection highlights, `/inventory` to inspect collectibles and rarity totals, and `/gameleaderboard` to rank players by cash (then collectible count). `/leaderboard` continues to rank XP levels.

`/countingstart` starts a channel-local counting game at 1. Members take turns posting the next number; a wrong number or consecutive turn ends the game and shows the score. `/countingstop` ends it early. Counting requires the **Message Content Intent** to be enabled for the bot in the Discord Developer Portal, in addition to `GatewayIntentBits.MessageContent` in the code.

`/tictactoe` starts an interactive button game. Leave `opponent` empty to play against the computer, or select a server member for multiplayer. Multiplayer games choose the first player at random; solo games use an unbeatable computer opponent. Games expire after five minutes of inactivity.

`/dm` accepts one `user_id`, a comma- or newline-separated `user_ids` list (up to 50 unique IDs), or `all_members` for every human member of the current server (up to 2,500 recipients per command). The all-members option is restricted to server administrators and requires an in-command confirmation; bots are skipped. The command sends separately to each recipient, reports delivery failures, and spaces out sends to reduce rate limiting. Use it only for appropriate, expected communications; use a server announcement channel when possible. It requires **Manage Messages** for targeted DMs. In embed mode, configure `embed_author`, `embed_author_url`, `embed_author_icon_url`, `embed_title`, `embed_description`, `embed_url`, `embed_color`, `embed_image_url`, `embed_thumbnail_url`, `embed_footer`, `embed_footer_icon_url`, and `embed_timestamp`. The `message` option remains a fallback description. `embed_fields` accepts one `Name | Value` pair per line (up to 25 fields). Optional `hide_sender` and `hide_guild` settings hide attribution; both are shown by default. Replies recipients send to the bot in the next 24 hours are posted in channel `889153321359769690`. Recipients must allow DMs from the bot.

`/send` posts a message or a customized embed in a selected server text channel. It uses the same embed options as `/dm` and requires **Manage Messages** permission. The bot needs permission to send messages and embeds in the target channel. Mentions are disabled to prevent accidental pings.

## Permissions

Moderation commands are limited by Discord command permissions and require the bot to have the matching server permissions. The bot's highest role must also be above any member it moderates. Available moderation actions depend on those permissions and the server's role hierarchy.

## Development

```bash
npm run check
```

The previous Python implementation remains in `main.py` for reference. `index.js` is the active bot entry point.
