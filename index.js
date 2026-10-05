process.loadEnvFile();

const {
  ActionRowBuilder,
  ActivityType,
  AuditLogEvent,
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
levelDb.exec('CREATE TABLE IF NOT EXISTS bad_words (guild TEXT NOT NULL, word TEXT NOT NULL, added_by TEXT NOT NULL, created_at INTEGER NOT NULL, PRIMARY KEY (guild, word))');
levelDb.exec('CREATE TABLE IF NOT EXISTS game_wallets (guild TEXT NOT NULL, user TEXT NOT NULL, cash INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (guild, user))');
levelDb.exec('CREATE TABLE IF NOT EXISTS game_inventory (guild TEXT NOT NULL, user TEXT NOT NULL, item_id TEXT NOT NULL, quantity INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (guild, user, item_id))');
const findLevel = levelDb.prepare('SELECT level, xp FROM levels WHERE user = ? AND guild = ? ORDER BY level DESC, xp DESC LIMIT 1');
const insertLevel = levelDb.prepare('INSERT INTO levels (level, xp, user, guild) VALUES (0, 0, ?, ?)');
const updateLevel = levelDb.prepare('UPDATE levels SET level = ?, xp = ? WHERE user = ? AND guild = ?');
const getLeaderboard = levelDb.prepare('SELECT CAST(user AS TEXT) AS user, MAX(level) AS level, MAX(xp) AS xp FROM levels WHERE guild = ? GROUP BY user ORDER BY level DESC, xp DESC LIMIT 10');
const getBadWords = levelDb.prepare('SELECT word FROM bad_words WHERE guild = ? ORDER BY word COLLATE NOCASE');
const findBadWord = levelDb.prepare('SELECT 1 FROM bad_words WHERE guild = ? AND word = ?');
const countBadWords = levelDb.prepare('SELECT COUNT(*) AS count FROM bad_words WHERE guild = ?');
const addBadWord = levelDb.prepare('INSERT OR IGNORE INTO bad_words (guild, word, added_by, created_at) VALUES (?, ?, ?, ?)');
const removeBadWord = levelDb.prepare('DELETE FROM bad_words WHERE guild = ? AND word = ?');
const getGameWallet = levelDb.prepare('SELECT cash FROM game_wallets WHERE guild = ? AND user = ?');
const getGameInventory = levelDb.prepare('SELECT item_id, quantity FROM game_inventory WHERE guild = ? AND user = ? ORDER BY item_id');
const getGameLeaderboard = levelDb.prepare(`
  SELECT w.user, w.cash, COALESCE(SUM(i.quantity), 0) AS item_count
  FROM game_wallets w
  LEFT JOIN game_inventory i ON i.guild = w.guild AND i.user = w.user
  WHERE w.guild = ?
  GROUP BY w.guild, w.user
  ORDER BY w.cash DESC, item_count DESC
  LIMIT 10
`);
const addGameCash = levelDb.prepare(`
  INSERT INTO game_wallets (guild, user, cash) VALUES (?, ?, ?)
  ON CONFLICT (guild, user) DO UPDATE SET cash = cash + excluded.cash
`);
const addInventoryItem = levelDb.prepare(`
  INSERT INTO game_inventory (guild, user, item_id, quantity) VALUES (?, ?, ?, 1)
  ON CONFLICT (guild, user, item_id) DO UPDATE SET quantity = quantity + 1
`);
const levelCooldowns = new Map();
const countingGames = new Map();
const lootDropTimers = new Map();
const lootDropChannels = new Map();
const lootDropLastActivity = new Map();
const activeLootDrops = new Map();
const badWordMatchers = new Map();
const automodDeletedMessageIds = new Set();
const chatReactionCooldowns = new Map();
const lastChatReactions = new Map();
const chatReplyCooldowns = new Map();
const lastChatReplies = new Map();
const chatPollCooldowns = new Map();
const activeChatPolls = new Map();
const gameCommandCooldowns = new Map();
const highLowGames = new Map();
const xpPerLevel = 100;
const levelCooldownMs = 60_000;
const chatReactionCooldownMs = 5 * 60_000;
const chatReplyCooldownMs = 30 * 60_000;
const chatPollCooldownMs = 45 * 60_000;
const chatPollDurationMs = 5 * 60_000;
const lootDropMinDelayMs = 5 * 60_000;
const lootDropMaxDelayMs = 15 * 60_000;
const lootDropDurationMs = 120_000;
const chatReactionChance = 1 / 30;
const chatReplyChance = 1 / 25;
const chatPollChance = 1 / 80;
const funnyChatReactions = ['😂', '💀', '🗿', '🤨', '😭', '🫡', '👀', '🐸', '✨', '🍿', '🧠', '🤌'];
const chatReplyThemes = [
  { pattern: /\b(ありがとう|thanks|thank you|thx|ty)\b/i, replies: ['Gratitude detected. The wholesome department has approved this message. ✨', 'A thank-you? In this economy? We love character development. 🫡'] },
  { pattern: /\b(hello|hey|hi there|good morning|good evening|howdy)\b/i, replies: ['The chat has spawned a friendly NPC. Welcome! 👋', 'Hello, fellow tab that has been open all day. 🤝'] },
  { pattern: /\b(i (?:am|feel) tired|so tired|exhausted|long day|rough day|stressed)\b/i, replies: ['Tiny reminder: rest is not a side quest you have to earn. 🌱', 'Even the strongest CPU needs a cooldown. Be kind to yourself. 🫶'] },
  { pattern: /\b(i did it|we did it|finally|passed|finished|got the job|got accepted|we won|i won)\b/i, replies: ['LET’S GOOO. Character development with receipts. 🏆', 'That is a certified win. Please accept one imaginary confetti cannon. 🎉'] },
  { pattern: /\b(fail(?:ed|ing)?|messed up|made a mistake|it went wrong|i can't do this|i cannot do this)\b/i, replies: ['A mistake is just a plot twist with terrible timing. You can try again. 🌱', 'One rough attempt is not your whole story. Even legendary runs have scuffed episodes. 🫶'] },
  { pattern: /\b(study|studying|exam|homework|assignment|deadline)\b/i, replies: ['One tiny step still counts. Open the task, defeat one paragraph, hydrate. 📚', 'Academic side quest detected. May your focus outlast the loading spinner. 🧠'] },
  { pattern: /\b(why|how|what if|any advice|help me)\b/i, replies: ['The council of overthinkers recommends one small next step. What’s the actual next move? 🗿', 'A good question is the first checkpoint. Keep going; clarity usually loads after the cutscene. ✨'] },
];
const genericChatReplies = [
  'The chat has spoken. Somewhere, a rubber duck just nodded wisely. 🦆',
  'A gentle reminder from your local meme bot: you’re doing better than your inner narrator claims. 🌱',
  'This message has been reviewed by the Department of Vibes. Status: surprisingly meaningful. 🗿',
  'You made it through every weird day so far. That’s a pretty good streak. ✨',
  'The plot is still unfolding. Please continue being a mildly mysterious main character. 🎬',
];
const chatPollTopics = [
  { pattern: /\b(game|gaming|gamer|play(?:ing)?|minecraft|roblox|fortnite|zelda)\b/i, question: 'The lobby is open. What are we playing?', options: ['One more match 🎮', 'Co-op chaos 🤝', 'Touch grass 🌱'] },
  { pattern: /\b(food|hungry|eat|dinner|lunch|breakfast|pizza|snack)\b/i, question: 'Important side quest: choose the fuel.', options: ['Pizza 🍕', 'Something healthy 🥗', 'Mystery snack 🍿'] },
  { pattern: /\b(music|song|album|playlist|concert|listen(?:ing)?)\b/i, question: 'Set the soundtrack for the next hour.', options: ['Chill mode 🎧', 'Boss fight 🎸', 'Sad bangers 🎶'] },
  { pattern: /\b(movie|film|show|series|episode|watch(?:ing)?)\b/i, question: 'Pick tonight’s screen-time destiny.', options: ['Comedy 😂', 'Thriller 👀', 'Rewatch comfort show 🛋️'] },
  { pattern: /\b(study|studying|exam|homework|assignment|deadline|work)\b/i, question: 'Choose your productivity power-up.', options: ['Pomodoro 🍅', 'Tiny first step 🐜', 'Five-minute break ☕'] },
  { pattern: /\b(tired|sleep|bed|nap|exhausted|rough day|stressed)\b/i, question: 'The council of self-care requests a vote.', options: ['Rest, no guilt 🛌', 'Water + reset 💧', 'One tiny task 🌱'] },
  { pattern: /\b(weekend|holiday|vacation|trip|travel|plans)\b/i, question: 'Choose the weekend side quest.', options: ['Go outside 🌳', 'Stay cozy 🛋️', 'Become a snack legend 🍿'] },
  { pattern: /\b(code|coding|program|bug|build|deploy|javascript|python|discord bot)\b/i, question: 'The dev council is deciding the next move.', options: ['Ship it 🚀', 'Test it first 🧪', 'Blame the cache 🗿'] },
];
const genericChatPolls = [
  { question: 'A tiny server referendum has appeared. Choose your vibe.', options: ['Maximum chaos 🗿', 'Peaceful side quest 🌱', 'Snack break 🍪'] },
  { question: 'The group chat has one brain cell. What should it do?', options: ['Make a plan 📋', 'Tell a joke 😂', 'Take a nap 💤'] },
  { question: 'Quick vibe check: what does the timeline need?', options: ['More memes 💀', 'More kindness 🫶', 'More snacks 🍕'] },
];
const lootItems = [
  { id: 'rubber-duck', name: 'Rubber Duck of Wisdom', emoji: '🦆', rarity: 'Common' },
  { id: 'emotional-support-rock', name: 'Emotional Support Rock', emoji: '🪨', rarity: 'Common' },
  { id: 'mystery-sock', name: 'Mystery Sock (Unmatched)', emoji: '🧦', rarity: 'Common' },
  { id: 'wifi-bar', name: 'Pocket Wi-Fi Bar', emoji: '📶', rarity: 'Uncommon' },
  { id: 'tiny-crown', name: 'Tiny Crown of Side Quests', emoji: '👑', rarity: 'Rare' },
  { id: 'golden-pigeon', name: 'Golden Pigeon', emoji: '🐦', rarity: 'Epic' },
  { id: 'last-braincell', name: 'The Last Brain Cell', emoji: '🧠', rarity: 'Legendary' },
  { id: 'suspicious-keycard', name: 'Suspicious Keycard', emoji: '🪪', rarity: 'Rare' },
  { id: 'moonlight-lantern', name: 'Moonlight Lantern', emoji: '🏮', rarity: 'Epic' },
  { id: 'digital-dragon', name: 'Digital Dragon Egg', emoji: '🐉', rarity: 'Legendary' },
];
const lootDropMessages = [
  '🦆 A tiny duck just handed in its two weeks’ notice. It left its severance package here.',
  '💀 The universe sent a care package. The universe is bad at shipping, so grab it fast.',
  '✨ Showing up counts. Today it also comes with pocket money and a suspicious object.',
  '🗿 A mysterious loot goblin is paying rent in cash and highly questionable collectibles.',
  '🌱 A small win is still a win. This one has a button and absolutely no life lesson fee.',
];
const maxBadWordsPerGuild = 50;
const helpCategories = [
  { name: '⚡ Quick tools', commands: ['help', 'ping', 'choose', '8ball', 'coinflip', 'roll', 'emojify'] },
  { name: '👤 Server & profiles', commands: ['membercount', 'serverinfo', 'userinfo', 'avatar', 'level', 'leaderboard', 'profile', 'inventory', 'gameleaderboard'] },
  { name: '🎮 Games', commands: ['beg', 'hunt', 'dig', 'rob', 'gamble', 'fish', 'hack', 'highlow', 'crime', 'job', 'countingstart', 'countingstop', 'tictactoe'] },
  { name: '✨ Fun & community', commands: ['pepe', 'slap', 'bulla', 'joke', 'quote', 'wiki'] },
  { name: '🛡️ Moderation', commands: ['badword', 'kick', 'mute', 'unmute', 'warn'] },
  { name: '📨 Messaging', commands: ['send', 'dm'] },
];

function readLevel(userId, guildId) {
  const record = findLevel.get(userId, guildId);
  return { level: Number(record?.level ?? 0), xp: Number(record?.xp ?? 0) };
}

function getGameCash(guildId, userId) {
  return Number(getGameWallet.get(guildId, userId)?.cash ?? 0);
}

function addGameCashDelta(guildId, userId, delta) {
  const currentCash = getGameCash(guildId, userId);
  const safeDelta = Math.max(delta, -currentCash);
  const nextCash = currentCash + safeDelta;
  if (safeDelta !== 0) addGameCash.run(guildId, userId, safeDelta);
  return nextCash;
}

function awardRandomLoot(guildId, userId, itemChance = 0.18) {
  if (Math.random() < itemChance) {
    const item = randomLootItem();
    addInventoryItem.run(guildId, userId, item.id);
    return { item, claimed: true };
  }
  return { item: null, claimed: false };
}

function randomLootItem() {
  const roll = randomInt(10_000);
  const rarity = roll < 6_000 ? 'Common'
    : roll < 8_200 ? 'Uncommon'
      : roll < 9_600 ? 'Rare'
        : roll < 9_950 ? 'Epic'
          : 'Legendary';
  const items = lootItems.filter(item => item.rarity === rarity);
  return items[randomInt(items.length)];
}

function commandCooldownKey(guildId, userId, commandName) {
  return `${guildId}:${userId}:${commandName}`;
}

async function enforceCommandCooldown(interaction, commandName, cooldownMs, message) {
  const now = Date.now();
  const key = commandCooldownKey(interaction.guildId, interaction.user.id, commandName);
  const lastUsed = gameCommandCooldowns.get(key) ?? 0;
  const remainingMs = cooldownMs - (now - lastUsed);
  if (remainingMs > 0) {
    const remainingSeconds = Math.ceil(remainingMs / 1000);
    await interaction.reply({ content: `${message} Try again in **${remainingSeconds}s**.`, flags: MessageFlags.Ephemeral });
    return false;
  }
  gameCommandCooldowns.set(key, now);
  return true;
}

async function playGameAnimation(interaction, title, frames, resultEmbed) {
  await interaction.deferReply();
  for (const description of frames) {
    await interaction.editReply({
      embeds: [new EmbedBuilder().setColor(0x5865f2).setTitle(title).setDescription(description)],
    });
    await new Promise(resolve => setTimeout(resolve, 550));
  }
  await interaction.editReply({ embeds: [resultEmbed] });
}

function highLowComponents(gameId, current, disabled = false) {
  return [new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`highlow:${gameId}:higher`)
      .setLabel('Higher')
      .setEmoji('📈')
      .setStyle(ButtonStyle.Success)
      .setDisabled(disabled || current === 10),
    new ButtonBuilder()
      .setCustomId(`highlow:${gameId}:lower`)
      .setLabel('Lower')
      .setEmoji('📉')
      .setStyle(ButtonStyle.Danger)
      .setDisabled(disabled || current === 1),
  )];
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

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function matchingBadWord(guildId, content) {
  let matcher = badWordMatchers.get(guildId);
  if (matcher === undefined) {
    const words = getBadWords.all(guildId).map(row => row.word);
    if (words.length === 0) {
      badWordMatchers.set(guildId, null);
      return null;
    }
    const alternatives = words
      .sort((left, right) => right.length - left.length)
      .map(word => word.split(' ').map(escapeRegExp).join('\\s+'));
    matcher = new RegExp(`(?<![\\p{L}\\p{N}])(?<word>${alternatives.join('|')})(?![\\p{L}\\p{N}])`, 'iu');
    badWordMatchers.set(guildId, matcher);
  }
  return matcher?.exec(content)?.groups?.word ?? null;
}

function chatReplyFor(content, guildId) {
  const theme = chatReplyThemes.find(candidate => candidate.pattern.test(content));
  const replies = theme?.replies ?? genericChatReplies;
  const previousReply = lastChatReplies.get(guildId);
  let replyIndex = randomInt(replies.length);
  if (replies.length > 1 && replies[replyIndex] === previousReply) {
    replyIndex = (replyIndex + 1) % replies.length;
  }
  return replies[replyIndex];
}

function chatPollFor(content) {
  const topic = chatPollTopics.find(candidate => candidate.pattern.test(content));
  if (topic) return topic;
  return genericChatPolls[randomInt(genericChatPolls.length)];
}

function chatPollEmbed(poll, finalized = false) {
  const counts = poll.options.map((_, index) => [...poll.votes.values()].filter(vote => vote === index).length);
  const totalVotes = counts.reduce((total, count) => total + count, 0);
  const maxVotes = Math.max(...counts);
  const results = poll.options.map((option, index) => {
    const count = counts[index];
    const barSize = totalVotes ? Math.round((count / maxVotes) * 10) : 0;
    return `${index + 1}. **${option}**\n${'▰'.repeat(barSize)}${'▱'.repeat(10 - barSize)}  ${count} vote${count === 1 ? '' : 's'}`;
  });
  const winners = finalized && totalVotes
    ? poll.options.filter((_, index) => counts[index] === maxVotes)
    : [];
  const result = winners.length === 1
    ? `\n\n🏆 **The people have spoken:** ${winners[0]}`
    : winners.length > 1
      ? `\n\n🤝 **It’s a tie:** ${winners.join(' · ')}`
      : '';

  return new EmbedBuilder().setColor(finalized ? 0x7f8c8d : 0x8b5cf6)
    .setAuthor({ name: 'ROck · COMMUNITY PULSE' })
    .setTitle(finalized ? '📊 Poll results' : '✨ A little chat poll')
    .setDescription(`${poll.question}\n\nInspired by the conversation · Vote below${result}`)
    .addFields({ name: `VOTES · ${totalVotes}`, value: results.join('\n\n') })
    .setFooter({ text: finalized ? 'Thanks for voting · The poll is closed' : 'You can change your vote · Closes in 5 minutes' })
    .setTimestamp();
}

function chatPollComponents(poll, disabled = false) {
  return [new ActionRowBuilder().addComponents(
    poll.options.map((option, index) => new ButtonBuilder()
      .setCustomId(`chat-poll:${poll.id}:${index}`)
      .setLabel(option)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disabled)),
  )];
}

async function moderateBadWordMessage(message) {
  if (!message.guild || message.author.bot || !message.content || message.channelId === serverLogChannelId) return false;
  if (message.member?.permissions.has(PermissionFlagsBits.ManageMessages)) return false;

  const matchedWord = matchingBadWord(message.guild.id, message.content);
  if (!matchedWord) return false;

  const botMember = message.guild.members.me;
  if (!botMember?.permissionsIn(message.channel).has(PermissionFlagsBits.ManageMessages)) {
    console.error(`Cannot remove filtered message ${message.id}: bot lacks Manage Messages in channel ${message.channelId}`);
    return false;
  }

  automodDeletedMessageIds.add(message.id);
  const cleanupTimer = setTimeout(() => automodDeletedMessageIds.delete(message.id), 30_000);
  cleanupTimer.unref();
  try {
    await message.delete();
  } catch (error) {
    clearTimeout(cleanupTimer);
    automodDeletedMessageIds.delete(message.id);
    console.error(`Could not delete filtered message ${message.id}:`, error);
    return false;
  }

  await sendServerLog(message.guild, {
    title: '🚫 Filtered word detected',
    description: `A message containing a configured filtered word was removed.`,
    color: 0xed4245,
    timestamp: Date.now(),
    thumbnail: message.author.displayAvatarURL({ size: 256 }),
    fields: [
      { name: 'MEMBER', value: `${message.author.tag}\n\`${message.author.id}\``, inline: true },
      { name: 'FILTERED TERM', value: matchedWord, inline: true },
      { name: 'CHANNEL', value: `<#${message.channelId}>`, inline: true },
      { name: 'MESSAGE ID', value: message.id, inline: true },
    ],
  });

  try {
    await message.author.send({
      embeds: [new EmbedBuilder().setColor(0xe88772)
        .setAuthor({ name: `${message.guild.name} · COMMUNITY GUIDELINES`, ...(message.guild.iconURL() ? { iconURL: message.guild.iconURL() } : {}) })
        .setTitle('Your message was removed')
        .setDescription(`Your message in **${message.guild.name}** was removed because it matched the server’s word filter.`)
        .addFields({ name: 'MATCHED FILTER', value: matchedWord })
        .setFooter({ text: 'Please keep the community welcoming for everyone.' })
        .setTimestamp()],
      allowedMentions: { parse: [] },
    });
  } catch (error) {
    console.warn(`Could not DM word-filter warning to ${message.author.tag}:`, error);
  }

  try {
    const notice = await message.channel.send({
      content: `⚠️ <@${message.author.id}>, your message was removed because it matched this server’s word filter.`,
      allowedMentions: { users: [message.author.id] },
    });
    const noticeTimer = setTimeout(() => {
      notice.delete().catch(error => console.warn(`Could not remove temporary word-filter notice ${notice.id}:`, error));
    }, 10_000);
    noticeTimer.unref();
  } catch (error) {
    console.error(`Could not post word-filter notice in channel ${message.channelId}:`, error);
  }
  return true;
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

function lootDropItem() {
  return randomLootItem();
}

function lootDropEmbed(drop, claimedBy) {
  return new EmbedBuilder().setColor(claimedBy ? 0x49c7a4 : 0xf1a34a)
    .setTitle(claimedBy ? 'Loot claimed!' : 'A wild loot drop appeared!')
    .setDescription(claimedBy
      ? `<@${claimedBy}> got there first. The universe has chosen its favorite (for now).`
      : lootDropMessages[drop.messageIndex])
    .addFields(
      { name: 'CASH', value: `💵 **$${drop.cash}**`, inline: true },
      { name: 'COLLECTIBLE', value: `${drop.item.emoji} **${drop.item.name}** · ${drop.item.rarity}`, inline: true },
    )
    .setFooter({ text: claimedBy ? 'Check /profile and /inventory for your haul.' : 'First click wins · Drop disappears in 2 minutes' })
    .setTimestamp();
}

function lootDropComponents(drop, disabled = false) {
  return [new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`loot:${drop.id}`)
      .setLabel('SNATCH THE LOOT')
      .setEmoji('🤑')
      .setStyle(ButtonStyle.Success)
      .setDisabled(disabled),
  )];
}

