process.loadEnvFile();

const {
  ActionRowBuilder,
  ActivityType,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  Client,
  ComponentType,
  EmbedBuilder,
  Events,
  GatewayIntentBits,
  MessageFlags,
  Partials,
  PermissionFlagsBits,
  SlashCommandBuilder,
} = require('discord.js');
const { randomInt, randomUUID } = require('node:crypto');
const { join } = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const { computeMove, determineWinner } = require('tic-tac-toe-ai-engine');

const levelDb = new DatabaseSync(join(__dirname, 'level.db'));
levelDb.exec('CREATE TABLE IF NOT EXISTS levels (level INTEGER, xp INTEGER, user INTEGER, guild INTEGER)');
const findLevel = levelDb.prepare('SELECT level, xp FROM levels WHERE user = ? AND guild = ? ORDER BY level DESC, xp DESC LIMIT 1');
const insertLevel = levelDb.prepare('INSERT INTO levels (level, xp, user, guild) VALUES (0, 0, ?, ?)');
const updateLevel = levelDb.prepare('UPDATE levels SET level = ?, xp = ? WHERE user = ? AND guild = ?');
const getLeaderboard = levelDb.prepare('SELECT CAST(user AS TEXT) AS user, MAX(level) AS level, MAX(xp) AS xp FROM levels WHERE guild = ? GROUP BY user ORDER BY level DESC, xp DESC LIMIT 10');
const levelCooldowns = new Map();
const countingGames = new Map();
const xpPerLevel = 100;
const levelCooldownMs = 60_000;
const helpCategories = [
  { name: '⚡ Quick tools', commands: ['help', 'ping', 'choose', '8ball', 'coinflip', 'roll', 'emojify'] },
  { name: '👤 Server & profiles', commands: ['membercount', 'serverinfo', 'userinfo', 'avatar', 'level', 'leaderboard'] },
  { name: '🎮 Games', commands: ['countingstart', 'countingstop', 'tictactoe'] },
  { name: '✨ Fun & community', commands: ['slap', 'bulla', 'joke', 'quote', 'wiki'] },
  { name: '🛡️ Moderation', commands: ['kick', 'mute', 'unmute', 'warn'] },
  { name: '📨 Messaging', commands: ['send', 'dm'] },
];

function readLevel(userId, guildId) {
  const record = findLevel.get(userId, guildId);
  return { level: Number(record?.level ?? 0), xp: Number(record?.xp ?? 0) };
}

function addMessageXp(userId, guildId, amount) {
  const record = findLevel.get(userId, guildId);
  let level = Number(record?.level ?? 0);
  let xp = Number(record?.xp ?? 0) + amount;
  let levelsGained = 0;
  while (xp >= xpPerLevel) {
    xp -= xpPerLevel;
    level += 1;
    levelsGained += 1;
  }

  if (!record) insertLevel.run(userId, guildId);
  updateLevel.run(level, xp, userId, guildId);
  return { level, xp, levelsGained };
}

async function finishCountingGame(game, description, color) {
  countingGames.delete(game.channel.id);
  const scores = [...game.scores.entries()].sort((left, right) => right[1] - left[1]).slice(0, 10);
  const embed = new EmbedBuilder().setColor(color)
    .setTitle('Counting game ended')
    .setDescription(`${description}\n\nThe count reached **${game.nextNumber - 1}**.`)
    .setFooter({ text: 'Top player scores' });
  if (scores.length) {
    embed.addFields({
      name: 'Scoreboard',
      value: scores.map(([userId, score], index) => `**${index + 1}.** <@${userId}> · ${score} point${score === 1 ? '' : 's'}`).join('\n'),
    });
  } else {
    embed.addFields({ name: 'Scoreboard', value: 'No points scored.' });
  }
  await game.channel.send({ embeds: [embed] });
}

function ticTacToeComponents(game) {
  return [0, 3, 6].map(rowStart => new ActionRowBuilder().addComponents(
    game.board.slice(rowStart, rowStart + 3).map((mark, column) => {
      const index = rowStart + column;
      return new ButtonBuilder()
        .setCustomId(`ttt:${game.id}:${index}`)
        .setLabel(mark || String(index + 1))
        .setStyle(mark === 'X' ? ButtonStyle.Primary : mark === 'O' ? ButtonStyle.Danger : ButtonStyle.Secondary)
        .setDisabled(game.finished || Boolean(mark));
    }),
  ));
}

function ticTacToeEmbed(game) {
  const playerX = `<@${game.playerXId}>`;
  const playerO = game.mode === 'solo' ? 'Computer' : `<@${game.playerOId}>`;
  let status;
  if (game.winnerMark) {
    const winner = game.winnerMark === 'X' ? playerX : playerO;
    status = `🏆 ${winner} wins!`;
  } else if (game.draw) {
    status = '🤝 It is a draw.';
  } else {
    const currentPlayer = game.turn === 'X' ? playerX : playerO;
    status = `${currentPlayer}'s turn (${game.turn})`;
  }

  return new EmbedBuilder().setColor(game.winnerMark ? 0x49c77a : game.draw ? 0x95a5a6 : 0x40b7e6)
    .setTitle(game.mode === 'solo' ? 'Tic-Tac-Toe · Solo' : 'Tic-Tac-Toe · Multiplayer')
    .setDescription(`**X** ${playerX}  vs  **O** ${playerO}\n\n${status}`)
    .setFooter({ text: 'Select an open square to make your move' });
}

function finishTicTacToeTurn(game) {
  game.winnerMark = determineWinner(game.board);
  game.draw = !game.winnerMark && game.board.every(Boolean);
  game.finished = Boolean(game.winnerMark || game.draw);
}

const token = process.env.DISCORD_TOKEN;
if (!token) {
  throw new Error('DISCORD_TOKEN is required. Copy .env.example to .env and configure it.');
}

