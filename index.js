process.loadEnvFile();

const {
  Client,
  EmbedBuilder,
  Events,
  GatewayIntentBits,
  PermissionFlagsBits,
  SlashCommandBuilder,
} = require('discord.js');
const { randomInt } = require('node:crypto');

const token = process.env.DISCORD_TOKEN;
if (!token) {
  throw new Error('DISCORD_TOKEN is required. Copy .env.example to .env and configure it.');
}

const commands = [
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
].map(command => command.toJSON());

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
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

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  try {
    const { commandName, options } = interaction;
    switch (commandName) {
      case 'ping':
        await interaction.reply(`Pong! WebSocket latency: ${client.ws.ping} ms`);
        break;
      case 'choose': {
        const choices = options.getString('options', true).split(',').map(value => value.trim()).filter(Boolean);
        if (choices.length === 0) return interaction.reply({ content: 'Provide at least one comma-separated option.', ephemeral: true });
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
        const embed = new EmbedBuilder().setColor(0x00fff5).setTitle(guild.name)
          .setThumbnail(guild.iconURL({ size: 512 }))
          .addFields(
            { name: 'Owner', value: `<@${guild.ownerId}>`, inline: true },
            { name: 'Members', value: String(guild.memberCount), inline: true },
            { name: 'Channels', value: String(guild.channels.cache.size), inline: true },
            { name: 'Roles', value: String(guild.roles.cache.size), inline: true },
            { name: 'Created', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>`, inline: true },
            { name: 'Server ID', value: guild.id, inline: true },
          );
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
        if (!member.kickable) return interaction.reply({ content: 'I cannot kick that member. Check role hierarchy and bot permissions.', ephemeral: true });
        await member.kick(reason);
        await interaction.reply(`Kicked ${user.tag}. Reason: ${reason}`);
        break;
      }
      case 'mute': {
        const user = options.getUser('user', true);
        const minutes = options.getInteger('minutes', true);
        const member = await interaction.guild.members.fetch(user.id);
        const reason = options.getString('reason') ?? `Requested by ${interaction.user.tag}`;
        if (!member.moderatable) return interaction.reply({ content: 'I cannot timeout that member. Check role hierarchy and bot permissions.', ephemeral: true });
        await member.timeout(minutes * 60_000, reason);
        await interaction.reply(`Timed out ${user.tag} for ${minutes} minute(s). Reason: ${reason}`);
        break;
      }
      case 'unmute': {
        const user = options.getUser('user', true);
        const member = await interaction.guild.members.fetch(user.id);
        if (!member.moderatable) return interaction.reply({ content: 'I cannot edit that member. Check role hierarchy and bot permissions.', ephemeral: true });
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
      default:
        await interaction.reply({ content: 'That command is not implemented.', ephemeral: true });
    }
  } catch (error) {
    console.error(`Command /${interaction.commandName} failed:`, error);
    const response = { content: 'The command failed. Please try again later.', ephemeral: true };
    if (interaction.deferred || interaction.replied) await interaction.followUp(response);
    else await interaction.reply(response);
  }
});

client.login(token);