function grantLootDrop(guildId, userId, drop) {
  levelDb.exec('BEGIN IMMEDIATE');
  try {
    addGameCash.run(guildId, userId, drop.cash);
    addInventoryItem.run(guildId, userId, drop.item.id);
    levelDb.exec('COMMIT');
  } catch (error) {
    levelDb.exec('ROLLBACK');
    throw error;
  }
}

function scheduleLootDrop(guild, channel, recordActivity = true) {
  if (!guild || !channel?.isTextBased() || typeof channel.send !== 'function') return;
  if ([serverLogChannelId, memberEventChannelId, leaveEventChannelId].includes(channel.id)) return;
  if (countingGames.has(channel.id)) return;

  lootDropChannels.set(guild.id, channel);
  if (recordActivity) lootDropLastActivity.set(guild.id, Date.now());
  if (lootDropTimers.has(guild.id) || activeLootDrops.has(guild.id)) return;

  const delay = randomInt(lootDropMinDelayMs, lootDropMaxDelayMs + 1);
  const timer = setTimeout(async () => {
    lootDropTimers.delete(guild.id);
    if (activeLootDrops.has(guild.id)) return;
    if (Date.now() - (lootDropLastActivity.get(guild.id) ?? 0) > lootDropMaxDelayMs) return;

    const targetChannel = lootDropChannels.get(guild.id);
    if (!targetChannel || typeof targetChannel.send !== 'function') return;

    const drop = {
      id: randomUUID(),
      cash: randomInt(50, 251),
      item: lootDropItem(),
      messageIndex: randomInt(lootDropMessages.length),
    };
    activeLootDrops.set(guild.id, drop);

    let message;
    try {
      message = await targetChannel.send({
        embeds: [lootDropEmbed(drop)],
        components: lootDropComponents(drop),
        allowedMentions: { parse: [] },
      });
    } catch (error) {
      activeLootDrops.delete(guild.id);
      console.error(`Could not post a loot drop in guild ${guild.id}:`, error);
      return;
    }

    const collector = message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: lootDropDurationMs,
    });
    collector.on('collect', async interaction => {
      if (drop.claimed) {
        await interaction.reply({ content: 'Someone already claimed this drop.', flags: MessageFlags.Ephemeral })
          .catch(error => console.warn(`Could not acknowledge duplicate loot claim ${drop.id}:`, error));
        return;
      }

      drop.claimed = true;
      try {
        grantLootDrop(guild.id, interaction.user.id, drop);
      } catch (error) {
        drop.claimed = false;
        console.error(`Could not grant loot drop ${drop.id}:`, error);
        await interaction.reply({ content: 'The reward could not be saved. Please try the button again.', flags: MessageFlags.Ephemeral })
          .catch(replyError => console.error(`Could not report failed loot claim ${drop.id}:`, replyError));
        return;
      }

      collector.stop('claimed');
      try {
        await interaction.update({
          embeds: [lootDropEmbed(drop, interaction.user.id)],
          components: lootDropComponents(drop, true),
          allowedMentions: { parse: [] },
        });
      } catch (error) {
        console.error(`Could not update claimed loot drop ${drop.id}:`, error);
        try {
          await message.edit({
            embeds: [lootDropEmbed(drop, interaction.user.id)],
            components: lootDropComponents(drop, true),
            allowedMentions: { parse: [] },
          });
        } catch (editError) {
          console.error(`Could not disable claimed loot button for ${drop.id}:`, editError);
        }
      }
    });
    collector.on('end', async (_, reason) => {
      if (activeLootDrops.get(guild.id) === drop) activeLootDrops.delete(guild.id);
      if (reason === 'time' && !drop.claimed) {
        try {
          await message.edit({
            embeds: [new EmbedBuilder().setColor(0x7f8c8d)
              .setTitle('Loot drop vanished')
              .setDescription('The loot goblin got impatient and left. There will be another drop.')
              .setTimestamp()],
            components: lootDropComponents(drop, true),
          });
        } catch (error) {
          console.warn(`Could not mark loot drop ${drop.id} as expired:`, error);
        }
      }
      scheduleLootDrop(guild, lootDropChannels.get(guild.id), false);
    });
  }, delay);
  timer.unref();
  lootDropTimers.set(guild.id, timer);
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
  new SlashCommandBuilder().setName('profile').setDescription('Show your game profile, cash, and collectibles')
    .addUserOption(option => option.setName('user').setDescription('Member whose profile to inspect')),
  new SlashCommandBuilder().setName('inventory').setDescription('Show your collectible inventory')
    .addUserOption(option => option.setName('user').setDescription('Member whose inventory to inspect')),
  new SlashCommandBuilder().setName('gameleaderboard').setDescription('Rank the server by game cash'),
  new SlashCommandBuilder().setName('beg').setDescription('Beg for cash and maybe a suspicious favor'),
  new SlashCommandBuilder().setName('hunt').setDescription('Go hunting for money and loot in the wild'),
  new SlashCommandBuilder().setName('dig').setDescription('Dig through the dirt and uncover buried treasure'),
  new SlashCommandBuilder().setName('rob').setDescription('Attempt a bold robbery against another member')
    .addUserOption(option => option.setName('user').setDescription('Member to target for a heist').setRequired(true)),
  new SlashCommandBuilder().setName('gamble').setDescription('Roll the dice and gamble your cash')
    .addIntegerOption(option => option.setName('amount').setDescription('Cash to gamble').setRequired(true).setMinValue(10).setMaxValue(5000)),
  new SlashCommandBuilder().setName('fish').setDescription('Cast a line and catch fishy rewards'),
  new SlashCommandBuilder().setName('hack').setDescription('Attempt a digital hustle for a risky payout')
    .addUserOption(option => option.setName('user').setDescription('Member to troll in a hacker fantasy')),
  new SlashCommandBuilder().setName('highlow').setDescription('Guess whether the next number is higher or lower')
    .addIntegerOption(option => option.setName('bet').setDescription('Cash to stake').setRequired(true).setMinValue(10).setMaxValue(5000)),
  new SlashCommandBuilder().setName('crime').setDescription('Commit a small crime for a risky payday')
    .addUserOption(option => option.setName('user').setDescription('Member to frame, scam, or cooperate with')),
  new SlashCommandBuilder().setName('job').setDescription('Take a job and earn a steady income'),
  new SlashCommandBuilder().setName('countingstart').setDescription('Start a counting game in this channel'),
  new SlashCommandBuilder().setName('countingstop').setDescription('End the counting game in this channel'),
  new SlashCommandBuilder().setName('tictactoe').setDescription('Play Tic-Tac-Toe against a friend or the computer')
    .addUserOption(option => option.setName('opponent').setDescription('Choose a server member for multiplayer; omit for solo')),
  new SlashCommandBuilder().setName('slap').setDescription('Playfully slap a server member')
    .addUserOption(option => option.setName('user').setDescription('Member to slap')),
  new SlashCommandBuilder().setName('pepe').setDescription('Get a playful Pepe energy vibe check')
    .addUserOption(option => option.setName('user').setDescription('Member to give a vibe check')),
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
  new SlashCommandBuilder().setName('badword').setDescription('Manage this server’s automatic word filter')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addSubcommand(subcommand => subcommand.setName('add').setDescription('Add a word or phrase to the filter')
      .addStringOption(option => option.setName('word').setDescription('Word or phrase to filter').setRequired(true).setMinLength(1).setMaxLength(50)))
    .addSubcommand(subcommand => subcommand.setName('remove').setDescription('Remove a word or phrase from the filter')
      .addStringOption(option => option.setName('word').setDescription('Word or phrase to remove').setRequired(true).setMinLength(1).setMaxLength(50)))
    .addSubcommand(subcommand => subcommand.setName('list').setDescription('Show this server’s filtered words')),
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
  new SlashCommandBuilder().setName('dm').setDescription('Send a direct message to one user, several IDs, or server members')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption(option => option.setName('user_id').setDescription('One Discord user ID').setMinLength(17).setMaxLength(20))
    .addStringOption(option => option.setName('user_ids').setDescription('Several Discord IDs separated by commas or new lines').setMaxLength(1000))
    .addBooleanOption(option => option.setName('all_members').setDescription('Send to every human member of this server (Administrator only)'))
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
const maxMassDmRecipients = 2500;
const memberEventChannelId = process.env.MEMBER_EVENT_CHANNEL_ID;
const leaveEventChannelId = process.env.LEAVE_EVENT_CHANNEL_ID || memberEventChannelId;
const serverLogChannelId = process.env.SERVER_LOG_CHANNEL_ID;
const memberCountChannelConfigs = [
  { id: process.env.ALL_MEMBERS_COUNT_CHANNEL_ID, label: 'All Members' },
  { id: process.env.MEMBERS_COUNT_CHANNEL_ID, label: 'Members' },
  { id: process.env.BOTS_COUNT_CHANNEL_ID, label: 'Bots' },
].filter(counter => counter.id);
const memberCountChannelsByGuild = new Map();
let warnedMissingServerLogChannel = false;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Channel, Partials.Message],
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
const botActivities = [
  { type: ActivityType.Watching, name: 'the server pretend it is normal' },
  { type: ActivityType.Watching, name: 'your last brain cell buffering' },
  { type: ActivityType.Watching, name: 'the memes evolve in real time' },
  { type: ActivityType.Watching, name: 'the mods do side quests' },
  { type: ActivityType.Watching, name: 'the chaos unfold' },
  { type: ActivityType.Watching, name: 'people type then delete' },
  { type: ActivityType.Watching, name: 'the typing bubble like a thriller' },
  { type: ActivityType.Watching, name: 'the server lore get deeper' },
  { type: ActivityType.Playing, name: 'hide and seek with the ping' },
  { type: ActivityType.Playing, name: 'rock paper scissors with fate' },
  { type: ActivityType.Playing, name: 'NPC dialogue simulator' },
  { type: ActivityType.Playing, name: 'the tutorial nobody asked for' },
  { type: ActivityType.Playing, name: '404: productivity not found' },
  { type: ActivityType.Playing, name: 'emotional support loading screen' },
  { type: ActivityType.Listening, name: 'the Wi-Fi think' },
  { type: ActivityType.Listening, name: 'keyboard ASMR' },
  { type: ActivityType.Listening, name: 'the council of silly geese' },
  { type: ActivityType.Listening, name: 'the server soundtrack' },
  { type: ActivityType.Competing, name: 'the 2026 yap-a-thon' },
  { type: ActivityType.Competing, name: 'who can say "one more game"' },
  { type: ActivityType.Competing, name: 'the last brain cell Olympics' },
  { type: ActivityType.Competing, name: 'the procrastination world cup' },
  { type: ActivityType.Streaming, name: 'live from the meme dimension', url: 'https://www.twitch.tv/discord' },
  { type: ActivityType.Streaming, name: 'professional button pressing', url: 'https://www.twitch.tv/discord' },
];
const botPresenceStatuses = ['online', 'online', 'idle', 'dnd'];
let lastBotActivityIndex = -1;
let lastBotPresenceStatus = '';