const commands = [
  new SlashCommandBuilder().setName('help').setDescription('Browse commands by category'),
  new SlashCommandBuilder().setName('ping').setDescription('Check bot latency'),
  new SlashCommandBuilder().setName('choose').setDescription('Choose one option at random')
    .addStringOption(option => option.setName('options').setDescription('Options separated by commas').setRequired(true).setMaxLength(1000)),
  new SlashCommandBuilder().setName('8ball').setDescription('Ask the magic 8-ball a question')
    .addStringOption(option => option.setName('question').setDescription('Your question').setRequired(true).setMaxLength(500)),
  new SlashCommandBuilder().setName('coinflip').setDescription('Flip a coin'),
  new SlashCommandBuilder().setName('roll').setDescription('Roll a six-sided die'),
  new SlashCommandBuilder().setName('emojify').setDescription('Convert text to regional indicator emoji')
    .addStringOption(option => option.setName('text').setDescription('Text to convert').setRequired(true).setMaxLength(100)),
  new SlashCommandBuilder().setName('avatar').setDescription("Show a user's avatar")
    .addUserOption(option => option.setName('user').setDescription('User whose avatar to show')),
  new SlashCommandBuilder().setName('membercount').setDescription('Show the server member count'),
  new SlashCommandBuilder().setName('serverinfo').setDescription('Show information about this server'),
  new SlashCommandBuilder().setName('userinfo').setDescription('Show information about a server member')
    .addUserOption(option => option.setName('user').setDescription('Member to inspect')),
  new SlashCommandBuilder().setName('level').setDescription('Show your level and chat progress')
    .addUserOption(option => option.setName('user').setDescription('Member to inspect')),
  new SlashCommandBuilder().setName('leaderboard').setDescription('Show this server’s top levels'),
  new SlashCommandBuilder().setName('countingstart').setDescription('Start a counting game in this channel'),
  new SlashCommandBuilder().setName('countingstop').setDescription('End the counting game in this channel'),
  new SlashCommandBuilder().setName('tictactoe').setDescription('Play Tic-Tac-Toe against a friend or the computer')
    .addUserOption(option => option.setName('opponent').setDescription('Choose a server member for multiplayer; omit for solo')),
  new SlashCommandBuilder().setName('slap').setDescription('Playfully slap a server member')
    .addUserOption(option => option.setName('user').setDescription('Member to slap')),
  new SlashCommandBuilder().setName('bulla').setDescription('Send the playful bulla image')
    .addUserOption(option => option.setName('user').setDescription('Member to feature')),
  new SlashCommandBuilder().setName('joke').setDescription('Get a random joke'),
  new SlashCommandBuilder().setName('quote').setDescription('Get a random quote'),
  new SlashCommandBuilder().setName('wiki').setDescription('Get a short Wikipedia summary')
    .addStringOption(option => option.setName('query').setDescription('Topic to search').setRequired(true).setMaxLength(200)),
  new SlashCommandBuilder().setName('kick').setDescription('Kick a member from this server')
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption(option => option.setName('user').setDescription('Member to kick').setRequired(true))
    .addStringOption(option => option.setName('reason').setDescription('Reason for the kick').setMaxLength(500)),
  new SlashCommandBuilder().setName('mute').setDescription('Timeout a member')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(option => option.setName('user').setDescription('Member to timeout').setRequired(true))
    .addIntegerOption(option => option.setName('minutes').setDescription('Timeout duration, in minutes').setRequired(true).setMinValue(1).setMaxValue(40320))
    .addStringOption(option => option.setName('reason').setDescription('Reason for the timeout').setMaxLength(500)),
  new SlashCommandBuilder().setName('unmute').setDescription('Remove a member timeout')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(option => option.setName('user').setDescription('Member to untimeout').setRequired(true))
    .addStringOption(option => option.setName('reason').setDescription('Reason for removing the timeout').setMaxLength(500)),
  new SlashCommandBuilder().setName('warn').setDescription('Send a warning to a member')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(option => option.setName('user').setDescription('Member to warn').setRequired(true))
    .addStringOption(option => option.setName('reason').setDescription('Reason for the warning').setRequired(true).setMaxLength(500)),
  new SlashCommandBuilder().setName('send').setDescription('Send a message or embed to a server channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addChannelOption(option => option.setName('channel').setDescription('Text channel to post in').setRequired(true)
      .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement, ChannelType.AnnouncementThread, ChannelType.PublicThread, ChannelType.PrivateThread))
    .addStringOption(option => option.setName('message').setDescription('Message text, or fallback embed description').setMaxLength(2000))
    .addBooleanOption(option => option.setName('embed').setDescription('Send as an embed'))
    .addStringOption(option => option.setName('embed_title').setDescription('Optional embed title').setMaxLength(256))
    .addStringOption(option => option.setName('embed_color').setDescription('Optional hex color, for example #5865F2').setMaxLength(7))
    .addStringOption(option => option.setName('embed_fields').setDescription('Optional fields: Name | Value, one per line').setMaxLength(1000))
    .addStringOption(option => option.setName('embed_author').setDescription('Optional embed author name').setMaxLength(256))
    .addStringOption(option => option.setName('embed_author_url').setDescription('Optional author link URL').setMaxLength(500))
    .addStringOption(option => option.setName('embed_author_icon_url').setDescription('Optional author icon URL').setMaxLength(500))
    .addStringOption(option => option.setName('embed_description').setDescription('Embed description (uses message if omitted)').setMaxLength(4000))
    .addStringOption(option => option.setName('embed_url').setDescription('Optional URL linked from the embed title').setMaxLength(500))
    .addStringOption(option => option.setName('embed_image_url').setDescription('Optional large embed image URL').setMaxLength(500))
    .addStringOption(option => option.setName('embed_thumbnail_url').setDescription('Optional embed thumbnail URL').setMaxLength(500))
    .addStringOption(option => option.setName('embed_footer').setDescription('Optional footer text').setMaxLength(2048))
    .addBooleanOption(option => option.setName('embed_timestamp').setDescription('Show the current time in the embed'))
    .addStringOption(option => option.setName('embed_footer_icon_url').setDescription('Optional footer icon URL').setMaxLength(500)),
  new SlashCommandBuilder().setName('dm').setDescription('Send a direct message to a user by ID')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption(option => option.setName('user_id').setDescription('Discord user ID').setRequired(true).setMinLength(17).setMaxLength(20))
    .addStringOption(option => option.setName('message').setDescription('Message to send, or fallback embed description').setMaxLength(1600))
    .addBooleanOption(option => option.setName('hide_sender').setDescription('Hide your name from the recipient'))
    .addBooleanOption(option => option.setName('hide_guild').setDescription('Hide this server name from the recipient'))
    .addBooleanOption(option => option.setName('embed').setDescription('Send the message as an embed'))
    .addStringOption(option => option.setName('embed_title').setDescription('Optional embed title').setMaxLength(256))
    .addStringOption(option => option.setName('embed_color').setDescription('Optional hex color, for example #5865F2').setMaxLength(7))
    .addStringOption(option => option.setName('embed_fields').setDescription('Optional fields: Name | Value, one per line').setMaxLength(1000))
    .addStringOption(option => option.setName('embed_author').setDescription('Optional embed author name').setMaxLength(256))
    .addStringOption(option => option.setName('embed_author_url').setDescription('Optional author link URL').setMaxLength(500))
    .addStringOption(option => option.setName('embed_author_icon_url').setDescription('Optional author icon URL').setMaxLength(500))
    .addStringOption(option => option.setName('embed_description').setDescription('Embed description (uses message if omitted)').setMaxLength(4000))
    .addStringOption(option => option.setName('embed_url').setDescription('Optional URL linked from the embed title').setMaxLength(500))
    .addStringOption(option => option.setName('embed_image_url').setDescription('Optional large embed image URL').setMaxLength(500))
    .addStringOption(option => option.setName('embed_thumbnail_url').setDescription('Optional embed thumbnail URL').setMaxLength(500))
    .addStringOption(option => option.setName('embed_footer').setDescription('Optional embed footer text').setMaxLength(2048))
    .addBooleanOption(option => option.setName('embed_timestamp').setDescription('Show the current time in the embed'))
    .addStringOption(option => option.setName('embed_footer_icon_url').setDescription('Optional footer icon URL').setMaxLength(500)),
].map(command => command.toJSON());