function profileEmbed(user, title) {
  return new EmbedBuilder()
    .setColor(0x40b7e6)
    .setTitle(title)
    .setThumbnail(user.displayAvatarURL({ size: 512 }))
    .setURL(user.displayAvatarURL({ size: 1024 }));
}

function clipped(value, limit = 1024) {
  const text = String(value ?? '').trim();
  if (!text) return 'None';
  return text.length > limit ? `${text.slice(0, limit - 1)}…` : text;
}

async function sendServerLog(guild, { title, description, color = 0x5865f2, fields = [], timestamp = Date.now(), thumbnail }) {
  if (!serverLogChannelId) {
    if (!warnedMissingServerLogChannel) {
      console.warn('Server logging is disabled: set SERVER_LOG_CHANNEL_ID to a private server text channel ID.');
      warnedMissingServerLogChannel = true;
    }
    return;
  }

  try {
    const channel = await guild.channels.fetch(serverLogChannelId);
    if (!channel?.isTextBased() || typeof channel.send !== 'function') {
      throw new Error(`Server log channel ${serverLogChannelId} is not a sendable text channel`);
    }

    const authorName = clipped(`${guild.name} · SERVER LOG`, 256);
    const safeTitle = clipped(title, 256);
    const safeDescription = clipped(description, 4096);
    const footerText = `Server ID · ${guild.id}`;
    const embed = new EmbedBuilder().setColor(color)
      .setAuthor({ name: authorName, ...(guild.iconURL() ? { iconURL: guild.iconURL() } : {}) })
      .setTitle(safeTitle)
      .setDescription(safeDescription)
      .setFooter({ text: footerText })
      .setTimestamp(timestamp);
    if (thumbnail) embed.setThumbnail(thumbnail);
    let remainingText = 6000 - authorName.length - safeTitle.length - safeDescription.length - footerText.length;
    const safeFields = [];
    for (const field of fields.slice(0, 25)) {
      const name = clipped(field.name, 256);
      const availableValueLength = Math.min(1024, remainingText - name.length);
      if (availableValueLength < 1) break;
      const value = clipped(field.value, availableValueLength);
      safeFields.push({ name, value, inline: Boolean(field.inline) });
      remainingText -= name.length + value.length;
    }
    if (safeFields.length) embed.addFields(safeFields);
    await channel.send({ embeds: [embed], allowedMentions: { parse: [] } });
  } catch (error) {
    console.error('Could not post server log:', error);
  }
}

function auditValue(value) {
  if (value === null || value === undefined) return 'None';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.length ? value.map(item => auditValue(item)).join(', ') : 'None';
  return JSON.stringify(value);
}

function attachmentSummary(attachments) {
  const values = [...attachments.values()].map(attachment => `${attachment.name ?? 'attachment'}: ${attachment.url}`);
  return values.length ? values.join('\n') : 'None';
}

function messageTextFields(name, content) {
  if (!content) return [{ name, value: '(No text content)' }];
  const chunks = content.match(/[\s\S]{1,1024}/g) ?? ['(No text content)'];
  return chunks.map((chunk, index) => ({
    name: chunks.length > 1 ? `${name} · PART ${index + 1}` : name,
    value: chunk,
  }));
}

async function resolveMessage(message, eventName) {
  if (!message.partial) return message;
  try {
    return await message.fetch();
  } catch (error) {
    console.warn(`Could not fetch partial message for ${eventName} logging (${message.id}):`, error);
    return message;
  }
}

function formatMembershipDuration(milliseconds) {
  let seconds = Math.max(0, Math.floor(milliseconds / 1000));
  const units = [
    ['day', 86_400],
    ['hour', 3_600],
    ['minute', 60],
    ['second', 1],
  ];
  const parts = [];
  for (const [unit, secondsPerUnit] of units) {
    const count = Math.floor(seconds / secondsPerUnit);
    seconds %= secondsPerUnit;
    if (count) parts.push(`${count} ${unit}${count === 1 ? '' : 's'}`);
  }
  return parts.join(', ') || 'Less than a second';
}

function welcomeEmbed(member) {
  const guild = member.guild;
  const embed = new EmbedBuilder().setColor(0x49c7a4)
    .setAuthor({ name: `${guild.name} · COMMUNITY`, ...(guild.iconURL() ? { iconURL: guild.iconURL() } : {}) })
    .setTitle('A new chapter starts here ✨')
    .setDescription(`Welcome, ${member}!\n\nWe’re so glad you’re here. Make yourself at home, meet the community, and jump into the conversation. Your next great connection starts now.`)
    .setThumbnail(member.user.displayAvatarURL({ size: 512 }))
    .addFields(
      { name: 'MEMBER', value: `**#${guild.memberCount.toLocaleString()}**`, inline: true },
      { name: 'ACCOUNT CREATED', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:D>`, inline: true },
      { name: 'YOUR INVITATION', value: 'Explore the server, say hello, and make this community yours.' },
    )
    .setFooter({ text: `Welcome to ${guild.name}` })
    .setTimestamp();
  const bannerUrl = guild.bannerURL({ size: 1024 });
  if (bannerUrl) embed.setImage(bannerUrl);
  return embed;
}

function leaveEmbed(member, leftAt) {
  const guild = member.guild;
  const joinedAt = member.joinedTimestamp;
  const roles = member.roles.cache
    .filter(role => role.id !== guild.id)
    .map(role => role.name)
    .sort((left, right) => left.localeCompare(right));
  const rolesText = roles.join(', ');
  const embed = new EmbedBuilder().setColor(0xe88772)
    .setAuthor({ name: `${guild.name} · MEMBER UPDATE`, ...(guild.iconURL() ? { iconURL: guild.iconURL() } : {}) })
    .setTitle('A member has departed')
    .setDescription(`**${member.user.tag}** has left the server. We wish them well, wherever they go next.`)
    .setThumbnail(member.user.displayAvatarURL({ size: 512 }))
    .addFields(
      { name: 'MEMBER', value: `${member.user.tag}\n\`${member.id}\``, inline: true },
      { name: 'MEMBERS REMAINING', value: `**${guild.memberCount.toLocaleString()}**`, inline: true },
      { name: 'LEFT AT', value: `<t:${Math.floor(leftAt / 1000)}:F>\n<t:${Math.floor(leftAt / 1000)}:R>`, inline: true },
      { name: 'JOINED AT', value: joinedAt ? `<t:${Math.floor(joinedAt / 1000)}:F>` : 'Unknown', inline: true },
      { name: 'TIME IN SERVER', value: joinedAt ? formatMembershipDuration(leftAt - joinedAt) : 'Unknown', inline: true },
      { name: 'ACCOUNT CREATED', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:F>`, inline: true },
      { name: `ROLES (${roles.length})`, value: rolesText.slice(0, 1024) || 'No roles' },
    )
    .setFooter({ text: `Departure details · ${guild.name}` })
    .setTimestamp(leftAt);
  const bannerUrl = guild.bannerURL({ size: 1024 });
  if (bannerUrl) embed.setImage(bannerUrl);
  return embed;
}

async function postMemberEvent(guild, embed, channelId = memberEventChannelId) {
  if (!channelId) {
    console.warn('Member event not posted: set the matching member event channel ID in .env.');
    return;
  }
  try {
    const channel = await guild.channels.fetch(channelId);
    if (!channel?.isTextBased() || typeof channel.send !== 'function') {
      throw new Error(`Member event channel ${channelId} is not a sendable text channel`);
    }
    await channel.send({ embeds: [embed], allowedMentions: { parse: [] } });
  } catch (error) {
    console.error('Could not post member event:', error);
  }
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: { 'User-Agent': 'ROck Discord bot' } });
  if (!response.ok) throw new Error(`Request failed with HTTP ${response.status}`);
  return response.json();
}

async function updateMemberCountChannels(guild) {
  const channels = memberCountChannelsByGuild.get(guild.id);
  if (!channels?.length) return;

  const cachedMembers = guild.members.cache;
  if (cachedMembers.size < guild.memberCount) {
    console.warn(`Could not update member counters for ${guild.name}: member cache has ${cachedMembers.size} of ${guild.memberCount} members.`);
    return;
  }

  const botCount = cachedMembers.filter(member => member.user.bot).size;
  const counts = {
    'All Members': guild.memberCount,
    Members: guild.memberCount - botCount,
    Bots: botCount,
  };

  for (const { channel, label } of channels) {
    const name = `${label}: ${counts[label].toLocaleString()}`;
    if (channel.name === name) continue;
    try {
      await channel.setName(name);
    } catch (error) {
      console.error(`Could not update ${label} counter channel ${channel.id}:`, error);
    }
  }
}

async function initializeMemberCountChannels(readyClient) {
  for (const config of memberCountChannelConfigs) {
    try {
      const channel = await readyClient.channels.fetch(config.id);
      if (!channel || channel.type !== ChannelType.GuildVoice) {
        throw new Error(`Configured channel ${config.id} is not a voice channel`);
      }
      const channels = memberCountChannelsByGuild.get(channel.guildId) ?? [];
      channels.push({ channel, label: config.label });
      memberCountChannelsByGuild.set(channel.guildId, channels);
    } catch (error) {
      console.error(`Could not initialize ${config.label} counter channel ${config.id}:`, error);
    }
  }

  for (const channels of memberCountChannelsByGuild.values()) {
    const guild = channels[0].channel.guild;
    try {
      await guild.members.fetch();
      await updateMemberCountChannels(guild);
    } catch (error) {
      console.error(`Could not fetch members for ${guild.name} member counters:`, error);
    }
  }
}

client.once(Events.ClientReady, async readyClient => {
  const updateActivity = () => {
    let activityIndex = randomInt(botActivities.length - 1);
    if (lastBotActivityIndex >= 0 && activityIndex >= lastBotActivityIndex) activityIndex += 1;
    lastBotActivityIndex = activityIndex;

    const availableStatuses = botPresenceStatuses.filter(status => status !== lastBotPresenceStatus);
    lastBotPresenceStatus = availableStatuses[randomInt(availableStatuses.length)];
    readyClient.user.setPresence({
      activities: [botActivities[activityIndex]],
      status: lastBotPresenceStatus,
    });
  };
  updateActivity();
  setInterval(updateActivity, 60_000);

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
  await initializeMemberCountChannels(readyClient);
  console.log(`Logged in as ${readyClient.user.tag}`);
});

client.on(Events.GuildMemberAdd, async member => {
  await updateMemberCountChannels(member.guild);
  const embed = welcomeEmbed(member);
  await postMemberEvent(member.guild, embed);
  await sendServerLog(member.guild, {
    title: '✨ Member joined',
    description: `${member.user.tag} joined the server.`,
    color: 0x49c7a4,
    timestamp: member.joinedTimestamp ?? Date.now(),
    thumbnail: member.user.displayAvatarURL({ size: 256 }),
    fields: [
      { name: 'MEMBER', value: `${member}\n${member.user.tag}`, inline: true },
      { name: 'USER ID', value: member.id, inline: true },
      { name: 'ACCOUNT CREATED', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:F>`, inline: true },
      { name: 'MEMBERS NOW', value: String(member.guild.memberCount), inline: true },
    ],
  });
  try {
    await member.user.send({ embeds: [embed], allowedMentions: { parse: [] } });
  } catch (error) {
    console.warn(`Could not send welcome DM to ${member.user.tag}:`, error);
  }
});

client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
  if (newMember.user.bot) return;

  const previousRoleIds = new Set(oldMember.roles.cache.keys());
  const currentRoleIds = new Set(newMember.roles.cache.keys());
  const addedRoles = newMember.roles.cache
    .filter(role => role.id !== newMember.guild.id && !previousRoleIds.has(role.id))
    .map(role => role.name)
    .sort((left, right) => left.localeCompare(right));
  const removedRoles = oldMember.roles.cache
    .filter(role => role.id !== newMember.guild.id && !currentRoleIds.has(role.id))
    .map(role => role.name)
    .sort((left, right) => left.localeCompare(right));
  if (!addedRoles.length && !removedRoles.length) return;

  const embed = new EmbedBuilder()
    .setColor(addedRoles.length && !removedRoles.length ? 0x49c7a4 : removedRoles.length && !addedRoles.length ? 0xe88772 : 0xf1a34a)
    .setAuthor({ name: `${newMember.guild.name} · ROLE UPDATE`, ...(newMember.guild.iconURL() ? { iconURL: newMember.guild.iconURL() } : {}) })
    .setTitle(addedRoles.length && !removedRoles.length ? '🎉 Congratulations on your new role!' : 'Your roles were updated')
    .setDescription(addedRoles.length && !removedRoles.length
      ? 'A new role has been added to your server profile.'
      : 'Here is a summary of the role changes to your server profile.')
    .setThumbnail(newMember.user.displayAvatarURL({ size: 256 }))
    .setTimestamp();

  if (addedRoles.length) {
    embed.addFields({ name: `✅ ROLE${addedRoles.length === 1 ? '' : 'S'} ADDED`, value: clipped(addedRoles.join('\n')) });
  }
  if (removedRoles.length) {
    embed.addFields({ name: `ℹ️ ROLE${removedRoles.length === 1 ? '' : 'S'} REMOVED`, value: clipped(removedRoles.join('\n')) });
  }
  embed.setFooter({ text: 'This is an automatic server notification.' });

  try {
    await newMember.user.send({ embeds: [embed], allowedMentions: { parse: [] } });
  } catch (error) {
    console.warn(`Could not send role update DM to ${newMember.user.tag} in guild ${newMember.guild.id}:`, error);
  }
});

const loggedAuditActions = new Map([
  [AuditLogEvent.ChannelCreate, { title: 'Channel created', color: 0x49c7a4 }],
  [AuditLogEvent.ChannelUpdate, { title: 'Channel updated', color: 0xf1a34a }],
  [AuditLogEvent.ChannelDelete, { title: 'Channel deleted', color: 0xed4245 }],
  [AuditLogEvent.ChannelOverwriteCreate, { title: 'Channel permission added', color: 0x49c7a4 }],
  [AuditLogEvent.ChannelOverwriteUpdate, { title: 'Channel permission updated', color: 0xf1a34a }],
  [AuditLogEvent.ChannelOverwriteDelete, { title: 'Channel permission removed', color: 0xed4245 }],
  [AuditLogEvent.MemberKick, { title: 'Member kicked', color: 0xed4245 }],
  [AuditLogEvent.MemberBanAdd, { title: 'Member banned', color: 0xed4245 }],
  [AuditLogEvent.MemberBanRemove, { title: 'Member unbanned', color: 0x49c7a4 }],
  [AuditLogEvent.MemberUpdate, { title: 'Member moderated', color: 0xf1a34a }],
  [AuditLogEvent.MemberRoleUpdate, { title: 'Member roles updated', color: 0xf1a34a }],
  [AuditLogEvent.RoleCreate, { title: 'Role created', color: 0x49c7a4 }],
  [AuditLogEvent.RoleUpdate, { title: 'Role updated', color: 0xf1a34a }],
  [AuditLogEvent.RoleDelete, { title: 'Role deleted', color: 0xed4245 }],
]);