const dmReplyRoutes = new Map();
const dmReplyWindowMs = 24 * 60 * 60 * 1000;
const dmReplyChannelId = '889153321359769690';

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.DirectMessages],
  partials: [Partials.Channel],
});

const eightBallAnswers = [
  'It is certain.', 'Without a doubt.', 'Yes, definitely.', 'Most likely.',
  'The outlook is good.', 'Signs point to yes.', 'Ask again later.',
  'Cannot predict now.', 'Concentrate and ask again.', 'Do not count on it.',
  'My reply is no.', 'Very doubtful.',
];
const slapReasons = [
  'being too silly', 'being too cool', 'no reason at all', 'being too savage',
  'stealing hearts', 'not studying', 'being too stressed',
];
const activityDescriptions = [
  'Breaking Bad', 'over the MODS', 'over the Server', 'the Bots', '| >help',
  'Peaky Blinders', 'the sky', 'DMs', 'Youtube', 'Memes', 'over members',
  '#Text Channels', 'Voice Channels', '| >help', '| >help', '| >help',
  'Stranger Things', 'DMs', 'DMs', 'football', 'Soccer', 'UFC', 'WWE',
  'NBA', 'the moon',
];

function profileEmbed(user, title) {
  return new EmbedBuilder()
    .setColor(0x40b7e6)
    .setTitle(title)
    .setThumbnail(user.displayAvatarURL({ size: 512 }))
    .setURL(user.displayAvatarURL({ size: 1024 }));
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: { 'User-Agent': 'ROck Discord bot' } });
  if (!response.ok) throw new Error(`Request failed with HTTP ${response.status}`);
  return response.json();
}

client.once(Events.ClientReady, async readyClient => {
  const updateActivity = () => {
    const description = activityDescriptions[randomInt(activityDescriptions.length)];
    readyClient.user.setActivity(description, { type: ActivityType.Watching });
  };
  updateActivity();
  setInterval(updateActivity, 30_000);

  try {
    const guildId = process.env.DISCORD_GUILD_ID;
    if (guildId) {
      await readyClient.application.commands.set(commands, guildId);
      console.log(`Registered ${commands.length} guild slash commands in ${guildId}`);
    } else {
      await readyClient.application.commands.set(commands);
      console.log(`Registered ${commands.length} global slash commands`);
    }
  } catch (error) {
    console.error('Could not register slash commands:', error);
  }
  console.log(`Logged in as ${readyClient.user.tag}`);
});

client.on(Events.MessageCreate, async message => {
  if (message.guild || message.author.bot) return;

  const route = dmReplyRoutes.get(message.author.id);
  if (!route) return;
  if (route.expiresAt <= Date.now()) {
    dmReplyRoutes.delete(message.author.id);
    return;
  }

  try {
    const channel = await client.channels.fetch(dmReplyChannelId);
    if (!channel?.isTextBased() || typeof channel.send !== 'function') {
      throw new Error(`Reply channel ${dmReplyChannelId} is not a sendable text channel`);
    }

    const header = `Reply from ${message.author.tag} (${message.author.id}):\n`;
    let reply = `${header}${(message.content || '(No text content)').slice(0, 2000 - header.length)}`;
    for (const attachment of message.attachments.values()) {
      const link = `\nAttachment: ${attachment.url}`;
      if (reply.length + link.length > 2000) break;
      reply += link;
    }
    await channel.send({ content: reply, allowedMentions: { parse: [] } });
  } catch (error) {
    console.error('Could not forward DM reply:', error);
  }
});

client.on(Events.MessageCreate, async message => {
  if (!message.guild || message.author.bot) return;
  const game = countingGames.get(message.channelId);
  if (!game || !/^[+-]?\d+$/.test(message.content.trim())) return;

  const number = Number(message.content.trim());
  if (game.lastUserId === message.author.id) {
    void message.react('❌').catch(() => null);
    await finishCountingGame(game, `${message.author} ended the run by counting twice in a row.`, 0xed4245);
    return;
  }
  if (number !== game.nextNumber) {
    void message.react('❌').catch(() => null);
    await finishCountingGame(game, `${message.author} entered **${number}** instead of **${game.nextNumber}**.`, 0xed4245);
    return;
  }

  game.scores.set(message.author.id, (game.scores.get(message.author.id) ?? 0) + 1);
  game.nextNumber += 1;
  game.lastUserId = message.author.id;
  await message.react('✅').catch(() => null);
});

client.on(Events.MessageCreate, async message => {
  if (!message.guild || message.author.bot) return;

  const now = Date.now();
  const cooldownKey = `${message.guild.id}:${message.author.id}`;
  if (now - (levelCooldowns.get(cooldownKey) ?? 0) < levelCooldownMs) return;

  try {
    const updated = addMessageXp(message.author.id, message.guild.id, randomInt(15, 26));
    levelCooldowns.set(cooldownKey, now);
    if (levelCooldowns.size > 5000) {
      for (const [key, timestamp] of levelCooldowns) {
        if (now - timestamp >= levelCooldownMs) levelCooldowns.delete(key);
      }
    }

    if (updated.levelsGained > 0) {
      const embed = new EmbedBuilder().setColor(0xf1c40f)
        .setAuthor({ name: '🎉 Congratulations!', iconURL: message.author.displayAvatarURL() })
        .setTitle(`${message.author.username} reached Level ${updated.level}!`)
        .setDescription(`Your activity paid off. You have **${updated.xp}/${xpPerLevel} XP** toward the next level.`)
        .setTimestamp();
      await message.channel.send({ content: `🥳 Congratulations ${message.author}!`, embeds: [embed] });
    }
  } catch (error) {
    console.error('Could not update level progress:', error);
  }
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  try {
    const { commandName, options } = interaction;
    switch (commandName) {
      case 'help': {
        const commandByName = new Map(commands.map(command => [command.name, command]));
        const embed = new EmbedBuilder().setColor(0x5865f2)
          .setAuthor({ name: 'ROck · COMMAND GUIDE', iconURL: client.user.displayAvatarURL() })
          .setTitle('Find your next command')
          .setDescription('Everything you need to keep your server moving.\n\nChoose any command from the `/` menu to see its options.')
          .addFields(helpCategories.map(category => ({
            name: category.name,
            value: category.commands
              .map(name => commandByName.get(name))
              .filter(Boolean)
              .map(command => `\`/${command.name}\` — ${command.description}`)
              .join('\n'),
            inline: true,
          })))
          .setFooter({ text: `${commands.length} commands · Built for your server` })
          .setTimestamp();
        await interaction.reply({ embeds: [embed] });
        break;
      }
      case 'level': {
        if (!interaction.inGuild()) {
          return interaction.reply({ content: 'Use this command in a server.', flags: MessageFlags.Ephemeral });
        }
        const user = options.getUser('user') ?? interaction.user;
        const { level, xp } = readLevel(user.id, interaction.guildId);
        const progress = Math.min(12, Math.floor((xp / xpPerLevel) * 12));
        const embed = new EmbedBuilder().setColor(0x49c7a4)
          .setTitle(`${user.username}'s Level`)
          .setThumbnail(user.displayAvatarURL({ size: 256 }))
          .addFields(
            { name: 'Level', value: `**${level}**`, inline: true },
            { name: 'XP', value: `**${xp} / ${xpPerLevel}**`, inline: true },
            { name: 'Progress to next level', value: `${'█'.repeat(progress)}${'░'.repeat(12 - progress)}  ${xp}%` },
          )
          .setFooter({ text: 'Chat in the server to earn XP; rewards have a one-minute cooldown.' });
        await interaction.reply({ embeds: [embed] });
        break;
      }
      case 'countingstart': {
        if (!interaction.inGuild()) {
          return interaction.reply({ content: 'Start the counting game in a server channel.', flags: MessageFlags.Ephemeral });
        }
        if (countingGames.has(interaction.channelId)) {
          return interaction.reply({ content: 'A counting game is already active in this channel.', flags: MessageFlags.Ephemeral });
        }

        const game = { channel: interaction.channel, nextNumber: 1, lastUserId: null, scores: new Map() };
        countingGames.set(interaction.channelId, game);
        const embed = new EmbedBuilder().setColor(0xf1a34a)
          .setTitle('Counting starts now')
          .setDescription('Take turns counting up from **1**. One number per message; consecutive turns by the same person or a wrong number ends the run.')
          .setFooter({ text: 'Correct counts earn one point · Use /countingstop to end the game' });
        await interaction.reply({ embeds: [embed] });
        break;
      }
      case 'tictactoe': {
        if (!interaction.inGuild()) {
          return interaction.reply({ content: 'Start Tic-Tac-Toe in a server.', flags: MessageFlags.Ephemeral });
        }
        const opponent = options.getUser('opponent');
        if (opponent?.id === interaction.user.id) {
          return interaction.reply({ content: 'Choose another member, or leave opponent empty to play solo.', flags: MessageFlags.Ephemeral });
        }
        if (opponent?.bot) {
          return interaction.reply({ content: 'Choose a human opponent, or leave opponent empty to play against the computer.', flags: MessageFlags.Ephemeral });
        }

        const game = {
          id: randomUUID(),
          mode: opponent ? 'multiplayer' : 'solo',
          playerXId: interaction.user.id,
          playerOId: opponent?.id ?? null,
          board: Array(9).fill(''),
          turn: opponent && randomInt(2) === 1 ? 'O' : 'X',
          winnerMark: null,
          draw: false,
          finished: false,
          processing: false,
        };
        await interaction.reply({ embeds: [ticTacToeEmbed(game)], components: ticTacToeComponents(game) });
        const boardMessage = await interaction.fetchReply();
        const collector = boardMessage.createMessageComponentCollector({ componentType: ComponentType.Button, time: 300_000 });
        collector.on('collect', async component => {
          const userId = game.turn === 'X' ? game.playerXId : game.playerOId;
          if (component.user.id !== userId || game.processing || game.finished) {
            await component.reply({ content: game.finished ? 'This game has ended.' : 'It is not your turn.', flags: MessageFlags.Ephemeral });
            return;
          }

          const index = Number(component.customId.split(':').at(-1));
          if (!Number.isInteger(index) || index < 0 || index > 8 || game.board[index]) {
            await component.reply({ content: 'That square is no longer available.', flags: MessageFlags.Ephemeral });
            return;
          }

          game.processing = true;
          try {
            game.board[index] = game.turn;
            finishTicTacToeTurn(game);
            if (!game.finished && game.mode === 'solo') {
              game.turn = 'O';
              game.board = computeMove(game.board).nextBestGameState;
              finishTicTacToeTurn(game);
              if (!game.finished) game.turn = 'X';
            } else if (!game.finished) {
              game.turn = game.turn === 'X' ? 'O' : 'X';
            }

            await component.update({ embeds: [ticTacToeEmbed(game)], components: ticTacToeComponents(game) });
            if (game.finished) collector.stop('finished');
          } catch (error) {
            console.error('Tic-Tac-Toe move failed:', error);
            await component.followUp({ content: 'That move could not be processed. Please start a new game.', flags: MessageFlags.Ephemeral }).catch(() => null);
          } finally {
            game.processing = false;
          }
        });
        collector.on('end', async (_, reason) => {
          if (reason === 'time' && !game.finished) {
            game.finished = true;
            await boardMessage.edit({
              embeds: [new EmbedBuilder().setColor(0x95a5a6).setTitle('Tic-Tac-Toe · Game expired').setDescription('Start another game whenever you are ready.')],
              components: ticTacToeComponents(game),
            }).catch(() => null);
          }
        });
        break;
      }
      case 'countingstop': {
        if (!interaction.inGuild()) {
          return interaction.reply({ content: 'Stop the counting game from its server channel.', flags: MessageFlags.Ephemeral });
        }
        const game = countingGames.get(interaction.channelId);
        if (!game) {
          return interaction.reply({ content: 'There is no counting game active in this channel.', flags: MessageFlags.Ephemeral });
        }

        await finishCountingGame(game, `${interaction.user} stopped the game.`, 0x5865f2);
        await interaction.reply({ content: 'Counting game ended.', flags: MessageFlags.Ephemeral });
        break;
      }
      case 'leaderboard': {
        if (!interaction.inGuild()) {
          return interaction.reply({ content: 'Use this command in a server.', flags: MessageFlags.Ephemeral });
        }
        const leaders = getLeaderboard.all(interaction.guildId);
        if (leaders.length === 0) {
          await interaction.reply('No level progress yet. Start chatting to appear here.');
          break;
        }

        const champion = leaders[0];
        const championProgress = Math.min(10, Math.floor((champion.xp / xpPerLevel) * 10));
        const entries = leaders.slice(1).map((entry, index) => {
          const rank = index + 2;
          const medal = ['🥈', '🥉'][rank - 2];
          const marker = medal ?? `**${String(rank).padStart(2, '0')}**`;
          const progress = Math.min(8, Math.floor((entry.xp / xpPerLevel) * 8));
          return `${marker}  <@${entry.user}>\n      Level **${entry.level}**  ·  ${entry.xp} XP  ${'▰'.repeat(progress)}${'▱'.repeat(8 - progress)}`;
        });
        const embed = new EmbedBuilder().setColor(0xf1c40f)
          .setAuthor({ name: `${interaction.guild.name} · SERVER RANKINGS`, ...(interaction.guild.iconURL() ? { iconURL: interaction.guild.iconURL() } : {}) })
          .setTitle('🏆 Level Leaderboard')
          .setDescription(`**CHAMPION**\n<@${champion.user}>\nLevel **${champion.level}**  ·  ${champion.xp} / ${xpPerLevel} XP\n${'▰'.repeat(championProgress)}${'▱'.repeat(10 - championProgress)}\n\n${entries.join('\n\n')}`)
          .setFooter({ text: `Top ${leaders.length} · Ranked by level, then XP` })
          .setTimestamp();
        await interaction.reply({ embeds: [embed] });
        break;
      }
      case 'ping':
        await interaction.reply(`Pong! WebSocket latency: ${client.ws.ping} ms`);
        break;
      case 'choose': {
        const choices = options.getString('options', true).split(',').map(value => value.trim()).filter(Boolean);
        if (choices.length === 0) return interaction.reply({ content: 'Provide at least one comma-separated option.', flags: MessageFlags.Ephemeral });
        await interaction.reply(`${interaction.user}, I choose: **${choices[randomInt(choices.length)]}**`);
        break;
      }
      case '8ball':
        await interaction.reply({ embeds: [new EmbedBuilder().setColor(0x3498db).setTitle(`🎱 ${interaction.user.username}'s answer`).addFields(
          { name: 'Question', value: options.getString('question', true) },
          { name: 'Answer', value: eightBallAnswers[randomInt(eightBallAnswers.length)] },
        )] });
        break;
      case 'coinflip':
        await interaction.reply(`🪙 ${randomInt(2) === 0 ? 'Heads' : 'Tails'}!`);
        break;
      case 'roll':
        await interaction.reply(`🎲 You rolled **${randomInt(1, 7)}**.`);
        break;
      case 'emojify': {
        const converted = [...options.getString('text', true).toLowerCase()].map(character => {
          if (/^[a-z]$/.test(character)) return `:regional_indicator_${character}:`;
          if (/^[0-9]$/.test(character)) return `:${['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'][Number(character)]}:`;
          return character;
        }).join(' ');
        await interaction.reply(converted);
        break;
      }
      case 'avatar': {
        const user = options.getUser('user') ?? interaction.user;
        await interaction.reply({ embeds: [profileEmbed(user, `${user.username}'s Avatar`)] });
        break;
      }
      case 'membercount':
        await interaction.reply(`This server has **${interaction.guild.memberCount}** members.`);
        break;
      case 'serverinfo': {
        const guild = interaction.guild;
        const channelCounts = guild.channels.cache.reduce((counts, channel) => {
          if ([ChannelType.GuildText, ChannelType.GuildAnnouncement].includes(channel.type)) counts.text += 1;
          if ([ChannelType.GuildVoice, ChannelType.GuildStageVoice].includes(channel.type)) counts.voice += 1;
          if ([ChannelType.AnnouncementThread, ChannelType.PublicThread, ChannelType.PrivateThread].includes(channel.type)) counts.threads += 1;
          if (channel.type === ChannelType.GuildCategory) counts.categories += 1;
          return counts;
        }, { text: 0, voice: 0, threads: 0, categories: 0 });
        const iconUrl = guild.iconURL({ size: 512 });
        const bannerUrl = guild.bannerURL({ size: 1024 });
        const verificationLevels = ['None', 'Low', 'Medium', 'High', 'Very high'];
        const features = guild.features.length
          ? guild.features.slice(0, 6).map(feature => feature.toLowerCase().split('_').map(word => word[0].toUpperCase() + word.slice(1)).join(' ')).join(' · ')
          : 'No special features';
        const embed = new EmbedBuilder().setColor(0x40b7e6)
          .setAuthor({ name: 'SERVER PROFILE', ...(iconUrl ? { iconURL: iconUrl } : {}) })
          .setTitle(guild.name)
          .setFooter({ text: `Server ID · ${guild.id}` })
          .addFields(
            { name: 'OWNER', value: `<@${guild.ownerId}>`, inline: true },
            { name: 'CREATED', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>\n<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
            { name: 'MEMBERS', value: `**${guild.memberCount.toLocaleString()}**`, inline: true },
            { name: 'CHANNELS', value: `**${guild.channels.cache.size}** total\n${channelCounts.text} text · ${channelCounts.voice} voice`, inline: true },
            { name: 'THREADS & CATEGORIES', value: `${channelCounts.threads} threads · ${channelCounts.categories} categories`, inline: true },
            { name: 'COMMUNITY', value: `${guild.roles.cache.size - 1} roles · ${guild.emojis.cache.size} emojis · ${guild.stickers.cache.size} stickers`, inline: true },
            { name: 'BOOSTS', value: `Tier ${guild.premiumTier || 0} · ${guild.premiumSubscriptionCount ?? 0} boosts`, inline: true },
            { name: 'VERIFICATION', value: verificationLevels[guild.verificationLevel] ?? 'Unknown', inline: true },
            { name: 'LOCALE', value: guild.preferredLocale || 'Unknown', inline: true },
            { name: 'SERVER FEATURES', value: features },
          );
        if (guild.description) embed.setDescription(guild.description);
        if (iconUrl) embed.setThumbnail(iconUrl);
        if (bannerUrl) embed.setImage(bannerUrl);
        await interaction.reply({ embeds: [embed] });
        break;
      }
      case 'userinfo': {
        const user = options.getUser('user') ?? interaction.user;
        const member = await interaction.guild.members.fetch(user.id);
        const roles = member.roles.cache.filter(role => role.id !== interaction.guild.id).map(role => role.toString());
        const embed = profileEmbed(user, `User Info: ${user.tag}`)
          .addFields(
            { name: 'User ID', value: user.id, inline: true },
            { name: 'Nickname', value: member.nickname ?? 'None', inline: true },
            { name: 'Joined server', value: member.joinedTimestamp ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : 'Unknown', inline: true },
            { name: 'Account created', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true },
            { name: `Roles (${roles.length})`, value: roles.join(', ').slice(0, 1000) || 'None' },
          );
        await interaction.reply({ embeds: [embed] });
        break;
      }
      case 'slap': {
        const user = options.getUser('user') ?? interaction.user;
        await interaction.reply(`**${user} just got playfully slapped for ${slapReasons[randomInt(slapReasons.length)]}!**`);
        break;
      }
      case 'bulla': {
        const user = options.getUser('user') ?? interaction.user;
        const imagePath = require('node:path').join(__dirname, 'bulla.png');
        await interaction.reply({ content: `**${user} is featured!**`, files: [imagePath] });
        break;
      }
      case 'joke': {
        await interaction.deferReply();
        const joke = await fetchJson('https://official-joke-api.appspot.com/random_joke');
        await interaction.editReply(`**${joke.setup}**\n\n${joke.punchline}`);
        break;
      }
      case 'quote': {
        await interaction.deferReply();
        const [quote] = await fetchJson('https://zenquotes.io/api/random');
        await interaction.editReply({ embeds: [new EmbedBuilder().setColor(0x5865f2).setDescription(`“${quote.q}”`).setFooter({ text: quote.a })] });
        break;
      }
      case 'wiki': {
        await interaction.deferReply();
        const query = encodeURIComponent(options.getString('query', true));
        const result = await fetchJson(`https://en.wikipedia.org/api/rest_v1/page/summary/${query}`);
        await interaction.editReply(result.extract ? `${result.extract.slice(0, 1800)}\n${result.content_urls?.desktop?.page ?? ''}` : 'No summary found.');
        break;
      }
      case 'kick': {
        const user = options.getUser('user', true);
        const member = await interaction.guild.members.fetch(user.id);
        const reason = options.getString('reason') ?? `Requested by ${interaction.user.tag}`;
        if (!member.kickable) return interaction.reply({ content: 'I cannot kick that member. Check role hierarchy and bot permissions.', flags: MessageFlags.Ephemeral });
        await member.kick(reason);
        await interaction.reply(`Kicked ${user.tag}. Reason: ${reason}`);
        break;
      }
      case 'mute': {
        const user = options.getUser('user', true);
        const minutes = options.getInteger('minutes', true);
        const member = await interaction.guild.members.fetch(user.id);
        const reason = options.getString('reason') ?? `Requested by ${interaction.user.tag}`;
        if (!member.moderatable) return interaction.reply({ content: 'I cannot timeout that member. Check role hierarchy and bot permissions.', flags: MessageFlags.Ephemeral });
        await member.timeout(minutes * 60_000, reason);
        await interaction.reply(`Timed out ${user.tag} for ${minutes} minute(s). Reason: ${reason}`);
        break;
      }
      case 'unmute': {
        const user = options.getUser('user', true);
        const member = await interaction.guild.members.fetch(user.id);
        if (!member.moderatable) return interaction.reply({ content: 'I cannot edit that member. Check role hierarchy and bot permissions.', flags: MessageFlags.Ephemeral });
        await member.timeout(null, options.getString('reason') ?? `Requested by ${interaction.user.tag}`);
        await interaction.reply(`Removed the timeout for ${user.tag}.`);
        break;
      }
      case 'warn': {
        const user = options.getUser('user', true);
        const reason = options.getString('reason', true);
        await user.send({ embeds: [new EmbedBuilder().setColor(0xed4245).setTitle(`Warning from ${interaction.guild.name}`).setDescription(reason)] }).catch(() => null);
        await interaction.reply(`Warning recorded for ${user.tag}. Reason: ${reason}`);
        break;
      }
      case 'send': {
        if (!interaction.inGuild()) {
          return interaction.reply({ content: 'Use this command from a server.', flags: MessageFlags.Ephemeral });
        }
        if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageMessages)) {
          return interaction.reply({ content: 'You need the Manage Messages permission to use this command.', flags: MessageFlags.Ephemeral });
        }

        const channel = options.getChannel('channel', true);
        if (channel.guildId !== interaction.guildId || !channel.isTextBased() || typeof channel.send !== 'function') {
          return interaction.reply({ content: 'Choose a text channel where the bot can send messages.', flags: MessageFlags.Ephemeral });
        }

        const message = options.getString('message');
        const useEmbed = options.getBoolean('embed');
        let payload;
        if (useEmbed) {
          const description = options.getString('embed_description') ?? message;
          if (!description) {
            return interaction.reply({ content: 'Provide a message or an embed description.', flags: MessageFlags.Ephemeral });
          }

          const colorInput = options.getString('embed_color');
          if (colorInput && !/^#?[0-9a-fA-F]{6}$/.test(colorInput)) {
            return interaction.reply({ content: 'Embed color must be a six-digit hex value, such as #5865F2.', flags: MessageFlags.Ephemeral });
          }

          const urlOptions = [
            ['embed_author_url', 'Author URL'],
            ['embed_author_icon_url', 'Author icon URL'],
            ['embed_url', 'Embed URL'],
            ['embed_image_url', 'Image URL'],
            ['embed_thumbnail_url', 'Thumbnail URL'],
            ['embed_footer_icon_url', 'Footer icon URL'],
          ];
          for (const [optionName, label] of urlOptions) {
            const value = options.getString(optionName);
            if (!value) continue;
            try {
              const url = new URL(value);
              if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error('Unsupported URL protocol');
            } catch {
              return interaction.reply({ content: `${label} must be a valid HTTP or HTTPS URL.`, flags: MessageFlags.Ephemeral });
            }
          }

          const authorName = options.getString('embed_author');
          const authorUrl = options.getString('embed_author_url');
          const authorIconUrl = options.getString('embed_author_icon_url');
          if (!authorName && (authorUrl || authorIconUrl)) {
            return interaction.reply({ content: 'Provide an embed author name when using an author URL or icon.', flags: MessageFlags.Ephemeral });
          }

          const fields = (options.getString('embed_fields') ?? '').split('\n').filter(line => line.trim());
          if (fields.length > 25) {
            return interaction.reply({ content: 'An embed can contain up to 25 fields.', flags: MessageFlags.Ephemeral });
          }

          const embed = new EmbedBuilder().setColor(colorInput ? Number.parseInt(colorInput.replace('#', ''), 16) : 0x5865f2)
            .setDescription(description);
          const title = options.getString('embed_title');
          if (title) embed.setTitle(title);
          const embedUrl = options.getString('embed_url');
          if (embedUrl) embed.setURL(embedUrl);
          if (authorName) {
            embed.setAuthor({
              name: authorName,
              ...(authorUrl ? { url: authorUrl } : {}),
              ...(authorIconUrl ? { iconURL: authorIconUrl } : {}),
            });
          }
          const imageUrl = options.getString('embed_image_url');
          if (imageUrl) embed.setImage(imageUrl);
          const thumbnailUrl = options.getString('embed_thumbnail_url');
          if (thumbnailUrl) embed.setThumbnail(thumbnailUrl);
          if (options.getBoolean('embed_timestamp')) embed.setTimestamp();

          let totalTextLength = description.length + (title?.length ?? 0) + (authorName?.length ?? 0);
          for (const field of fields) {
            const separatorIndex = field.indexOf('|');
            if (separatorIndex < 1) {
              return interaction.reply({ content: 'Each embed field must use the format `Name | Value`, with one field per line.', flags: MessageFlags.Ephemeral });
            }
            const name = field.slice(0, separatorIndex).trim();
            const value = field.slice(separatorIndex + 1).trim();
            if (!name || name.length > 256 || !value || value.length > 1024) {
              return interaction.reply({ content: 'Embed field names must be 1-256 characters and values 1-1024 characters.', flags: MessageFlags.Ephemeral });
            }
            totalTextLength += name.length + value.length;
            embed.addFields({ name, value });
          }

          const footerText = options.getString('embed_footer');
          const footerIconUrl = options.getString('embed_footer_icon_url');
          if (footerText) {
            embed.setFooter({ text: footerText, ...(footerIconUrl ? { iconURL: footerIconUrl } : {}) });
            totalTextLength += footerText.length;
          } else if (footerIconUrl) {
            return interaction.reply({ content: 'Provide embed footer text when using a footer icon.', flags: MessageFlags.Ephemeral });
          }
          if (totalTextLength > 6000) {
            return interaction.reply({ content: 'The combined embed text exceeds Discord’s 6000-character limit.', flags: MessageFlags.Ephemeral });
          }
          payload = { embeds: [embed] };
        } else {
          if (!message) return interaction.reply({ content: 'Provide a message to send.', flags: MessageFlags.Ephemeral });
          payload = { content: message };
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        try {
          await channel.send({ ...payload, allowedMentions: { parse: [] } });
          await interaction.editReply(`Message sent to ${channel}.`);
        } catch {
          await interaction.editReply(`I could not send a message to ${channel}. Check the bot’s channel permissions.`);
        }
        break;
      }
      case 'dm': {
        if (!interaction.inGuild()) {
          return interaction.reply({ content: 'Use this command from a server.', flags: MessageFlags.Ephemeral });
        }
        if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageMessages)) {
          return interaction.reply({ content: 'You need the Manage Messages permission to use this command.', flags: MessageFlags.Ephemeral });
        }

        const userId = options.getString('user_id', true);
        if (!/^\d{17,20}$/.test(userId)) {
          return interaction.reply({ content: 'Enter a valid Discord user ID (17 to 20 digits).', flags: MessageFlags.Ephemeral });
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        let user;
        try {
          user = await client.users.fetch(userId);
        } catch {
          return interaction.editReply('I could not find a Discord user with that ID.');
        }

        const message = options.getString('message');
        const attribution = [];
        if (!options.getBoolean('hide_sender')) attribution.push(`from ${interaction.user.tag}`);
        if (!options.getBoolean('hide_guild')) attribution.push(`in ${interaction.guild.name}`);
        const useEmbed = options.getBoolean('embed');
        let payload;
        if (useEmbed) {
          const description = options.getString('embed_description') ?? message;
          if (!description) {
            return interaction.editReply('Provide a message or an embed description.');
          }

          const colorInput = options.getString('embed_color');
          if (colorInput && !/^#?[0-9a-fA-F]{6}$/.test(colorInput)) {
            return interaction.editReply('Embed color must be a six-digit hex value, such as #5865F2.');
          }

          const urlOptions = [
            ['embed_author_url', 'Author URL'],
            ['embed_author_icon_url', 'Author icon URL'],
            ['embed_url', 'Embed URL'],
            ['embed_image_url', 'Image URL'],
            ['embed_thumbnail_url', 'Thumbnail URL'],
            ['embed_footer_icon_url', 'Footer icon URL'],
          ];
          for (const [optionName, label] of urlOptions) {
            const value = options.getString(optionName);
            if (!value) continue;
            try {
              const url = new URL(value);
              if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error('Unsupported URL protocol');
            } catch {
              return interaction.editReply(`${label} must be a valid HTTP or HTTPS URL.`);
            }
          }

          const authorName = options.getString('embed_author');
          const authorUrl = options.getString('embed_author_url');
          const authorIconUrl = options.getString('embed_author_icon_url');
          if (!authorName && (authorUrl || authorIconUrl)) {
            return interaction.editReply('Provide an embed author name when using an author URL or icon.');
          }

          const fields = (options.getString('embed_fields') ?? '').split('\n').filter(line => line.trim());
          if (fields.length > 25) {
            return interaction.editReply('An embed can contain up to 25 fields.');
          }

          const embed = new EmbedBuilder().setColor(colorInput ? Number.parseInt(colorInput.replace('#', ''), 16) : 0x5865f2)
            .setDescription(description);
          const title = options.getString('embed_title');
          if (title) embed.setTitle(title);
          const embedUrl = options.getString('embed_url');
          if (embedUrl) embed.setURL(embedUrl);
          if (authorName) {
            embed.setAuthor({
              name: authorName,
              ...(authorUrl ? { url: authorUrl } : {}),
              ...(authorIconUrl ? { iconURL: authorIconUrl } : {}),
            });
          }
          const imageUrl = options.getString('embed_image_url');
          if (imageUrl) embed.setImage(imageUrl);
          const thumbnailUrl = options.getString('embed_thumbnail_url');
          if (thumbnailUrl) embed.setThumbnail(thumbnailUrl);
          if (options.getBoolean('embed_timestamp')) embed.setTimestamp();

          for (const field of fields) {
            const separatorIndex = field.indexOf('|');
            if (separatorIndex < 1) {
              return interaction.editReply('Each embed field must use the format `Name | Value`, with one field per line.');
            }
            const name = field.slice(0, separatorIndex).trim();
            const value = field.slice(separatorIndex + 1).trim();
            if (!name || name.length > 256 || !value || value.length > 1024) {
              return interaction.editReply('Embed field names must be 1-256 characters and values 1-1024 characters.');
            }
            embed.addFields({ name, value });
          }

          const footerText = options.getString('embed_footer');
          const footerIconUrl = options.getString('embed_footer_icon_url');
          const footerParts = [];
          if (footerText) footerParts.push(footerText);
          if (attribution.length) footerParts.push(`Sent ${attribution.join(' ')}. Replies to the bot within 24 hours will be posted in channel ${dmReplyChannelId}.`);
          if (footerParts.length) {
            const combinedFooter = footerParts.join('\n');
            if (combinedFooter.length > 2048) {
              return interaction.editReply('The embed footer exceeds Discord’s 2048-character limit.');
            }
            embed.setFooter({ text: combinedFooter, ...(footerIconUrl ? { iconURL: footerIconUrl } : {}) });
          } else if (footerIconUrl) {
            return interaction.editReply('Provide embed footer text when using a footer icon.');
          }

          const totalTextLength = description.length + (title?.length ?? 0) + (authorName?.length ?? 0)
            + fields.reduce((total, field) => {
              const separatorIndex = field.indexOf('|');
              return separatorIndex < 1 ? total : total + field.slice(0, separatorIndex).trim().length + field.slice(separatorIndex + 1).trim().length;
            }, 0)
            + footerParts.join('\n').length;
          if (totalTextLength > 6000) {
            return interaction.editReply('The combined embed text exceeds Discord’s 6000-character limit.');
          }
          payload = { embeds: [embed] };
        } else {
          if (!message) return interaction.editReply('Provide a message to send.');
          const content = attribution.length
            ? `Message ${attribution.join(' ')}:\n${message}\n\nReplies sent to this bot in the next 24 hours will be sent to MODs.`
            : message;
          payload = { content };
        }
        try {
          await user.send({
            ...payload,
            allowedMentions: { parse: [] },
          });
          dmReplyRoutes.set(user.id, {
            expiresAt: Date.now() + dmReplyWindowMs,
          });
          await interaction.editReply(`Message delivered to ${user.tag}. Their replies for the next 24 hours will be posted in <#${dmReplyChannelId}>.`);
        } catch {
          await interaction.editReply(`I could not DM ${user.tag}. They may have DMs disabled or may have blocked the bot.`);
        }
        break;
      }
      default:
        await interaction.reply({ content: 'That command is not implemented.', flags: MessageFlags.Ephemeral });
    }
  } catch (error) {
    console.error(`Command /${interaction.commandName} failed:`, error);
    const response = { content: 'The command failed. Please try again later.', flags: MessageFlags.Ephemeral };
    if (interaction.deferred || interaction.replied) await interaction.followUp(response);
    else await interaction.reply(response);
  }
});

client.login(token);