client.on(Events.GuildMemberRemove, async member => {
  await updateMemberCountChannels(member.guild);
  const leftAt = Date.now();
  const embed = leaveEmbed(member, leftAt);
  await postMemberEvent(member.guild, embed, leaveEventChannelId);
  const roles = member.roles.cache
    .filter(role => role.id !== member.guild.id)
    .map(role => role.name)
    .sort((left, right) => left.localeCompare(right));
  await sendServerLog(member.guild, {
    title: '👋 Member departed',
    description: `${member.user.tag} is no longer a member of the server.`,
    color: 0xe88772,
    timestamp: leftAt,
    thumbnail: member.user.displayAvatarURL({ size: 256 }),
    fields: [
      { name: 'MEMBER', value: `${member.user.tag}\n\`${member.id}\``, inline: true },
      { name: 'JOINED AT', value: member.joinedTimestamp ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>` : 'Unknown', inline: true },
      { name: 'TIME IN SERVER', value: member.joinedTimestamp ? formatMembershipDuration(leftAt - member.joinedTimestamp) : 'Unknown', inline: true },
      { name: 'ROLES', value: clipped(roles.join(', ') || 'No roles') },
      { name: 'MEMBERS NOW', value: String(member.guild.memberCount), inline: true },
    ],
  });
  try {
    await member.user.send({ embeds: [embed], allowedMentions: { parse: [] } });
  } catch (error) {
    console.warn(`Could not send departure DM to ${member.user.tag}:`, error);
  }
});

client.on(Events.GuildAuditLogEntryCreate, async (entry, guild) => {
  const details = loggedAuditActions.get(entry.action);
  if (!details) return;
  if (serverLogChannelId && entry.extra?.channel?.id === serverLogChannelId) return;

  const changes = (entry.changes ?? []).map(change => ({
    name: change.key.replaceAll('_', ' ').toUpperCase(),
    value: `Before: ${auditValue(change.old)}\nAfter: ${auditValue(change.new)}`,
    inline: false,
  }));
  const fields = [
    { name: 'ACTOR', value: entry.executor ? `${entry.executor.tag}\n\`${entry.executor.id}\`` : 'Unknown', inline: true },
    { name: 'TARGET ID', value: entry.targetId ?? 'Unknown', inline: true },
  ];
  if (entry.reason) fields.push({ name: 'REASON', value: entry.reason });
  fields.push(...changes);

  await sendServerLog(guild, {
    title: `🛡️ ${details.title}`,
    description: entry.target ? `${entry.target.tag ?? entry.target.name ?? 'Target'} · audit action \`${entry.action}\`` : `Audit action \`${entry.action}\``,
    color: details.color,
    timestamp: entry.createdAt,
    fields,
  });
});

client.on(Events.MessageUpdate, async (oldMessage, newMessage) => {
  if (!newMessage.guild || newMessage.channelId === serverLogChannelId) return;
  const [before, after] = await Promise.all([
    resolveMessage(oldMessage, 'message edit'),
    resolveMessage(newMessage, 'message edit'),
  ]);
  if (before.author?.bot || after.author?.bot) return;
  if (await moderateBadWordMessage(after)) return;
  const beforeContent = before.content || '(No text content)';
  const afterContent = after.content || '(No text content)';
  const beforeAttachments = attachmentSummary(before.attachments);
  const afterAttachments = attachmentSummary(after.attachments);
  if (beforeContent === afterContent && beforeAttachments === afterAttachments) return;

  await sendServerLog(after.guild, {
    title: '✏️ Message edited',
    description: `A message by ${after.author?.tag ?? 'Unknown member'} was edited in <#${after.channelId}>.`,
    color: 0xf1a34a,
    timestamp: after.editedTimestamp ?? Date.now(),
    thumbnail: after.author?.displayAvatarURL({ size: 256 }),
    fields: [
      { name: 'AUTHOR', value: after.author ? `${after.author.tag}\n\`${after.author.id}\`` : 'Unknown', inline: true },
      { name: 'CHANNEL', value: `<#${after.channelId}>`, inline: true },
      { name: 'MESSAGE ID', value: after.id, inline: true },
      ...messageTextFields('BEFORE', beforeContent),
      ...messageTextFields('AFTER', afterContent),
      { name: 'ATTACHMENTS · BEFORE', value: beforeAttachments },
      { name: 'ATTACHMENTS · AFTER', value: afterAttachments },
      { name: 'JUMP TO MESSAGE', value: `[Open message](https://discord.com/channels/${after.guild.id}/${after.channelId}/${after.id})` },
    ],
  });
});

client.on(Events.MessageCreate, async message => {
  await moderateBadWordMessage(message);
});

client.on(Events.MessageCreate, async message => {
  if (!message.guild || message.author.bot || message.channelId === serverLogChannelId) return;
  await sendServerLog(message.guild, {
    title: '💬 Message sent',
    description: `${message.author.tag} sent a message in <#${message.channelId}>.`,
    color: 0x5865f2,
    timestamp: message.createdTimestamp,
    thumbnail: message.author.displayAvatarURL({ size: 256 }),
    fields: [
      { name: 'AUTHOR', value: `${message.author.tag}\n\`${message.author.id}\``, inline: true },
      { name: 'CHANNEL', value: `<#${message.channelId}>`, inline: true },
      { name: 'MESSAGE ID', value: message.id, inline: true },
      ...messageTextFields('MESSAGE CONTENT', message.content || '(No text content)'),
      { name: 'ATTACHMENTS', value: attachmentSummary(message.attachments) },
      { name: 'JUMP TO MESSAGE', value: `[Open message](https://discord.com/channels/${message.guild.id}/${message.channelId}/${message.id})` },
    ],
  });
});

client.on(Events.MessageCreate, async message => {
  if (!message.guild || message.author.bot) return;
  if ([serverLogChannelId, memberEventChannelId, leaveEventChannelId].includes(message.channelId)) return;
  if (countingGames.has(message.channelId) || matchingBadWord(message.guild.id, message.content)) return;

  const now = Date.now();
  const guildId = message.guild.id;
  if (now - (chatReactionCooldowns.get(guildId) ?? 0) < chatReactionCooldownMs) return;
  if (randomInt(30) !== 0) return;

  const previousReaction = lastChatReactions.get(guildId);
  let reactionIndex = randomInt(funnyChatReactions.length);
  if (funnyChatReactions[reactionIndex] === previousReaction) {
    reactionIndex = (reactionIndex + 1) % funnyChatReactions.length;
  }
  const reaction = funnyChatReactions[reactionIndex];
  chatReactionCooldowns.set(guildId, now);

  try {
    await message.react(reaction);
    lastChatReactions.set(guildId, reaction);
  } catch (error) {
    if (chatReactionCooldowns.get(guildId) === now) chatReactionCooldowns.delete(guildId);
    console.warn(`Could not add random chat reaction to message ${message.id}:`, error);
  }
});

client.on(Events.MessageCreate, async message => {
  if (!message.guild || message.author.bot || !message.content.trim()) return;
  if ([serverLogChannelId, memberEventChannelId, leaveEventChannelId].includes(message.channelId)) return;
  if (countingGames.has(message.channelId) || matchingBadWord(message.guild.id, message.content)) return;

  const guildId = message.guild.id;
  const now = Date.now();
  if (now - (chatReplyCooldowns.get(guildId) ?? 0) < chatReplyCooldownMs) return;
  if (randomInt(Math.round(1 / chatReplyChance)) !== 0) return;

  const reply = chatReplyFor(message.content, guildId);
  chatReplyCooldowns.set(guildId, now);
  try {
    await message.reply({
      content: reply,
      allowedMentions: { parse: [] },
    });
    lastChatReplies.set(guildId, reply);
  } catch (error) {
    if (chatReplyCooldowns.get(guildId) === now) chatReplyCooldowns.delete(guildId);
    console.warn(`Could not post a contextual chat reply to message ${message.id}:`, error);
  }
});

client.on(Events.MessageCreate, async message => {
  if (!message.guild || message.author.bot || !message.content.trim()) return;
  if ([serverLogChannelId, memberEventChannelId, leaveEventChannelId].includes(message.channelId)) return;
  if (countingGames.has(message.channelId) || matchingBadWord(message.guild.id, message.content)) return;

  const guildId = message.guild.id;
  const now = Date.now();
  if (activeChatPolls.has(guildId)) return;
  if (now - (chatPollCooldowns.get(guildId) ?? 0) < chatPollCooldownMs) return;
  if (randomInt(Math.round(1 / chatPollChance)) !== 0) return;

  const topic = chatPollFor(message.content);
  const poll = {
    id: randomUUID(),
    question: topic.question,
    options: topic.options,
    votes: new Map(),
  };
  chatPollCooldowns.set(guildId, now);
  activeChatPolls.set(guildId, poll);

  let pollMessage;
  try {
    pollMessage = await message.channel.send({
      embeds: [chatPollEmbed(poll)],
      components: chatPollComponents(poll),
      allowedMentions: { parse: [] },
    });
  } catch (error) {
    activeChatPolls.delete(guildId);
    if (chatPollCooldowns.get(guildId) === now) chatPollCooldowns.delete(guildId);
    console.warn(`Could not post contextual chat poll for message ${message.id}:`, error);
    return;
  }

  const collector = pollMessage.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: chatPollDurationMs,
  });
  collector.on('collect', async interaction => {
    const optionIndex = Number(interaction.customId.split(':').at(-1));
    if (!Number.isInteger(optionIndex) || optionIndex < 0 || optionIndex >= poll.options.length) {
      await interaction.reply({ content: 'That poll option is no longer available.', flags: MessageFlags.Ephemeral })
        .catch(error => console.warn(`Could not acknowledge invalid chat poll vote ${poll.id}:`, error));
      return;
    }

    poll.votes.set(interaction.user.id, optionIndex);
    try {
      await interaction.update({
        embeds: [chatPollEmbed(poll)],
        components: chatPollComponents(poll),
      });
    } catch (error) {
      console.error(`Could not update chat poll ${poll.id} after a vote:`, error);
    }
  });
  collector.on('end', async () => {
    poll.closed = true;
    if (activeChatPolls.get(guildId) === poll) activeChatPolls.delete(guildId);
    try {
      await pollMessage.edit({
        embeds: [chatPollEmbed(poll, true)],
        components: chatPollComponents(poll, true),
      });
    } catch (error) {
      console.warn(`Could not close contextual chat poll ${poll.id}:`, error);
    }
  });
});

async function logDeletedMessage(deletedMessage, guild, bulk = false) {
  if (deletedMessage.channelId === serverLogChannelId) return;
  const message = await resolveMessage(deletedMessage, 'message deletion');
  if (message.author?.bot) return;
  await sendServerLog(guild, {
    title: bulk ? '🗑️ Message removed · bulk action' : '🗑️ Message deleted',
    description: `A message${message.author ? ` by ${message.author.tag}` : ''} was deleted in <#${message.channelId}>.`,
    color: 0xed4245,
    timestamp: Date.now(),
    thumbnail: message.author?.displayAvatarURL({ size: 256 }),
    fields: [
      { name: 'AUTHOR', value: message.author ? `${message.author.tag}\n\`${message.author.id}\`` : 'Unknown · message was not cached', inline: true },
      { name: 'CHANNEL', value: `<#${message.channelId}>`, inline: true },
      { name: 'MESSAGE ID', value: message.id, inline: true },
      ...messageTextFields('MESSAGE CONTENT', message.content || '(No text content available)'),
      { name: 'ATTACHMENTS', value: attachmentSummary(message.attachments) },
    ],
  });
}

client.on(Events.MessageDelete, async deletedMessage => {
  if (automodDeletedMessageIds.delete(deletedMessage.id)) return;
  if (!deletedMessage.guild) return;
  await logDeletedMessage(deletedMessage, deletedMessage.guild);
});

client.on(Events.MessageBulkDelete, async (messages, channel) => {
  if (!channel.guild || channel.id === serverLogChannelId) return;
  for (const message of messages.values()) {
    if (automodDeletedMessageIds.delete(message.id)) continue;
    await logDeletedMessage(message, channel.guild, true);
  }
});

client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
  const guild = newState.guild;
  const member = newState.member ?? oldState.member;
  if (!member) return;

  const changes = [];
  if (!oldState.channelId && newState.channelId) {
    changes.push(`Joined <#${newState.channelId}>`);
  } else if (oldState.channelId && !newState.channelId) {
    changes.push(`Left <#${oldState.channelId}>`);
  } else if (oldState.channelId !== newState.channelId) {
    changes.push(`Moved from <#${oldState.channelId}> to <#${newState.channelId}>`);
  }
  if (oldState.selfMute !== newState.selfMute) changes.push(newState.selfMute ? 'Muted their microphone' : 'Unmuted their microphone');
  if (oldState.serverMute !== newState.serverMute) changes.push(newState.serverMute ? 'Was server-muted' : 'Server mute removed');
  if (oldState.selfDeaf !== newState.selfDeaf) changes.push(newState.selfDeaf ? 'Deafened themselves' : 'Undeafened themselves');
  if (oldState.serverDeaf !== newState.serverDeaf) changes.push(newState.serverDeaf ? 'Was server-deafened' : 'Server deafen removed');
  if (oldState.selfVideo !== newState.selfVideo) changes.push(newState.selfVideo ? 'Turned camera on' : 'Turned camera off');
  if (oldState.streaming !== newState.streaming) changes.push(newState.streaming ? 'Started streaming' : 'Stopped streaming');
  if (oldState.suppress !== newState.suppress) changes.push(newState.suppress ? 'Audience mode enabled' : 'Audience mode disabled');
  if (!changes.length) return;

  const activeChannelId = newState.channelId ?? oldState.channelId;
  await sendServerLog(guild, {
    title: '🔊 Voice activity',
    description: `${member.user.tag}\n${changes.map(change => `• ${change}`).join('\n')}`,
    color: 0x40b7e6,
    timestamp: Date.now(),
    thumbnail: member.user.displayAvatarURL({ size: 256 }),
    fields: [
      { name: 'MEMBER', value: `${member.user.tag}\n\`${member.id}\``, inline: true },
      { name: 'CURRENT CHANNEL', value: newState.channelId ? `<#${newState.channelId}>` : 'Not connected', inline: true },
      ...(activeChannelId ? [{ name: 'CHANNEL ID', value: activeChannelId, inline: true }] : []),
    ],
  });
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
  if (matchingBadWord(message.guild.id, message.content)) return;
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
  if (matchingBadWord(message.guild.id, message.content)) return;

  scheduleLootDrop(message.guild, message.channel);

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
  if (interaction.isButton() && interaction.customId.startsWith('loot:')) {
    const activeDrop = interaction.guildId ? activeLootDrops.get(interaction.guildId) : null;
    if (!activeDrop || activeDrop.id !== interaction.customId.slice('loot:'.length)) {
      await interaction.reply({ content: 'This loot drop has expired. Keep chatting for another one.', flags: MessageFlags.Ephemeral })
        .catch(error => console.warn('Could not acknowledge expired loot drop:', error));
      return;
    }
  }
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
      case 'profile': {
        if (!interaction.inGuild()) {
          return interaction.reply({ content: 'Use this command in a server.', flags: MessageFlags.Ephemeral });
        }
        const user = options.getUser('user') ?? interaction.user;
        const { level, xp } = readLevel(user.id, interaction.guildId);
        const cash = Number(getGameWallet.get(interaction.guildId, user.id)?.cash ?? 0);
        const inventory = getGameInventory.all(interaction.guildId, user.id);
        const itemCount = inventory.reduce((total, item) => total + Number(item.quantity), 0);
        const highlights = inventory.slice(0, 3).map(item => {
          const collectible = lootItems.find(candidate => candidate.id === item.item_id);
          return `${collectible?.emoji ?? '🎁'} ${collectible?.name ?? item.item_id} ×${item.quantity}`;
        });
        const embed = new EmbedBuilder().setColor(0x40b7e6)
          .setAuthor({ name: `${interaction.guild.name} · PLAYER PROFILE` })
          .setTitle(`${user.username}'s Loot & Lore`)
          .setThumbnail(user.displayAvatarURL({ size: 256 }))
          .setDescription('A tiny digital empire built one suspicious button at a time.')
          .addFields(
            { name: 'LEVEL', value: `**${level}** · ${xp}/${xpPerLevel} XP`, inline: true },
            { name: 'CASH', value: `💵 **$${cash}**`, inline: true },
            { name: 'COLLECTIBLES', value: `🎒 **${itemCount}** item${itemCount === 1 ? '' : 's'}`, inline: true },
            { name: 'COLLECTION HIGHLIGHTS', value: highlights.length ? highlights.join('\n') : 'Nothing yet. The next drop could be your origin story.' },
          )
          .setFooter({ text: 'Use /inventory to inspect every collectible.' })
          .setTimestamp();
        await interaction.reply({ embeds: [embed] });
        break;
      }
      case 'inventory': {
        if (!interaction.inGuild()) {
          return interaction.reply({ content: 'Use this command in a server.', flags: MessageFlags.Ephemeral });
        }
        const user = options.getUser('user') ?? interaction.user;
        const inventory = getGameInventory.all(interaction.guildId, user.id);
        const rarityOrder = ['Legendary', 'Epic', 'Rare', 'Uncommon', 'Common'];
        const entries = inventory.map(item => {
          const collectible = lootItems.find(candidate => candidate.id === item.item_id);
          return { collectible, item, rarity: collectible?.rarity ?? 'Collectible' };
        }).sort((left, right) => rarityOrder.indexOf(left.rarity) - rarityOrder.indexOf(right.rarity))
          .map(({ collectible, item, rarity }) => `${collectible?.emoji ?? '🎁'} **${collectible?.name ?? item.item_id}** ×${item.quantity} · ${rarity}`);
        const uniqueCount = inventory.length;
        const raritySummary = rarityOrder.map(rarity => {
          const count = inventory.reduce((total, item) => {
            const collectible = lootItems.find(candidate => candidate.id === item.item_id);
            return total + (collectible?.rarity === rarity ? Number(item.quantity) : 0);
          }, 0);
          return `${rarity}: **${count}**`;
        }).join(' · ');
        const embed = new EmbedBuilder().setColor(0x9b59b6)
          .setTitle(`${user.username}'s Inventory`)
          .setThumbnail(user.displayAvatarURL({ size: 256 }))
          .setDescription(entries.length ? entries.join('\n') : 'Your pockets are empty. The next timed drop could fix that.')
          .addFields({ name: `COLLECTION · ${uniqueCount}/${lootItems.length} unique`, value: raritySummary })
          .setFooter({ text: 'Collectibles are server-specific · Rarities are weighted: Common → Legendary' })
          .setTimestamp();
        await interaction.reply({ embeds: [embed] });
        break;
      }
      case 'beg': {
        if (!interaction.inGuild()) return interaction.reply({ content: 'Use this in a server.', flags: MessageFlags.Ephemeral });
        if (!(await enforceCommandCooldown(interaction, 'beg', 15_000, 'A beggar tax is still active.')) ) break;
        const payout = randomInt(10, 41);
        const reward = Math.random() < 0.25 ? randomInt(5, 21) : 0;
        const outcome = Math.random() < 0.5 ? 'A stranger dropped a few coins in your cup.' : 'A very dramatic uncle handed you cash and a side-eye.';
        const total = payout + reward;
        addGameCashDelta(interaction.guildId, interaction.user.id, total);
        const embed = new EmbedBuilder().setColor(0x49c7a4)
          .setTitle('🪙 Begging run')
          .setDescription(`${outcome}\n\nYou earned **$${total}**.`)
          .addFields(
            { name: 'CASH', value: `+$${payout}`, inline: true },
            { name: 'BONUS', value: reward ? `+$${reward}` : '—', inline: true },
          )
          .setFooter({ text: 'No shame. Just a little hustle.' });
        await playGameAnimation(interaction, '🪙 Checking the vibes…', ['🧍 You ask around…', '👀 Someone reaches for their wallet…'], embed);
        break;
      }
      case 'hunt': {
        if (!interaction.inGuild()) return interaction.reply({ content: 'Use this in a server.', flags: MessageFlags.Ephemeral });
        if (!(await enforceCommandCooldown(interaction, 'hunt', 20_000, 'Your hunting boots are still cooling off.')) ) break;
        const found = randomInt(25, 101);
        const bonus = Math.random() < 0.35 ? randomInt(5, 30) : 0;
        const loot = awardRandomLoot(interaction.guildId, interaction.user.id, 0.3);
        addGameCashDelta(interaction.guildId, interaction.user.id, found + bonus);
        const embed = new EmbedBuilder().setColor(0x2ecc71)
          .setTitle('🦌 Hunting trip')
          .setDescription(`You went off-grid and found **$${found + bonus}** in loot and trinkets.`)
          .addFields(
            { name: 'CASH', value: `+$${found}`, inline: true },
            { name: 'BONUS', value: bonus ? `+$${bonus}` : '—', inline: true },
            { name: 'DROP', value: loot.claimed ? `${loot.item.emoji} ${loot.item.name}` : 'No collectible this time', inline: true },
          );
        await playGameAnimation(interaction, '🦌 Into the wild…', ['🌲 Following tracks…', '🍃 Something rustles nearby…'], embed);
        break;
      }
      case 'dig': {
        if (!interaction.inGuild()) return interaction.reply({ content: 'Use this in a server.', flags: MessageFlags.Ephemeral });
        if (!(await enforceCommandCooldown(interaction, 'dig', 30_000, 'The shovel is still in the dirt.')) ) break;
        const riches = randomInt(40, 180);
        const item = randomLootItem();
        const lucky = Math.random() < 0.28;
        const payout = riches + (lucky ? randomInt(50, 120) : 0);
        addGameCashDelta(interaction.guildId, interaction.user.id, payout);
        if (lucky) addInventoryItem.run(interaction.guildId, interaction.user.id, item.id);
        const embed = new EmbedBuilder().setColor(0xf1c40f)
          .setTitle('⛏️ Treasure dig')
          .setDescription(lucky ? `You unearthed a hidden stash and found **$${payout}** plus ${item.emoji} **${item.name}**.` : `You dug deep and found **$${payout}** in loose change and old trinkets.`)
          .addFields(
            { name: 'CASH', value: `+$${payout}`, inline: true },
            { name: 'TREASURE', value: lucky ? `${item.emoji} ${item.name}` : 'Plain old dirt', inline: true },
          );
        await playGameAnimation(interaction, '⛏️ Digging for treasure…', ['🪨 Breaking through a rocky layer…', '✨ The shovel hits something…'], embed);
        break;
      }
      case 'rob': {
        if (!interaction.inGuild()) return interaction.reply({ content: 'Use this in a server.', flags: MessageFlags.Ephemeral });
        const target = options.getUser('user', true);
        if (target.id === interaction.user.id || target.bot) {
          await interaction.reply({ content: 'Pick another human member as your target.', flags: MessageFlags.Ephemeral });
          break;
        }
        if (!(await enforceCommandCooldown(interaction, 'rob', 50_000, 'Your getaway car is still recharging.')) ) break;
        const targetCash = getGameCash(interaction.guildId, target.id);
        const success = Math.random() < 0.42 && targetCash > 0;
        const payout = success ? Math.min(targetCash, randomInt(20, 120)) : 0;
        if (success) {
          addGameCashDelta(interaction.guildId, interaction.user.id, payout);
          addGameCashDelta(interaction.guildId, target.id, -payout);
        }
        const embed = new EmbedBuilder().setColor(success ? 0xed4245 : 0x95a5a6)
          .setTitle(success ? '💸 Heist successful' : '🚨 Heist failed')
          .setDescription(success ? `You stole **$${payout}** from ${target}.` : `The plan collapsed. ${target} got away and you lost the vibe.`)
          .addFields(
            { name: 'TARGET', value: `${target}`, inline: true },
            { name: 'RESULT', value: success ? `+$${payout}` : 'No payout', inline: true },
          );
        await playGameAnimation(interaction, '🕶️ Planning a heist…', ['🗺️ Checking the escape route…', '🚨 Keeping a low profile…'], embed);
        break;
      }
      case 'gamble': {
        if (!interaction.inGuild()) return interaction.reply({ content: 'Use this in a server.', flags: MessageFlags.Ephemeral });
        const wager = options.getInteger('amount', true);
        const balance = getGameCash(interaction.guildId, interaction.user.id);
        if (wager > balance) {
          await interaction.reply({ content: `You only have **$${balance}**. Lower the bet or get a side hustle.`, flags: MessageFlags.Ephemeral });
          break;
        }
        if (!(await enforceCommandCooldown(interaction, 'gamble', 20_000, 'Roulette is still spinning.')) ) break;
        const won = randomInt(100) < 42;
        const payout = won ? Math.max(1, Math.round(wager * 1.2)) : -wager;
        addGameCashDelta(interaction.guildId, interaction.user.id, payout);
        const embed = new EmbedBuilder().setColor(won ? 0x49c7a4 : 0xed4245)
          .setTitle(won ? '🎲 Lucky streak' : '🎲 House wins')
          .setDescription(won ? `The dice obeyed. You made **$${payout}** profit.` : `Bad roll. You lost **$${Math.abs(payout)}**.`)
          .addFields(
            { name: 'BET', value: `$${wager}`, inline: true },
            { name: 'RESULT', value: won ? `+$${payout}` : `-$${Math.abs(payout)}`, inline: true },
          );
        await playGameAnimation(interaction, '🎲 The table is set…', ['🪙 Your bet is on the table…', '🎰 The wheel is slowing down…'], embed);
        break;
      }
      case 'fish': {
        if (!interaction.inGuild()) return interaction.reply({ content: 'Use this in a server.', flags: MessageFlags.Ephemeral });
        if (!(await enforceCommandCooldown(interaction, 'fish', 25_000, 'The lake is still rippling.')) ) break;
        const value = randomInt(15, 110);
        const rareCatch = Math.random() < 0.18;
        const item = rareCatch ? lootItems[randomInt(lootItems.length)] : null;
        addGameCashDelta(interaction.guildId, interaction.user.id, value);
        if (rareCatch && item) addInventoryItem.run(interaction.guildId, interaction.user.id, item.id);
        const embed = new EmbedBuilder().setColor(rareCatch ? 0x40b7e6 : 0x2f81f7)
          .setTitle(rareCatch ? `🐟 ${item.rarity} catch` : '🐟 Fresh haul')
          .setDescription(rareCatch ? `You reeled in **$${value}** and ${item.emoji} **${item.name}**.` : `You caught **$${value}** worth of fishy fortune.`)
          .addFields(
            { name: 'VALUE', value: `+$${value}`, inline: true },
            { name: 'RARE FIND', value: rareCatch ? `${item.emoji} ${item.name}` : 'No special loot', inline: true },
          );
        await playGameAnimation(interaction, '🐟 Waiting for a bite…', ['🌊 The bobber drifts…', '〰️ The line starts tugging…'], embed);
        break;
      }
      case 'hack': {
        if (!interaction.inGuild()) return interaction.reply({ content: 'Use this in a server.', flags: MessageFlags.Ephemeral });
        if (!(await enforceCommandCooldown(interaction, 'hack', 70_000, 'The server firewall still hates you.')) ) break;
        const target = options.getUser('user') ?? interaction.user;
        const success = Math.random() < 0.45;
        const reward = success ? randomInt(60, 181) : -Math.min(getGameCash(interaction.guildId, interaction.user.id), randomInt(20, 60));
        addGameCashDelta(interaction.guildId, interaction.user.id, reward);
        const embed = new EmbedBuilder().setColor(success ? 0x5e60ce : 0xed4245)
          .setTitle(success ? '🧠 Digital hustle' : '🧯 Antivirus wins')
          .setDescription(success ? `Your sketchy script paid off. You netted **$${reward}** from ${target}.` : `The firewall survived. You lost **$${Math.abs(reward)}** in failed attempts.`)
          .addFields(
            { name: 'TARGET', value: `${target}`, inline: true },
            { name: 'RESULT', value: success ? `+$${reward}` : `-$${Math.abs(reward)}`, inline: true },
          );
        await playGameAnimation(interaction, '💻 Running the simulation…', ['🔐 Probing the firewall…', '🧩 Testing a harmless exploit…'], embed);
        break;
      }
      case 'highlow': {
        if (!interaction.inGuild()) return interaction.reply({ content: 'Use this in a server.', flags: MessageFlags.Ephemeral });
        const gameKey = `${interaction.guildId}:${interaction.user.id}`;
        if (highLowGames.has(gameKey)) {
          await interaction.reply({ content: 'Finish your current High-Low round before starting another.', flags: MessageFlags.Ephemeral });
          break;
        }
        if (!(await enforceCommandCooldown(interaction, 'highlow', 20_000, 'The deck is reading your aura.')) ) break;
        const bet = options.getInteger('bet', true);
        const balance = getGameCash(interaction.guildId, interaction.user.id);
        if (bet > balance) {
          await interaction.reply({ content: `You only have **$${balance}**. Lower the stake.`, flags: MessageFlags.Ephemeral });
          break;
        }
        const current = randomInt(1, 11);
        const gameId = randomUUID();
        highLowGames.set(gameKey, gameId);
        const prompt = new EmbedBuilder().setColor(0x40b7e6)
          .setTitle('📈 High-Low · Make your call')
          .setDescription(`Your number is **${current}**. Will the next card be higher or lower?\n\n**Stake:** $${bet} · Tie returns your stake\nChoose within 30 seconds.`)
          .setFooter({ text: 'Only you can make a choice · Win profit is adjusted to the odds' });
        let gameMessage;
        try {
          await interaction.reply({ embeds: [prompt], components: highLowComponents(gameId, current) });
          gameMessage = await interaction.fetchReply();
        } catch (error) {
          if (highLowGames.get(gameKey) === gameId) highLowGames.delete(gameKey);
          throw error;
        }
        const collector = gameMessage.createMessageComponentCollector({ componentType: ComponentType.Button, time: 30_000 });
        let settled = false;
        collector.on('collect', async component => {
          if (component.user.id !== interaction.user.id) {
            await component.reply({ content: 'This round belongs to the player who started it.', flags: MessageFlags.Ephemeral });
            return;
          }
          if (settled) {
            await component.reply({ content: 'This round has already been settled.', flags: MessageFlags.Ephemeral });
            return;
          }

          settled = true;
          collector.stop('settling');
          try {
            const direction = component.customId.endsWith(':higher') ? 'higher' : 'lower';
            const next = randomInt(1, 11);
            const tie = next === current;
            const won = direction === 'higher' ? next > current : next < current;
            const availableCash = getGameCash(interaction.guildId, interaction.user.id);
            if (availableCash < bet) {
              await component.update({
                embeds: [new EmbedBuilder().setColor(0x95a5a6).setTitle('📈 High-Low · Round cancelled')
                  .setDescription(`Your balance changed while the round was open. You need **$${bet}**, but now have **$${availableCash}**. No stake was taken.`)],
                components: highLowComponents(gameId, current, true),
              });
              return;
            }

            let delta = 0;
            if (!tie && won) {
              const favorableOutcomes = direction === 'higher' ? 10 - current : current - 1;
              delta = Math.floor((bet * 9) / favorableOutcomes) - bet;
            } else if (!tie) {
              delta = -bet;
            }
            addGameCashDelta(interaction.guildId, interaction.user.id, delta);
            const result = new EmbedBuilder().setColor(tie ? 0xf1c40f : won ? 0x49c7a4 : 0xed4245)
              .setTitle(tie ? '🤝 High-Low · Push' : won ? '🏆 High-Low · You called it' : '🃏 High-Low · Not this time')
              .setDescription(`**${current} → ${next}** · You called **${direction}**.\n${tie ? `It’s a tie; your $${bet} stake is returned.` : won ? `You won **$${delta} profit**.` : `You lost **$${bet}**.`}`)
              .addFields(
                { name: 'STAKE', value: `$${bet}`, inline: true },
                { name: 'PAYOUT', value: tie ? `+$${bet} returned` : won ? `+$${delta}` : `-$${bet}`, inline: true },
                { name: 'BALANCE', value: `💵 $${getGameCash(interaction.guildId, interaction.user.id)}`, inline: true },
              );
            await component.update({ embeds: [result], components: highLowComponents(gameId, current, true) });
          } catch (error) {
            console.error(`Could not settle High-Low round ${gameId}:`, error);
            const report = { content: 'The round could not be displayed. Check /profile for your current balance.', flags: MessageFlags.Ephemeral };
            if (component.deferred || component.replied) await component.followUp(report);
            else await component.reply(report);
          }
        });
        collector.on('end', async (_, reason) => {
          if (highLowGames.get(gameKey) === gameId) highLowGames.delete(gameKey);
          if (reason === 'time') {
            await gameMessage.edit({
              embeds: [new EmbedBuilder().setColor(0x95a5a6).setTitle('📈 High-Low · Round expired')
                .setDescription('No choice was made in time, so no stake was taken.')],
              components: highLowComponents(gameId, current, true),
            }).catch(error => console.warn(`Could not expire High-Low round ${gameId}:`, error));
          }
        });
        break;
      }
      case 'crime': {
        if (!interaction.inGuild()) return interaction.reply({ content: 'Use this in a server.', flags: MessageFlags.Ephemeral });
        if (!(await enforceCommandCooldown(interaction, 'crime', 35_000, 'Your criminal empire is still regrouping.')) ) break;
        const target = options.getUser('user') ?? interaction.user;
        const success = Math.random() < 0.55;
        const reward = success ? randomInt(30, 151) : -Math.min(getGameCash(interaction.guildId, interaction.user.id), randomInt(15, 55));
        addGameCashDelta(interaction.guildId, interaction.user.id, reward);
        const embed = new EmbedBuilder().setColor(success ? 0x9b59b6 : 0xf1a34a)
          .setTitle(success ? '🕵️ Crime pays' : '🛑 Crime doesn’t pay')
          .setDescription(success ? `You pulled off a slick move and made **$${reward}** with ${target}.` : `The scheme backfired. You lost **$${Math.abs(reward)}**.`)
          .addFields(
            { name: 'TARGET', value: `${target}`, inline: true },
            { name: 'RESULT', value: success ? `+$${reward}` : `-$${Math.abs(reward)}`, inline: true },
          );
        await playGameAnimation(interaction, '🕵️ Setting the scheme in motion…', ['🗣️ Working the room…', '🧾 Checking for loose ends…'], embed);
        break;
      }
      case 'job': {
        if (!interaction.inGuild()) return interaction.reply({ content: 'Use this in a server.', flags: MessageFlags.Ephemeral });
        if (!(await enforceCommandCooldown(interaction, 'job', 40_000, 'Your shift rota is still loading.')) ) break;
        const jobs = ['Delivery driver', 'Streamer intern', 'Freelance meme manager', 'Night security goblin', 'UI gremlin', 'Chaos coordinator'];
        const role = jobs[randomInt(jobs.length)];
        const payout = randomInt(50, 180);
        const bonus = Math.random() < 0.2 ? randomInt(20, 80) : 0;
        addGameCashDelta(interaction.guildId, interaction.user.id, payout + bonus);
        const embed = new EmbedBuilder().setColor(0x5865f2)
          .setTitle('💼 Work shift')
          .setDescription(`You clocked in as a **${role}** and earned **$${payout + bonus}**.`)
          .addFields(
            { name: 'ROLE', value: role, inline: true },
            { name: 'PAY', value: `+$${payout + bonus}`, inline: true },
          );
        await playGameAnimation(interaction, '💼 Clocking in…', ['📋 Getting the shift briefing…', '⚙️ Putting in the work…'], embed);
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
      case 'gameleaderboard': {
        if (!interaction.inGuild()) {
          return interaction.reply({ content: 'Use this command in a server.', flags: MessageFlags.Ephemeral });
        }
        const leaders = getGameLeaderboard.all(interaction.guildId);
        if (leaders.length === 0) {
          await interaction.reply('No loot claimed yet. Keep chatting and watch for the next drop.');
          break;
        }
        const champion = leaders[0];
        const entries = leaders.slice(1).map((entry, index) => {
          const rank = index + 2;
          const medal = ['🥈', '🥉'][rank - 2] ?? `**${String(rank).padStart(2, '0')}**`;
          return `${medal}  <@${entry.user}> · **$${entry.cash}** · ${entry.item_count} collectible${entry.item_count === 1 ? '' : 's'}`;
        });
        const embed = new EmbedBuilder().setColor(0xf1c40f)
          .setAuthor({ name: `${interaction.guild.name} · LOOT RANKINGS`, ...(interaction.guild.iconURL() ? { iconURL: interaction.guild.iconURL() } : {}) })
          .setTitle('💰 Game Leaderboard')
          .setDescription(`**TOP LOOT GOBLIN**\n<@${champion.user}> · **$${champion.cash}** · ${champion.item_count} collectible${champion.item_count === 1 ? '' : 's'}\n\n${entries.join('\n')}`)
          .setFooter({ text: `Top ${leaders.length} · Ranked by cash, then collectibles` })
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
      case 'pepe': {
        const user = options.getUser('user') ?? interaction.user;
        const score = randomInt(1, 101);
        const rank = score >= 90
          ? { name: 'Legendary Frog Energy', color: 0x49c7a4 }
          : score >= 70
            ? { name: 'Elite Meme Aura', color: 0x5865f2 }
            : score >= 45
              ? { name: 'Certified Chill', color: 0xf1c40f }
              : score >= 20
                ? { name: 'Quietly Iconic', color: 0x40b7e6 }
                : { name: 'Mysterious Pond Energy', color: 0x95a5a6 };
        const progress = Math.round(score / 10);
        const embed = new EmbedBuilder().setColor(rank.color)
          .setAuthor({
            name: `${interaction.guild?.name ?? 'ROck'} · PEPE VIBE CHECK`,
            ...(interaction.guild?.iconURL() ? { iconURL: interaction.guild.iconURL() } : {}),
          })
          .setTitle('🐸 The Pepe Meter')
          .setDescription(`A totally unofficial vibe check for **${user.username}**.`)
          .setThumbnail(user.displayAvatarURL({ size: 256 }))
          .addFields(
            { name: 'VIBE SCORE', value: `**${score}%**\n${'▰'.repeat(progress)}${'▱'.repeat(10 - progress)}`, inline: true },
            { name: 'PEPE RANK', value: `**${rank.name}**`, inline: true },
          )
          .setFooter({ text: 'Just for fun · Your score may change on the next check' })
          .setTimestamp();
        await interaction.reply({ embeds: [embed], allowedMentions: { parse: [] } });
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
      case 'badword': {
        if (!interaction.inGuild()) {
          return interaction.reply({ content: 'Manage the word filter from a server.', flags: MessageFlags.Ephemeral });
        }
        if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageMessages)) {
          return interaction.reply({ content: 'You need the Manage Messages permission to manage this filter.', flags: MessageFlags.Ephemeral });
        }

        const subcommand = options.getSubcommand();
        if (subcommand === 'list') {
          const words = getBadWords.all(interaction.guildId).map(row => row.word);
          const embed = new EmbedBuilder().setColor(0x5865f2)
            .setAuthor({ name: `${interaction.guild.name} · AUTOMOD`, ...(interaction.guild.iconURL() ? { iconURL: interaction.guild.iconURL() } : {}) })
            .setTitle('🚫 Filtered words')
            .setDescription(words.length ? words.map(word => `• ${word.replaceAll('@', '@\u200b')}`).join('\n') : 'No words or phrases are configured yet.')
            .setFooter({ text: `${words.length}/${maxBadWordsPerGuild} filter entries · Matching is case-insensitive` })
            .setTimestamp();
          await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral, allowedMentions: { parse: [] } });
          break;
        }

        const rawWord = options.getString('word', true);
        const word = rawWord.trim().replace(/\s+/g, ' ').toLowerCase();
        if (!word || /[\u0000-\u001f\u007f]/u.test(word)) {
          return interaction.reply({ content: 'Enter a word or phrase without control characters.', flags: MessageFlags.Ephemeral });
        }
        const safeWord = word.replaceAll('`', 'ˋ');

        if (subcommand === 'add') {
          if (findBadWord.get(interaction.guildId, word)) {
            return interaction.reply({ content: `\`${safeWord}\` is already in this server’s filter.`, flags: MessageFlags.Ephemeral });
          }
          if (countBadWords.get(interaction.guildId).count >= maxBadWordsPerGuild) {
            return interaction.reply({ content: `This server has reached the ${maxBadWordsPerGuild}-entry filter limit. Remove an entry before adding another.`, flags: MessageFlags.Ephemeral });
          }
          const result = addBadWord.run(interaction.guildId, word, interaction.user.id, Date.now());
          if (!result.changes) {
            return interaction.reply({ content: 'That filter entry was added by another moderator at the same time. Try again.', flags: MessageFlags.Ephemeral });
          }
          badWordMatchers.delete(interaction.guildId);
          await interaction.reply({ content: `Added \`${safeWord}\` to this server’s filter.`, flags: MessageFlags.Ephemeral });
          await sendServerLog(interaction.guild, {
            title: '🛡️ Word filter updated',
            description: 'A word or phrase was added to the automatic filter.',
            color: 0x49c7a4,
            fields: [
              { name: 'ACTION', value: 'Added filter entry', inline: true },
              { name: 'WORD OR PHRASE', value: word, inline: true },
              { name: 'MODERATOR', value: `${interaction.user.tag}\n\`${interaction.user.id}\``, inline: true },
            ],
          });
        } else {
          const result = removeBadWord.run(interaction.guildId, word);
          if (!result.changes) {
            return interaction.reply({ content: `\`${safeWord}\` is not in this server’s filter.`, flags: MessageFlags.Ephemeral });
          }
          badWordMatchers.delete(interaction.guildId);
          await interaction.reply({ content: `Removed \`${safeWord}\` from this server’s filter.`, flags: MessageFlags.Ephemeral });
          await sendServerLog(interaction.guild, {
            title: '🛡️ Word filter updated',
            description: 'A word or phrase was removed from the automatic filter.',
            color: 0xf1a34a,
            fields: [
              { name: 'ACTION', value: 'Removed filter entry', inline: true },
              { name: 'WORD OR PHRASE', value: word, inline: true },
              { name: 'MODERATOR', value: `${interaction.user.tag}\n\`${interaction.user.id}\``, inline: true },
            ],
          });
        }
        break;
      }
      case 'warn': {
        const user = options.getUser('user', true);
        const reason = options.getString('reason', true);
        await user.send({ embeds: [new EmbedBuilder().setColor(0xed4245).setTitle(`Warning from ${interaction.guild.name}`).setDescription(reason)] }).catch(() => null);
        await sendServerLog(interaction.guild, {
          title: '⚠️ Member warned',
          description: `${user.tag} received a moderator warning.`,
          color: 0xed4245,
          thumbnail: user.displayAvatarURL({ size: 256 }),
          fields: [
            { name: 'MEMBER', value: `${user.tag}\n\`${user.id}\``, inline: true },
            { name: 'MODERATOR', value: `${interaction.user.tag}\n\`${interaction.user.id}\``, inline: true },
            { name: 'REASON', value: reason },
          ],
        });
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

        const userId = options.getString('user_id');
        const userIdsInput = options.getString('user_ids');
        const allMembers = options.getBoolean('all_members') ?? false;
        const targetModes = Number(Boolean(userId)) + Number(Boolean(userIdsInput)) + Number(allMembers);
        if (targetModes !== 1) {
          return interaction.reply({
            content: 'Choose exactly one recipient option: `user_id`, `user_ids`, or `all_members`.',
            flags: MessageFlags.Ephemeral,
          });
        }
        if (userId && !/^\d{17,20}$/.test(userId)) {
          return interaction.reply({ content: 'Enter a valid Discord user ID (17 to 20 digits).', flags: MessageFlags.Ephemeral });
        }
        const userIds = userIdsInput
          ? [...new Set(userIdsInput.split(/[\s,]+/).filter(Boolean))]
          : [];
        if (userIdsInput && (userIds.some(id => !/^\d{17,20}$/.test(id)) || userIds.length === 0)) {
          return interaction.reply({
            content: 'Enter Discord user IDs separated by commas or new lines. Each ID must contain 17–20 digits.',
            flags: MessageFlags.Ephemeral,
          });
        }
        if (userIds.length > 50) {
          return interaction.reply({ content: 'You can target up to 50 unique user IDs per command.', flags: MessageFlags.Ephemeral });
        }
        if (allMembers && !interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
          return interaction.reply({ content: 'Only server administrators can DM all human members.', flags: MessageFlags.Ephemeral });
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

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
        let recipients;
        const failedIds = [];
        let targetCount;
        if (allMembers) {
          try {
            const members = await interaction.guild.members.fetch();
            recipients = members.filter(member => !member.user.bot).map(member => member.user);
          } catch (error) {
            console.error(`Could not fetch members for /dm in guild ${interaction.guildId}:`, error);
            await interaction.editReply('I could not load this server’s member list. Check the bot’s Server Members intent and try again.');
            break;
          }
          if (recipients.length === 0) {
            await interaction.editReply('This server has no human members to message.');
            break;
          }
          if (recipients.length > maxMassDmRecipients) {
            await interaction.editReply(`This server has ${recipients.length} human members. For reliable delivery and completion reporting, mass DM is limited to ${maxMassDmRecipients} recipients per command.`);
            break;
          }
          targetCount = recipients.length;

          const confirmationId = randomUUID();
          const confirmationRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`dm:confirm:${confirmationId}`).setLabel('Send to all').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId(`dm:cancel:${confirmationId}`).setLabel('Cancel').setStyle(ButtonStyle.Secondary),
          );
          await interaction.editReply({
            content: `This will send a private message to **${recipients.length} human members** in **${interaction.guild.name}**. Confirm within 30 seconds.`,
            components: [confirmationRow],
          });
          const confirmationMessage = await interaction.fetchReply();
          const collector = confirmationMessage.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 30_000,
            max: 1,
            filter: component => component.user.id === interaction.user.id,
          });
          const confirmation = await new Promise(resolve => {
            collector.on('collect', component => resolve(component));
            collector.on('end', () => resolve(null));
          });
          if (!confirmation) {
            await interaction.editReply({ content: 'Mass DM cancelled because it was not confirmed in time.', components: [] });
            break;
          }
          if (confirmation.customId === `dm:cancel:${confirmationId}`) {
            await confirmation.update({ content: 'Mass DM cancelled.', components: [] });
            break;
          }
          await confirmation.update({ content: `Sending to ${recipients.length} human members…`, components: [] });
        } else {
          const recipientIds = userId ? [userId] : userIds;
          targetCount = recipientIds.length;
          recipients = [];
          for (const recipientId of recipientIds) {
            try {
              recipients.push(await client.users.fetch(recipientId));
            } catch (error) {
              console.warn(`Could not fetch /dm recipient ${recipientId}:`, error);
              failedIds.push(recipientId);
            }
          }
          if (recipients.length === 0) {
            await interaction.editReply('I could not find any of those Discord users. Check the IDs and try again.');
            break;
          }
        }
        let delivered = 0;
        for (const [index, recipient] of recipients.entries()) {
          try {
            await recipient.send({
              ...payload,
              allowedMentions: { parse: [] },
            });
            dmReplyRoutes.set(recipient.id, {
              expiresAt: Date.now() + dmReplyWindowMs,
            });
            delivered += 1;
          } catch (error) {
            console.warn(`Could not DM ${recipient.tag ?? recipient.id} from guild ${interaction.guildId}:`, error);
            failedIds.push(recipient.id);
          }

          if ((index + 1) % 25 === 0 && index + 1 < recipients.length) {
            await interaction.editReply(`DM progress: **${delivered}/${index + 1} delivered** · ${failedIds.length} failed · ${recipients.length - index - 1} remaining.`);
          }
          if (index + 1 < recipients.length) await new Promise(resolve => setTimeout(resolve, 250));
        }

        const resultLines = [
          `DM batch complete: **${delivered}/${targetCount} delivered**.`,
          `${failedIds.length} failed; they may have DMs disabled or may have blocked the bot.`,
        ];
        if (failedIds.length) resultLines.push(`Failed IDs: \`${failedIds.slice(0, 10).join('`, `')}\`${failedIds.length > 10 ? ` and ${failedIds.length - 10} more` : ''}.`);
        resultLines.push(`Replies from delivered recipients for the next 24 hours will be posted in <#${dmReplyChannelId}>.`);
        await interaction.editReply(resultLines.join('\n'));
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
