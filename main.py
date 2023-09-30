print('Bot is Starting.....')
import asyncio
import functools
import itertools
import math
import random
import os
import discord
from discord.ext import commands, tasks
import requests
from requests import get
import json
from async_timeout import timeout
import urllib.request
import re
import datetime
from datetime import datetime
import aiohttp
from PIL import Image
from io import BytesIO
import time
import openai
import praw
from discord import ui
from easy_pil import *
import aiosqlite
import pytz
import sqlite3
import wikipedia
from discord import app_commands
import DiscordUtils





#clid = os.getenv('reddit_client_id')
#clsec = os.getenv('reddit_client_secret')
#reddit = praw.Reddit(client_id= clid, client_secret= clsec, user_agent='rock')
#openai.api_key = os.getenv("OPENAI_KEY")
#intents = discord.Intents.all()
#bot = commands.Bot(command_prefix=commands.when_mentioned_or(">"), intents=discord.Intents.all())
#bot = commands.Bot(command_prefix='>')
#bot.remove_command("help")
class persistentbutton(commands.Bot):

  def __init__(self):
    super().__init__(command_prefix=commands.when_mentioned_or(">"),
                     intents=discord.Intents.all())
    self.role = {YOUR_ROLE_ID}

  async def setup_hook(self) -> None:
    self.add_view(button_view())


bot = persistentbutton()


class button_view(discord.ui.View):

  def __init__(self) -> None:
    super().__init__(timeout=None)

  @discord.ui.button(label="Verify",
                     style=discord.ButtonStyle.green,
                     custom_id="verify")
  async def verify(self, interaction: discord.Interaction,
                   button: discord.ui.Button):
    if type(bot.role) is not discord.Role:
      bot.role = interaction.guild.get_role({YOUR_ROLE_ID})
    if bot.role not in interaction.user.roles:
      await interaction.user.add_roles(bot.role)
      await interaction.response.send_message(
        f'You are now {bot.role.mention}!', ephemeral=True)
      embed = discord.Embed(
        title=f"Hey {interaction.user.name} you are now verified ✅ !!",
        description=
        "**Welcome to our Discord community! We're so glad you're here. We hope you have a great time chatting and getting to know everyone. If you have any questions or need any help, don't hesitate to reach out to a moderator or ask in the general channel. We look forward to getting to know you better! You can also DM the bot! for any query or feedback. Also dont forget to checkout the server rules [[HERE]](https://discord.com/channels/888804753738457138/889483311171391519)**",
        color=0x05f06d)
      embed.set_author(name=f"{interaction.guild.name}",
                       icon_url=interaction.guild.icon)
      embed.timestamp = datetime.now()
      await interaction.user.send(embed=embed)
    else:
      await interaction.response.send_message(
        f'You are already {bot.role.mention}!', ephemeral=True)


bot.remove_command("help")


@bot.group(invoke_without_command=True)
async def help(ctx):
  helembed = discord.Embed(
    title="Help",
    description="Use `>help [command]` for more information on a command.",
    color=ctx.author.color)
  helembed.add_field(name="🔧Utility", value="`ping`, `update`")
  helembed.add_field(name="🎉Fun", value="`slap`, `emojify`, `echo`, `meme`, `pepe`, `wanted`, `gif`, `choose`, `joke`, `wiki`, `hack`, `quote`, `bullla`")
  helembed.add_field(name="🛠️Server Utility", value="`membercount`, `avatar`, `serverinfo`, `userinfo`, `level`, `setbday`, `leaderboard`")
  helembed.add_field(name="🕹️Games", value="`8ball`, `rolldice`, `flipcoin`, `tictactoe`, `counting`")
  helembed.add_field(name="🙂Emotes", value="`blush`, `cry`, `dance`, `lewd`")
  helembed.add_field(name="🤗Actions", value="`kick`, `punch`, `hug`, `lick`, `kiss`, `bite`, `cuddle`, `nom`, `pat`, `poke`, `stare`, `highfive`, `greet`, `handholding`, `tickle`, `kill`, `hold`, `wave`, `snuggle`, `bully`")
  helembed.add_field(name="🎹Music", value="`join`, `leave`, `play`")
  helembed.add_field(name="🦾Moderation", value="`mute`, `unmute`, `warn`")
  
  helembed.set_footer(text="DM the bot for any query or support.⚙️")

  await ctx.send(embed=helembed)


@help.command()
async def ping(ctx):
  em = discord.Embed(
    title="ping",
    description="Pings the bot and checks the bot is online and responding.",
    color=ctx.author.color)
  em.add_field(name="***syntax***", value=">ping")
  await ctx.send(embed=em)


@help.command()
async def slap(ctx):
  em = discord.Embed(title="slap",
                     description="Slaps a user",
                     color=ctx.author.color)
  em.add_field(name="***syntax***", value=">slap <@user> <reason>")
  await ctx.send(embed=em)


@help.command()
async def emojify(ctx):
  em = discord.Embed(title="emojify",
                     description="Converts a given string to emoji",
                     color=ctx.author.color)
  em.add_field(name="***syntax***", value=">emojify <value>")
  await ctx.send(embed=em)


@help.command()
async def meme(ctx):
  em = discord.Embed(title="meme",
                     description="Sends a random meme",
                     color=ctx.author.color)
  em.add_field(name="***syntax***", value=">meme")
  await ctx.send(embed=em)


@help.command()
async def membercount(ctx):
  em = discord.Embed(title="membercount",
                     description="Counts the number of members in the server",
                     color=ctx.author.color)
  em.add_field(name="***syntax***", value=">membercount")
  await ctx.send(embed=em)


@help.command()
async def avatar(ctx):
  em = discord.Embed(
    title="avatar",
    description=
    "Shows the avatar of the user or someone else mentioned by the user",
    color=ctx.author.color)
  em.add_field(name="***syntax***", value=">avatar or >avatar <@user>")
  await ctx.send(embed=em)


@help.command()
async def find(ctx):
  em = discord.Embed(title="find",
                     description="Searches the web and sends the results",
                     color=ctx.author.color)
  em.add_field(name="***syntax***", value=">find <query>")
  await ctx.send(embed=em)


@help.command(aliases=['8ball'])
async def _8ball(ctx):
  em = discord.Embed(title="8ball",
                     description="Ask a yes/no Question and get an answer",
                     color=ctx.author.color)
  em.add_field(name="***syntax***",
               value=">8b <question> OR >8ball <question>")
  await ctx.send(embed=em)


@help.command()
async def pepe(ctx):
  em = discord.Embed(
    title="pepe",
    description="Measure the size of your pepe and other members",
    color=ctx.author.color)
  em.add_field(name="***syntax***", value=">pepe OR >pepe <@user>")
  await ctx.send(embed=em)


@help.command()
async def rolldice(ctx):
  em = discord.Embed(title="rolldice",
                     description="Rolls a dice",
                     color=ctx.author.color)
  em.add_field(name="***syntax***", value=">rolldice")
  await ctx.send(embed=em)


@help.command()
async def flipcoin(ctx):
  em = discord.Embed(title="flipcoin",
                     description="Flips a coin",
                     color=ctx.author.color)
  em.add_field(name="***syntax***", value=">flipcoin")
  await ctx.send(embed=em)


@help.command()
async def serverinfo(ctx):
  em = discord.Embed(title="serverinfo",
                     description="Shows information about the server",
                     color=ctx.author.color)
  em.add_field(name="***syntax***", value=">serverinfo")
  await ctx.send(embed=em)


@help.command()
async def userinfo(ctx):
  em = discord.Embed(title="userinfo",
                     description="Shows information about a user",
                     color=ctx.author.color)
  em.add_field(name="***syntax***", value=">userinfo")
  await ctx.send(embed=em)


@help.command()
async def wanted(ctx):
  em = discord.Embed(title="wanted",
                     description="sends a wanted image of the user",
                     color=ctx.author.color)
  em.add_field(name="***syntax***", value=">wanted <@user>")
  await ctx.send(embed=em)


@help.command()
async def update(ctx):
  em = discord.Embed(title="update",
                     description="Updates about the bot and the server",
                     color=ctx.author.color)
  em.add_field(name="***syntax***", value=">update")
  await ctx.send(embed=em)


@help.command()
async def tictactoe(ctx):
  em = discord.Embed(
    title="tictactoe",
    description=
    "Play a nice ticatactoe game. To place the mark you need to use the `place` command (ie. `>place 5/1/2/3/4/6/7/8/9`). To stop the game use `>stop` ",
    color=ctx.author.color)
  em.add_field(name="***syntax***",
               value=">tictactoe/>ttt <@player1> <@player2>")
  await ctx.send(embed=em)


@help.command()
async def level(ctx):
  em = discord.Embed(title="Level",
                     description="Shows a user level in the server",
                     color=ctx.author.color)
  em.add_field(name="***syntax***", value=">level @user")
  await ctx.send(embed=em)


@help.command()
async def setbday(ctx):
  em = discord.Embed(title="Set Birthday",
                     description="Set birthdays of users and get wished",
                     color=ctx.author.color)
  em.add_field(name="***syntax***",
               value=">setbday dd/mm/yyyy @user(optional)")
  await ctx.send(embed=em)


@help.command()
async def leaderboard(ctx):
  em = discord.Embed(title="Server Leaderboard",
                     description="See the server Leaderboard",
                     color=ctx.author.color)
  em.add_field(name="***syntax***", value=">leaderboard")
  await ctx.send(embed=em)


@help.command()
async def counting(ctx):
  em = discord.Embed(title="Counting Game",
                     description="Play a counting game",
                     color=ctx.author.color)
  em.add_field(
    name="***syntax***",
    value=
    ">countingstart (To start a game in the channel)\n>countingstop (To stop a game)"
  )
  await ctx.send(embed=em)


@help.command()
async def gif(ctx):
  em = discord.Embed(title="Get GIF",
                     description="Get various GIFs according to query",
                     color=ctx.author.color)
  em.add_field(name="***syntax***", value=">gif {query}")
  await ctx.send(embed=em)


@help.command()
async def choose(ctx):
  em = discord.Embed(
    title="Choose",
    description="Let me decide a random option from a list of items!",
    color=ctx.author.color)
  em.add_field(name="***syntax***", value=">choose {bag ball pen apple}")
  await ctx.send(embed=em)

@help.command()
async def joke(ctx):
  em = discord.Embed(
    title="joke",
    description="Get a random joke and make your day",
    color=ctx.author.color)
  em.add_field(name="***syntax***", value=">joke")
  await ctx.send(embed=em)

@help.command()
async def quote(ctx):
  em = discord.Embed(
    title="Quote",
    description="Get a random motivational quote incase you are feeling low.",
    color=ctx.author.color)
  em.add_field(name="***syntax***", value=">quote")
  await ctx.send(embed=em)

@help.command()
async def wiki(ctx):
  em = discord.Embed(
    title="Wikipedia",
    description="Get summaries of a topic from the wikipedia",
    color=ctx.author.color)
  em.add_field(name="***syntax***", value=">wiki {query}")
  await ctx.send(embed=em)

@help.command()
async def hack(ctx):
  em = discord.Embed(
    title="Hack",
    description="Hack anybody!",
    color=ctx.author.color)
  em.add_field(name="***syntax***", value=">hack {user}")
  await ctx.send(embed=em)

@help.command()
async def kick(ctx):
  em = discord.Embed(
    title="Kick",
    description="Kick anybody!",
    color=ctx.author.color)
  em.add_field(name="***syntax***", value=">kick [@user]")
  await ctx.send(embed=em)

@help.command()
async def punch(ctx):
  em = discord.Embed(
    title="Punch",
    description="Punch anybody!",
    color=ctx.author.color)
  em.add_field(name="***syntax***", value=">punch [@user]")
  await ctx.send(embed=em)

@help.command()
async def hug(ctx):
  em = discord.Embed(
    title="Hug",
    description="Hugg Somebody!",
    color=ctx.author.color)
  em.add_field(name="***syntax***", value=">hug [@user]")
  await ctx.send(embed=em)

@help.command()
async def lick(ctx):
  em = discord.Embed(
    title="Lick",
    description="Lick Somebody!",
    color=ctx.author.color)
  em.add_field(name="***syntax***", value=">lick [@user]")
  await ctx.send(embed=em)

@help.command()
async def kiss(ctx):
  em = discord.Embed(
    title="Kiss",
    description="Kiss Somebody!",
    color=ctx.author.color)
  em.add_field(name="***syntax***", value=">kiss [@user]")
  await ctx.send(embed=em)

@help.command()
async def bite(ctx):
  em = discord.Embed(
    title="Bite",
    description="Bite Somebody!",
    color=ctx.author.color)
  em.add_field(name="***syntax***", value=">bite [@user]")
  await ctx.send(embed=em)

@help.command()
async def cuddle(ctx):
  em = discord.Embed(
    title="Cuddle",
    description="Cuddle with Somebody!",
    color=ctx.author.color)
  em.add_field(name="***syntax***", value=">cuddle [@user]")
  await ctx.send(embed=em)

@help.command()
async def nom(ctx):
  em = discord.Embed(
    title="Nom",
    description="Express your emotions on others",
    color=ctx.author.color)
  em.add_field(name="***syntax***", value=">nom [@user]")
  await ctx.send(embed=em)

@help.command()
async def pat(ctx):
  em = discord.Embed(
    title="Pat",
    description="Pat Somebody!",
    color=ctx.author.color)
  em.add_field(name="***syntax***", value=">pat [@user]")
  await ctx.send(embed=em)

@help.command()
async def poke(ctx):
  em = discord.Embed(
    title="Poke",
    description="Poke Somebody!",
    color=ctx.author.color)
  em.add_field(name="***syntax***", value=">poke [@user]")
  await ctx.send(embed=em)

@help.command()
async def stare(ctx):
  em = discord.Embed(
    title="Stare",
    description="Stare at somebody!",
    color=ctx.author.color)
  em.add_field(name="***syntax***", value=">stare [@user]")
  await ctx.send(embed=em)

@help.command()
async def highfive(ctx):
  em = discord.Embed(
    title="HighFive",
    description="Give a highfive to somebody!",
    color=ctx.author.color)
  em.add_field(name="***syntax***", value=">highfive [@user]")
  await ctx.send(embed=em)

@help.command()
async def greet(ctx):
  em = discord.Embed(
    title="Greet",
    description="Greet somebody!",
    color=ctx.author.color)
  em.add_field(name="***syntax***", value=">greet [@user]")
  await ctx.send(embed=em)

@help.command()
async def handholding(ctx):
  em = discord.Embed(
    title="Handholding",
    description="Hold someones hand!",
    color=ctx.author.color)
  em.add_field(name="***syntax***", value=">handholding [@user]")
  await ctx.send(embed=em)

@help.command()
async def tickle(ctx):
  em = discord.Embed(
    title="Tickle",
    description="Tickle someone",
    color=ctx.author.color)
  em.add_field(name="***syntax***", value=">tickle [@user]")
  await ctx.send(embed=em)

@help.command()
async def kill(ctx):
  em = discord.Embed(
    title="Kill",
    description="Kill someone",
    color=ctx.author.color)
  em.add_field(name="***syntax***", value=">kill [@user]")
  await ctx.send(embed=em)

@help.command()
async def hold(ctx):
  em = discord.Embed(
    title="Hold",
    description="Hold someone",
    color=ctx.author.color)
  em.add_field(name="***syntax***", value=">hold [@user]")
  await ctx.send(embed=em)

@help.command()
async def wave(ctx):
  em = discord.Embed(
    title="Wave",
    description="Wave at someone",
    color=ctx.author.color)
  em.add_field(name="***syntax***", value=">wave [@user]")
  await ctx.send(embed=em)

@help.command()
async def snuggle(ctx):
  em = discord.Embed(
    title="Snuggle",
    description="Snuggle someone",
    color=ctx.author.color)
  em.add_field(name="***syntax***", value=">snuggle [@user]")
  await ctx.send(embed=em)

@help.command()
async def bully(ctx):
  em = discord.Embed(
    title="Bully",
    description="Bully someone",
    color=ctx.author.color)
  em.add_field(name="***syntax***", value=">bully [@user]")
  await ctx.send(embed=em)

@help.command()
async def blush(ctx):
  em = discord.Embed(
    title="Blush",
    description="Express your emotions!",
    color=ctx.author.color)
  em.add_field(name="***syntax***", value=">blush")
  await ctx.send(embed=em)

@help.command()
async def cry(ctx):
  em = discord.Embed(
    title="Cry",
    description="Express your emotions!",
    color=ctx.author.color)
  em.add_field(name="***syntax***", value=">cry")
  await ctx.send(embed=em)

@help.command()
async def dance(ctx):
  em = discord.Embed(
    title="Dance",
    description="Express your emotions!",
    color=ctx.author.color)
  em.add_field(name="***syntax***", value=">dance")
  await ctx.send(embed=em)

@help.command()
async def lewd(ctx):
  em = discord.Embed(
    title="Lewd",
    description="Express your emotions!",
    color=ctx.author.color)
  em.add_field(name="***syntax***", value=">lewd")
  await ctx.send(embed=em)

@help.command()
async def mute(ctx):
  em = discord.Embed(
    title="Mute",
    description="Mute someone from the server. \n*Moderators only.*",
    color=ctx.author.color)
  em.add_field(name="***syntax***", value=">mute [@user] [reason]")
  await ctx.send(embed=em)

@help.command()
async def unmute(ctx):
  em = discord.Embed(
    title="Unmute",
    description="Unmute someone from the server. \n*Moderators only.*",
    color=ctx.author.color)
  em.add_field(name="***syntax***", value=">unmute [@user]")
  await ctx.send(embed=em)

@help.command()
async def warn(ctx):
  em = discord.Embed(title="Warn", description="Warn someone in the server. \n*Moderators only.*", color=ctx.author.color)
  em.add_field(name="***syntax***", value=">warn [@user] [reason]")
  await ctx.send(embed=em)

@help.command()
async def bulla(ctx):
  em = discord.Embed(title="Bulla", description="Convert someone to muslim(fun purpose)", color=ctx.author.color)
  em.add_field(name="***syntax***", value=">bulla [@user]")
  await ctx.send(embed=em)











  


@bot.command()
async def ping(ctx):
  await ctx.send(f'**🌐 | Pong!** \n\n⬆️⬇️`{round (bot.latency * 1000)} ms`')
  await asyncio.sleep(1)
  await ctx.send(f'⬆️⬇️`{round (bot.latency * 1000)} ms`')
  await asyncio.sleep(1)
  await ctx.send(f'⬆️⬇️`{round (bot.latency * 1000)} ms`')
  await asyncio.sleep(1)
  await ctx.send(f'⬆️⬇️`{round (bot.latency * 1000)} ms`')
  await asyncio.sleep(1)
  await ctx.send(f'⬆️⬇️`{round (bot.latency * 1000)} ms`')



reddit = praw.Reddit(client_id='{your_redit_client_id}', client_secret='{your_reddit_client_secret}', user_agent='{your_reddit_client_agent}')


@bot.command()
async def meme(ctx):
  subreddit = reddit.subreddit('meme')
  hot_posts = subreddit.hot(limit=40)
  post = random.choice(list(hot_posts))
  title = post.title
  url = post.url
  embed = discord.Embed(title=title,
                        description='',
                        color=discord.Color.random()).set_image(url=url)
  embed.timestamp = datetime.now()
  await ctx.send(embed=embed)


async def automeme():
  subreddit = reddit.subreddit("indiandankmemes")
  hot_posts = subreddit.hot(limit=40)
  img_post = [
    post for post in hot_posts if post.url.endswith(("jpg", "png", "gif"))
  ]
  post = random.choice(list(img_post))
  title = post.title
  url = post.url
  embed = discord.Embed(title=title,
                        color=discord.Color.random()).set_image(url=url)
  embed.timestamp = datetime.now()
  channel = bot.get_channel({YOUR_CHANNEL_ID})
  msg = await channel.send(embed=embed)
  await msg.add_reaction("<a:trollface:1076163771875205161>")
  await asyncio.sleep(1)
  await msg.add_reaction("<a:women:1076163144860307526>")
  await asyncio.sleep(1)
  await msg.add_reaction("<a:thumbsup:1076160753339478016>")
  await asyncio.sleep(1)
  await msg.add_reaction("<a:thumbsdown:1076161261764612196>")
  await asyncio.sleep(1)
  await msg.add_reaction("<a:micdrop:1076169285585621152>")
  await asyncio.sleep(1)
  await msg.add_reaction("<a:clown:1076161657123905607>")
  await asyncio.sleep(1)
  await msg.add_reaction("<a:rock:1076159304954019840>")
  await asyncio.sleep(1)
  await msg.add_reaction("<a:love:1076159636790579311>")
  await asyncio.sleep(1)
  await msg.add_reaction("<a:moai:1076160246906621972>")
  await asyncio.sleep(1)
  await msg.add_reaction("<:emoji_1:907368946385170482>")


async def schedule_memes():
  while True:
    timezone = pytz.timezone("Asia/Kolkata")
    current_time = datetime.now(timezone).strftime("%H:%M")
    if current_time == "15:00":
      await automeme()
    elif current_time == "21:00":
      await automeme()
    elif current_time == "03:00":
      await automeme()
    elif current_time == "09:00":
      await automeme()
    await asyncio.sleep(60)  # check the time every 60 seconds


@bot.command()
async def echo(ctx, *, arg):
  await ctx.send(arg)


@bot.command()
async def choose(ctx, *choices: str):
  if not choices:
    msg = await ctx.send("Please provide some choices to choose from.")
    await asyncio.sleep(5)
    await msg.delete()
    return
  embed = discord.Embed(
    description=
    f"✨**| {ctx.author.name}**, I choose: **{random.choice(choices)}**!",
    color=discord.Color.brand_green())
  await ctx.send(embed=embed)


@bot.command()
async def slap(ctx, user: discord.Member = None):
  if user == None:
    user = ctx.author

  reason = [
    'being unhealthy', 'being too savage', 'being unfunny', 'being savage',
    'being too cool', 'being too silly', 'not being cool', 'norminess',
    'being too dank', 'nothing', 'no reason', 'being stud',
    'not doing anything', ' not using reddit', 'using reddit',
    'being sarcastic', 'disrespecting others', 'being dick', 'watching porn',
    'being lewd', 'being sad', 'being depressed', 'being silly',
    'being too silly', 'being stupid', 'being too nothing', 'not suiciding',
    'not going to the gym', 'flirting', 'being flirty', 'not studying',
    'speaking nonsense', 'being too stressed', 'being too angry',
    'being cocky', 'stealing hearts', 'being gay', 'being sexy', 'being ugly',
    'being too sexy', 'being too ugly', 'laziness'
  ]
  slap = Image.open("slap.jpg")

  asset = user.avatar

  data = BytesIO(await asset.read())
  pfp = Image.open(data)

  pfp = pfp.resize((89, 89))
  slap.paste(pfp, (139, 37))
  slap.save("slapped.jpg")
  await ctx.send(
    f'**{user.mention} just got slapped! for {random.choice(reason)}....**')
  await ctx.send(file=discord.File("slapped.jpg"))
  
  
  
@bot.command()
async def bulla(ctx, user: discord.Member = None):
  if user == None:
    user = ctx.author
    
  bulla = Image.open("bulla.png")
  asset = user.avatar
  data = BytesIO(await asset.read())
  pfp = Image.open(data)
  pfp = pfp.resize((93, 71))
  bulla.paste(pfp, (319, 69))
  bulla.save("bulla2.png")
  await ctx.send(f"**{user.mention} is now converted!! Allah hu Akhbar...**")
  await ctx.send(file=discord.File("bulla2.png"))
  
  
  
  


@bot.command()
async def emojify(ctx, *, text):
  emojis = []
  for beans in text.lower():
    if beans.isdecimal():
      num2word = {
        '0': 'zero',
        '1': 'one',
        '2': 'two',
        '3': 'three',
        '4': 'four',
        '5': 'five',
        '6': 'six',
        '7': 'seven',
        '8': 'eight',
        '9': 'nine'
      }
      emojis.append(f':{num2word.get(beans)}:')
    elif beans.isalpha():
      emojis.append(f':regional_indicator_{beans}:')
    else:
      emojis.append(beans)
  await ctx.send(' '.join(emojis))


'''@bot.command()
async def find(ctx,*, query):
		author = ctx.author.mention
		await ctx.channel.send(f"Here are the links related to your question {author} !")
		async with ctx.typing():
				for j in search(query, tld="co.in", num=10, stop=10, pause=2): 
						await ctx.send(f"\n:point_right: {j}")
				await ctx.send("Have any more questions:question:\nFeel free to ask again :smiley: !")'''


@find.error
async def find_error(ctx, error):
  if isinstance(error, commands.MissingRequiredArgument):
    message = await ctx.send(
      "You didn't mentioned anything to search..\nPlease type `>help find` to get more info about the command"
    )
    await asyncio.sleep(5)
    await message.delete()


@bot.command()
async def membercount(ctx):

  a = ctx.guild.member_count
  b = discord.Embed(title=f"members in {ctx.guild.name}",
                    description=a,
                    color=discord.Color.random())
  await ctx.message.reply(embed=b)


@bot.command()
async def avatar(ctx, member: discord.Member = None):
  if member == None:
    member = ctx.author
  memav = member.avatar.url
  avaEmbed = discord.Embed(title=f"{member.name}'s Avatar",
                           color=discord.Color.random())
  avaEmbed.set_image(url=memav)
  await ctx.send(embed=avaEmbed)


@bot.command()
async def pepe(ctx, member: discord.Member = None):
  size = [
    '=', '==', '===', '====', '=====', '=======', '==========',
    '================'
  ]
  res = random.choice(size)
  if member == None:
    member = ctx.author
  pembed = discord.Embed(title=f"{member.name}'s Pepe Size",
                         description=f"8{res}D",
                         color=discord.Color.random())
  pembed.set_footer(text='😎💣')
  await ctx.send(embed=pembed)


@bot.command()
@commands.has_role('mod')
async def DM(ctx, user: discord.User, *, message=None):
  message = message or "This Message is sent via DM"
  dmbed = discord.Embed(title="Here's a message from DripSociety",
                        description=message,
                        color=discord.Color.random())
  dmbed.timestamp = datetime.now()
  await user.send(embed=dmbed)
  await ctx.send('Message Delivered ✅')


@bot.command()
@commands.has_role("mod")
async def dm(ctx, user: discord.User, *, message=None):
  message = message or "This Message is sent from DripSociety"
  await user.send(message)
  await ctx.send("Message Delivered ☑️")



@bot.command()
@commands.has_role("RADIANT")
async def DMall(ctx, *, message=None):
  if message == None:
    await ctx.send("Please enter a message!")
    return
  else:
    counter = 0
    msg = await ctx.send("Sending DMs...")
    for member in ctx.guild.members:
      if not member.bot:
        try:
          embed = discord.Embed(title="Here's a message from DripSociety",
                                description=message,
                                color=discord.Color.random())
          embed.timestamp = datetime.now()
          await member.send(embed=embed)
          counter += 1
          await msg.edit(
            content=f"Sent DMs to {member.mention}, {counter} members ✅...")
          await asyncio.sleep(5)
        except Exception as e:
          await ctx.send(e)
    await msg.edit(content=f"Sent DMs to {counter} members ✅")


@bot.command()
@commands.has_role("RADIANT")
async def dmall(ctx, *, message=None):
  if message == None:
    await ctx.send("Please enter a message!")
    return
  else:
    counter = 0
    msg = await ctx.send("Sending DMs...")
    for member in ctx.guild.members:
      if not member.bot:
        try:
          await member.send(message)
          counter += 1
          await msg.edit(
            content=f"Sent DMs to {member.mention}, {counter} members ☑️...")
          await asyncio.sleep(5)
        except Exception as e:
          await ctx.send(e)
    await msg.edit(content=f"Sent DMs to {counter} members ☑️")



msg_dump_channel = {YOUR_CHANNEL_ID}


@bot.event
async def on_message(message: discord.Message):
  member = message.author
  user = message.author.id
  channel = bot.get_channel(msg_dump_channel)
  if message.guild is None and not message.author.bot:
    # if the channel is public at all, make sure to sanitize this first
    msg = message.content
    dbed = discord.Embed(
      title=f"Here's a DM message from {member.name}",
      description=f"`user id:` {user} \n`Message Content:` \n{msg}",
      color=discord.Color.random())
    dbed.timestamp = datetime.now()
    await channel.send(embed=dbed)
  await bot.process_commands(message)


@bot.command()
async def rolldice(ctx):
  member = ctx.author
  sides = [
    'https://www.clipartmax.com/png/small/215-2158865_dice-clipart-dice-side-dice-1-png.png',
    'https://www.media4math.com/sites/default/files/library_asset/images/MathClipArt--Single-Die-with-2-Showing.png',
    'https://www.clipartmax.com/png/middle/16-167949_number-3-dice-clipart-black-and-white-side-3-of-dice.png',
    'https://www.pngitem.com/pimgs/m/65-650619_transparent-four-png-4-side-of-dice-png.png',
    'https://flyclipart.com/thumb2/clipart-dice-90613.png',
    'https://www.pngitem.com/pimgs/m/614-6141042_library-of-6-dice-number-clip-royalty-free.png'
  ]
  response = random.choice(sides)
  rembed = discord.Embed(title="Here's the result 🎲",
                         description=f"`requested by:` **{member.name}**",
                         color=discord.Color.green())
  rembed.set_thumbnail(url=response)
  rembed.set_footer(text="rolldice 🎲")
  await ctx.send(embed=rembed)


@bot.command()
async def flipcoin(ctx):
  member = ctx.author
  side = ['Heads', 'Tails', 'Heads', 'Tails', 'Heads', 'Tails']
  resp = random.choice(side)
  fmbed = discord.Embed(title=f"{member.name} Here's the result:",
                        description=f"`result:` **{resp}**",
                        color=discord.Color.blue())
  fmbed.set_footer(
    text="flipcoin",
    icon_url=
    "https://freight.cargo.site/t/original/i/8c26cb1e6d8b7aead75057ad75428318b5e604d054e018e62d7b3a628c6bb70b/coinflip_01.gif"
  )
  await ctx.send(embed=fmbed)


@bot.listen()
async def on_message(message):
  if message.author == bot.user:
    return

  msg_content = message.content.lower()

  curseWord = ['curse', 'curse2']

  # delete curse word if match with the list
  if any(word in msg_content for word in curseWord):
    await message.delete()
    member = message.author
    embed = discord.Embed(
      title=f"{member.name} your message has been deleted",
      description=
      f"`userid:` {member.id}\n `reason:` **Presence of curse/foul words**\n\n **🔴 Check out the server-rules**",
      color=discord.Color.red())
    embed.set_thumbnail(
      url=
      'https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/73790822-f2ce-45aa-bcb9-9f89327637d6/ddei491-2f97c4a9-ee92-46ef-977b-053736fcd2ca.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7InBhdGgiOiJcL2ZcLzczNzkwODIyLWYyY2UtNDVhYS1iY2I5LTlmODkzMjc2MzdkNlwvZGRlaTQ5MS0yZjk3YzRhOS1lZTkyLTQ2ZWYtOTc3Yi0wNTM3MzZmY2QyY2EucG5nIn1dXSwiYXVkIjpbInVybjpzZXJ2aWNlOmZpbGUuZG93bmxvYWQiXX0.3t3STdkcqu4rWsegiVd1z_O56YC62beiWLRqn5A3kEI'
    )
    await message.channel.send(embed=embed)
    embed2 = discord.Embed(
      title=f"{member.name} your message has been deleted from the server!",
      description=
      "Your message has been deleted from the server due to presence of badwords... Please follow the [[server rules]](https://discord.com/channels/888804753738457138/889483311171391519) and keep the chat clean. Further breaking of rules in the server may lead to a ban or kick. There are specific channels in the server which are `NSFW` you can ask the moderators for certain roles to access the channels.",
      color=0xee3636)
    embed2.add_field(name="Message content:",
                     value=f"{message.content}",
                     inline=False)
    embed2.add_field(name="Message ID:", value=f"`{message.id}`", inline=False)
    embed2.set_author(name=f"{member.guild.name}", icon_url=member.guild.icon)
    embed2.timestamp = datetime.now()
    await member.send(embed=embed2)


@bot.listen()
async def on_message(message):
  user_id = message.author.id
  message_id = message.id
  content = message.content
  message_channel = message.channel.id
  guildid = message.guild.id
  attachment = message.attachments
  timezone = pytz.timezone("Asia/Kolkata")
  with open('msglogs.txt', 'a+') as file:
    file.write(
      f"New Message > Server: {guildid} | User: {user_id} | Message: {message_id} / {content} | Channel: {message_channel} | Attachment: {attachment} | Time: {datetime.now(timezone).strftime('%H:%M:%S')}\n\n"
    )
    print(
      f"New Message > Server: {guildid} | User: {user_id} | Message: {message_id} / {content} | Channel: {message_channel} | Attachment: {attachment} | Time: {datetime.now(timezone).strftime('%H:%M:%S')}\n\n"
    )


@bot.listen()
async def on_command_error(ctx, error):
  if isinstance(error, commands.CommandNotFound):
    message = await ctx.send(
      "Invalid command used..\nPlease use `>help` for help.")
    await asyncio.sleep(5)
    await message.delete()


@bot.command(aliases=['8b', '8ball'])
async def _8ball(ctx, *, question):
  member = ctx.author
  responses = [
    'It is certain', 'It is decidedly no', 'Without a doubt',
    'Yes - definitely', 'You may rely on it', 'Most likely', 'Outlook good.',
    'Yes.', 'Signs point to yes.', 'Reply hazy, try again.',
    'Ask again later.', 'Better not tell you now.', 'Cannot predict now.',
    'Concentrate and ask again.', 'Donot count on it.', 'My reply is no.',
    'My sources say no.', 'Outlook not very good.', 'Very doubtful.'
  ]
  resp = random.choice(responses)
  eibed = discord.Embed(
    title=f"🎱 | {member.name} your answer:",
    description=f"`Question:` {question} \n`Answer:` {resp}",
    color=discord.Color.blue())
  eibed.set_footer(text='🎱ball')
  await ctx.send(embed=eibed)


@_8ball.error
async def _8ball_error(ctx, error):
  if isinstance(error, commands.MissingRequiredArgument):
    message = await ctx.send(
      "You didn't asked any question..\nPlease type `>help 8ball` to get more info about the command.."
    )
    await asyncio.sleep(5)
    await message.delete()


@bot.command()
async def serverinfo(ctx):
  role_count = len(ctx.guild.roles)
  channels = len(ctx.guild.channels)
  txtchannels = len(ctx.guild.text_channels)
  vcchannels = len(ctx.guild.voice_channels)
  server_icon_url = ctx.guild.icon.url
  list_of_bots = [bot.mention for bot in ctx.guild.members if bot.bot]
  serverinfoembed = discord.Embed(timestamp=ctx.message.created_at,
                                  color=0x00fff5)
  serverinfoembed.set_thumbnail(url=server_icon_url)
  serverinfoembed.add_field(name='Name',
                            value=f"{ctx.guild.name}",
                            inline=True)
  serverinfoembed.add_field(name='Owner',
                            value=f"<@{ctx.guild.owner_id}>",
                            inline=True)
  serverinfoembed.add_field(name='Member Count',
                            value=ctx.guild.member_count,
                            inline=True)
  serverinfoembed.add_field(name='Verification Level',
                            value=str(ctx.guild.verification_level),
                            inline=True)
  serverinfoembed.add_field(name='Highest Role',
                            value=ctx.guild.roles[-2],
                            inline=True)
  serverinfoembed.add_field(name='Number of Roles',
                            value=str(role_count),
                            inline=True)
  serverinfoembed.add_field(name='Bots',
                            value=', '.join(list_of_bots),
                            inline=True)
  serverinfoembed.add_field(
    name=f'Channels: {str(channels)}',
    value=f"Text: {str(txtchannels)}\nVoice: {str(vcchannels)}",
    inline=True)
  serverinfoembed.add_field(name='Server id',
                            value=f"`{ctx.guild.id}`",
                            inline=True)
  serverinfoembed.add_field(
    name='Created at',
    value=ctx.guild.created_at.strftime("%b %d, %Y, %T"),
    inline=True)
  serverinfoembed.add_field(name='Description',
                            value=ctx.guild.description,
                            inline=True)
  await ctx.send(embed=serverinfoembed)


@bot.command()
async def userinfo(ctx, user: discord.Member = None):
  if user == None:
    user = ctx.author

  rlist = []
  for role in user.roles:
    if role.name != "@everyone":
      rlist.append(role.mention)
  b = ', '.join(rlist)
  userembed = discord.Embed(color=user.color, timestamp=ctx.message.created_at)
  userembed.set_author(name=f"User Info - {user}")
  userembed.set_thumbnail(url=user.avatar.url)
  userembed.set_footer(text=f"Requested by- {ctx.author}",
                       icon_url=ctx.author.avatar.url)
  userembed.add_field(name='User Id', value=user.id, inline=True)
  userembed.add_field(name='Name:', value=user.display_name, inline=True)
  userembed.add_field(name='Nickname:', value=user.nick, inline=True)
  userembed.add_field(name='Server', value=user.guild, inline=False)
  userembed.add_field(name='Account age:',
                      value=user.created_at.strftime("%b %d, %Y, %T"),
                      inline=False)
  userembed.add_field(name='Joined at:',
                      value=user.joined_at.strftime("%b %d, %Y, %T"),
                      inline=False)
  userembed.add_field(name='Bot?', value=user.bot, inline=False)
  userembed.add_field(name=f"Roles:({len(rlist)})",
                      value=' '.join([b]),
                      inline=False)
  userembed.add_field(name="TopRole",
                      value=user.top_role.mention,
                      inline=False)
  await ctx.send(embed=userembed)


@bot.command()
async def wanted(ctx, user: discord.Member = None):
  if user == None:
    user = ctx.author

  wanted = Image.open("wanted.jpg")

  asset = user.avatar

  data = BytesIO(await asset.read())
  pfp = Image.open(data)

  pfp = pfp.resize((374, 293))

  wanted.paste(pfp, (42, 222))

  wanted.save("profile.jpg")

  await ctx.send(file=discord.File("profile.jpg"))


@bot.command()
async def update(ctx):
  ubed = discord.Embed(
    title="⫸Update about the bot..⚙️",
    description=
    "**The ROck bot is currently under development stage.. We, the Devs are trying to add more fun commands Everyday... The last command we added was the `>wanted` command... Currently we are working on moderation commands which will be exclusive to certain roles... The bot is not hosted properly yet.. The bot might be offline most of the times.. We are sorry for thar but like told earlier the bot is still under development. So, these issues will remain until the bot is fully developed and deployed properly... Until then stay with us ✌️**",
    color=0x9f0fff)
  ubed.add_field(name="🟢NOTICE", value="*None*", inline=False)
  ubed.add_field(name="🔨Server-update", value="*None*", inline=False)
  ubed.set_thumbnail(
    url=
    "https://cdn.pixabay.com/photo/2017/01/31/19/22/business-2026646__340.png")
  ubed.set_footer(
    text="ROck DEVs 💾",
    icon_url="https://media1.giphy.com/media/26ghbWoXv3G6ypo8o/giphy.gif")
  await ctx.send(embed=ubed)


player1 = ""
player2 = ""
turn = ""
gameOver = True
board = []

winningCondition = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7],
                    [2, 5, 8], [0, 4, 8], [2, 4, 6]]


@bot.command(aliases=['ttt'])
async def tictactoe(ctx, p1: discord.Member, p2: discord.Member):
  global player1
  global player2
  global turn
  global gameOver
  global count
  if gameOver:
    global board
    board = [
      ":white_large_square:", ":white_large_square:", ":white_large_square:",
      ":white_large_square:", ":white_large_square:", ":white_large_square:",
      ":white_large_square:", ":white_large_square:", ":white_large_square:"
    ]
    turn = ""
    gameOver = False
    count = 0
    player1 = p1
    player2 = p2
    #print the board
    line = ""
    for x in range(len(board)):
      if x == 2 or x == 5 or x == 8:
        line += " " + board[x]
        await ctx.send(line)
        line = ""
      else:
        line += " " + board[x]
    #determine who goes first
    num = random.randint(1, 2)
    if num == 1:
      turn = player1
      await ctx.send("It is <@" + str(player1.id) + ">'s turn.")
    elif num == 2:
      turn = player2
      await ctx.send("It is <@" + str(player2.id) + ">'s turn.")
  else:
    await ctx.send(
      "A game is already in progress! Finish it before starting a new one.")


@bot.command()
async def place(ctx, pos: int):
  global turn
  global player1
  global player2
  global board
  global count
  if not gameOver:
    mark = ""
    if turn == ctx.author:
      if turn == player1:
        mark = ":regional_indicator_x:"
      elif turn == player2:
        mark = ":o2:"
      if 0 < pos < 10 and board[pos - 1] == ":white_large_square:":
        board[pos - 1] = mark
        count += 1
        #print board
        line = ""
        for x in range(len(board)):
          if x == 2 or x == 5 or x == 8:
            line += " " + board[x]
            await ctx.send(line)
            line = ""
          else:
            line += " " + board[x]
        checkWinner(winningCondition, mark)
        if gameOver:
          await ctx.send(mark + "Wins! The game is over.")
        elif count >= 9:
          await ctx.send("Its a tie! The game is over.")
        #switch turns
        if turn == player1:
          turn = player2
        elif turn == player2:
          turn = player1
      else:
        await ctx.send(
          "Be sure to choose an integer between 1 and 9 (inclusive) and an unmarked tile."
        )
    else:
      await ctx.send("Its not your turn.")
  else:
    await ctx.send(
      "Please start a new game using the `>ttt/>tictactoe` command.")


def checkWinner(winningConditions, mark):
  global gameOver
  for condition in winningConditions:
    if board[condition[0]] == mark and board[condition[1]] == mark and board[
        condition[2]] == mark:
      gameOver = True


@tictactoe.error
async def tictactoe_error(ctx, error):
  if isinstance(error, commands.MissingRequiredArgument):
    await ctx.send("Please mention 2 players for this command.")
  elif isinstance(error, commands.BadArgument):
    await ctx.send(
      "Please make sure to mention/ping players (ie. <@981078827096756255>).")


@place.error
async def place_error(ctx, error):
  if isinstance(error, commands.MissingRequiredArgument):
    await ctx.send("Please enter a position you would like to mark.")
  elif isinstance(error, commands.BadArgument):
    await ctx.send("Please make sure to enter an integer.")


@bot.command()
async def stop(ctx):
  global gameOver
  gameOver = True
  await ctx.send("The game has been stopped.")


openai.api_key = '{OPEN-AI API KEY}'


def generate_text(prompt):
  completions = openai.Completion.create(
    engine="text-davinci-002",
    prompt=prompt,
    max_tokens=1024,
    n=1,
    stop=None,
    temperature=0.5,
  )

  message = completions.choices[0].text
  return message


'''@bot.listen()
async def on_message(message):
  if message.author == bot.user:
    return
  if message.channel.name == "🔒red-room" and message.content.startswith('Ro '):
    try:
      await message.channel.typing()
      await asyncio.sleep(3)
      prompt = message.content[3:]
      response = generate_text(prompt)
      await message.reply(response)
    except Exception as e:
      await message.reply(
        "Sorry, there was an error with the bot: {}".format(e))
  elif message.channel.name != "🔒red-room" and message.content.startswith(
      'Ro'):
    await message.reply(
      "You can only use this command in the <#889479472355614750> channel. Try again in the <#889479472355614750> channel."
    )'''


message_log = {}


@bot.listen()
async def on_message(message):
  message_log[message.id] = message.content


@bot.listen()
async def on_message_delete(message):
  if message.author == bot.user:
    return
  log_channel = bot.get_channel({YOUR_CHANNEL_ID})
  async for entry in message.guild.audit_logs(
      limit=1, action=discord.AuditLogAction.message_delete):
    deleter = entry.user
    embed = discord.Embed(
      description=f"`Message content:`\n{message_log[message.id]}",
      color=0x9c08ff)
    embed.set_author(name=f"{deleter.name} deleted a message!",
                     icon_url=deleter.avatar)
    embed.add_field(name="Message author:",
                    value=f"{message.author}",
                    inline=True)
    embed.add_field(
      name="User ID's:",
      value=
      f"{deleter.name}: `{deleter.id}`\n{message.author.name}: `{message.author.id}`",
      inline=True)
    embed.add_field(name="Message channel:",
                    value=f"#{message.channel}",
                    inline=True)
    embed.set_footer(text="Deleted at:")
    embed.timestamp = datetime.now()
    await log_channel.send(embed=embed)


@bot.listen()
async def on_message_edit(before, after):
  if before.author == bot.user:
    return
  if before.author.bot:
    return
  log_channel = bot.get_channel({YOUR_CHANNEL_ID})
  if before.id in message_log:
    embed = discord.Embed(title="Message edited!", color=0x9c08ff)
    embed.add_field(name="Message Author:",
                    value=f"{before.author}",
                    inline=True)
    embed.add_field(name="Channel:", value=f"#{before.channel}", inline=True)
    embed.add_field(name="Before:",
                    value=f"{message_log[before.id]}",
                    inline=True)
    embed.add_field(name="After:", value=f"{after.content}", inline=True)
    embed.add_field(name="User ID:",
                    value=f"`{before.author.id}`",
                    inline=True)
    embed.add_field(name="Message ID:", value=f"`{before.id}`", inline=True)
    embed.set_footer(text="Edited at:")
    embed.timestamp = datetime.now()
    await log_channel.send(embed=embed)


@bot.listen()
async def on_guild_channel_create(channel):
  async for entry in channel.guild.audit_logs(
      limit=1, action=discord.AuditLogAction.channel_create):
    creator = entry.user
    log_channel = bot.get_channel({YOUR_CHANNEL_ID})
    log_message = f"A {channel.type} channel with ID {channel.id} was created at {channel.created_at} by {creator}\n"
    log_message += f"Channel name: {channel.name}"
    embed = discord.Embed(title="New Channel created!", color=0x9c08ff)
    embed.add_field(name="Channel type:",
                    value=f"#{channel.type}-channel",
                    inline=True)
    embed.add_field(name="Channel Name:", value=f"{channel.name}", inline=True)
    embed.add_field(name="Created By:", value=f"{creator.name}", inline=True)
    embed.add_field(name="User ID", value=f"`{creator.id}`", inline=True)
    embed.add_field(name="Channel ID:", value=f"`{channel.id}`", inline=True)
    embed.set_footer(text="Created at:")
    embed.timestamp = datetime.now()
    await log_channel.send(embed=embed)


@bot.listen()
async def on_user_update(before, after):
  log_channel = bot.get_channel({YOUR_CHANNEL_ID})
  if before.avatar != after.avatar:
    embed = discord.Embed(color=0x9c08ff)
    embed.set_author(name=f"{before.name} changed their avatar!",
                     icon_url=before.avatar)
    embed.set_thumbnail(url=after.avatar)
    embed.add_field(name="Before:",
                    value=f"[**[Click Here]**]({before.avatar})",
                    inline=True)
    embed.add_field(name="After:",
                    value=f"[**[Click Here]**]({after.avatar})",
                    inline=True)
    embed.set_footer(text="Changed at:")
    embed.timestamp = datetime.now()
    await log_channel.send(embed=embed)


@bot.listen()
async def on_guild_channel_delete(channel):
  async for entry in channel.guild.audit_logs(
      limit=1, action=discord.AuditLogAction.channel_delete):
    deleter = entry.user
    log_channel = bot.get_channel({YOUR_CHANNEL_ID})
    embed = discord.Embed(title="Server channel deleted!", color=0x9c08ff)
    embed.add_field(name="Channel type:",
                    value=f"#{channel.type}-channel",
                    inline=True)
    embed.add_field(name="Channel Name:", value=f"{channel.name}", inline=True)
    embed.add_field(name="Deleted By:", value=f"{deleter.name}", inline=True)
    embed.add_field(name="Channel ID:", value=f"`{channel.id}`", inline=True)
    embed.add_field(name="User ID", value=f"`{deleter.id}`", inline=True)
    embed.set_footer(text="Deleted at:")
    embed.timestamp = datetime.now()
    await log_channel.send(embed=embed)


@bot.listen()
async def on_guild_channel_update(before, after):
  async for entry in after.guild.audit_logs(
      limit=1, action=discord.AuditLogAction.channel_update):
    editor = entry.user
    log_channel = bot.get_channel({YOUR_CHANNEL_ID})
    if before.overwrites != after.overwrites:
      added_permissions = set(after.overwrites) - set(before.overwrites)
      removed_permissions = set(before.overwrites) - set(after.overwrites)
      changed_permissions = set(before.overwrites).intersection(
        set(after.overwrites)) - set(before.overwrites).symmetric_difference(
          set(after.overwrites))
      log_message = ""
      if added_permissions:
        log_message += f"Added permissions: {added_permissions}\n"
      if removed_permissions:
        log_message += f"Removed permissions: {removed_permissions}\n"
      if changed_permissions:
        log_message += f"Changed permissions: {changed_permissions}\n"
      embed = discord.Embed(title="Channel permission changed!",
                            color=0x9c08ff)
      embed.add_field(name="Channel type:",
                      value=f"#{after.type}-channel",
                      inline=True)
      embed.add_field(name="Channel Name:", value=f"{after.name}", inline=True)
      embed.add_field(name="Changed by:", value=f"{editor.name}", inline=True)
      embed.add_field(name="Channel ID:", value=f"`{after.id}`", inline=True)
      embed.add_field(name="User ID:", value=f"`{editor.id}`", inline=True)
      embed.add_field(name="Permissions:", value=log_message, inline=True)
      embed.set_footer(text="Changed at:")
      embed.timestamp = datetime.now()
      await log_channel.send(embed=embed)


@bot.listen()
async def on_member_ban(guild, user):
  log_channel = bot.get_channel({YOUR_CHANNEL_ID})
  async for entry in guild.audit_logs(limit=1,
                                      action=discord.AuditLogAction.ban):
    reason = entry.reason
    moderator = entry.user
    embed = discord.Embed(title="Member Banned!", color=0x9c08ff)
    embed.add_field(name="User:", value=f"{user.name}", inline=True)
    embed.add_field(name="Server:", value=f"{guild.name}", inline=True)
    embed.add_field(name="Moderator:", value=f"{moderator.name}", inline=True)
    embed.add_field(name="Reason", value=f"{reason}", inline=True)
    embed.add_field(name="User ID:", value=f"`{user.id}`", inline=True)
    embed.add_field(name="Mod ID:", value=f"`{moderator.id}`", inline=True)
    embed.set_footer(text="Banned at:")
    embed.timestamp = datetime.now()
    await log_channel.send(embed=embed)


@bot.listen()
async def on_guild_role_create(role):
  log_channel = bot.get_channel({YOUR_CHANNEL_ID})
  async for entry in role.guild.audit_logs(
      limit=1, action=discord.AuditLogAction.role_create):
    creator = entry.user
    permissions = []
    if role.permissions.manage_messages:
      permissions.append("Manage Messages✅")
    if role.permissions.kick_members:
      permissions.append("kick Members✅")
    if role.permissions.ban_members:
      permissions.append("Ban Members✅")
    if role.permissions.manage_roles:
      permissions.append("Manage Roles✅")
    if role.permissions.manage_channels:
      permissions.append("Manage Channels✅")
    if role.permissions.manage_guild:
      permissions.append("Manage guild✅")
    '''if role.permissions.view_channels:
            permissions.append("View Channels✅")
        if role.permissions.manage_emoji_and_stickers:
            permissions.append("Manage Emoji/stickers✅")
        if role.permissons.manage_webhook:
            permissions.append("Manage Webhook✅")
        if role.permissons.manage_server:
            permissions.append("Manage Server✅")
        if role.permissons.create_invite:
            permissions.append("Create Invite✅")
        if role.permissons.change_nickname:
            permissions.append("Change Nickname✅")
        if role.permissons.manage_nickname:
            permissions.append("Manage Nickname✅")
        if role.permissons.timeout_members:
            permissions.append("Timeout Members✅")
        if role.permissons.send_messages:
            permissions.append("Send Message✅")
        if role.permissons.send_messages_in_threads:
            permissions.append("Send Message in Threads✅")
        if role.permissons.create_public_threads:
            permissions.append("Create Public Threads✅")
        if role.permissons.create_private_threads:
            permissions.append("Create Private Threads✅")
        if role.permissons.embed_links:
            permissions.append("Embed Links✅")
        if role.permissons.attach_files:
            permissions.append("Attach Files✅")
        if role.permissons.add_reaction:
            permissions.append("Add Reaction✅")
        if role.permissons.use_external_emoji:
            permissions.append("Use External Emoji✅")
        if role.permissons.use_external_stickers:
            permissions.append("Use External Stickers✅")
        if role.permissons.mention_everyone:
            permissions.append("Mention Everyone✅")
        if role.permissons.manage_threads:
            permissions.append("Manage Threads✅")
        if role.permissons.read_message_history:
            permissions.append("Read Message History✅")
        if role.permissons.send_tts_messages:
            permissions.append("Send tts Message✅")
        if role.permissons.use_application_commands:
            permissions.append("Use app Commands✅")
        if role.permissons.connect:
            permissions.append("Connect✅")
        if role.permissons.speak:
            permissions.append("Speak✅")
        if role.permissons.video:
            permissions.append("Video✅")
        if role.permissons.use_activities:
            permissions.append("Use Activities✅")
        if role.permissons.use_voice_activity:
            permissions.append("Use Voice Activity✅")
        if role.permissons.priority_speaker:
            permissions.append("Priority Speaker✅")
        if role.permissons.mute_members:
            permissions.append("Mute Members✅")
        if role.permissons.deafen_members:
            permissions.append("Deafen Members✅")
        if role.permissons.move_members:
            permissions.append("Move Members✅")
        if role.permissons.manage_events:
            permissions.append("Manage Events✅")
        if role.permissons.adiministrator:
            permissions.append("Administrator✅")
        if role.permissons.view_audit_log:
            permissions.append("View Audit Log✅")
        if role.permissons.kick_members:
            permissions.append("Kick Members✅")
        if role.permissons.ban_members:
            permissions.append("Ban Members✅")'''
    log_message = f"{', '.join(permissions)}"
    embed = discord.Embed(title="New Role Created!", color=0x9c08ff)
    embed.add_field(name="Role Name:", value=f"{role.name}", inline=True)
    embed.add_field(name="Created By:", value=f"{creator.name}", inline=True)
    embed.add_field(name="User ID", value=f"`{creator.id}`", inline=True)
    embed.add_field(name="Role ID:", value=f"`{role.id}`", inline=True)
    embed.add_field(name="Permissions:", value=f"{log_message}", inline=True)
    embed.set_footer(text="Created at:")
    embed.timestamp = datetime.now()
    await log_channel.send(embed=embed)


'''@bot.listen
async def on_guild_role_update(before, after):
    log_channel = bot.get_channel(1056900497405128735)
    async for entry in after.guild.audit_logs(limit=1, action=discord.AuditLogAction.role_update):
        editor = entry.user
        if before.name != after.name:
            log_message = f"{before.name} was renamed to {after.name} at {datetime.utcnow()} by {editor}"
            await log_channel.send(log_message)
        if before.permissions != after.permissions:
            added_permissions = after.permissions - before.permissions
            removed_permissions = before.permissions - after.permissions
            log_message = f"The permissions of {after.name} were edited at {datetime.utcnow()} by {editor}\n"
            if added_permissions:
                log_message += f"Added permissions: {added_permissions}\n"
            if removed_permissions:
                log_message += f"Removed permissions: {removed_permissions}\n"
            await log_channel.send(log_message)

@bot.listen()
async def on_guild_role_update(before, after):
    log_channel = bot.get_channel(1056900497405128735)
    async for entry in after.guild.audit_logs(limit=1, action=discord.AuditLogAction.role_update):
        editor = entry.user
        if before.color != after.color:
            log_message = f"The color of {after.name} was changed to {after.color} at {datetime.utcnow()} by {editor}"
            await log_channel.send(log_message)'''


@bot.listen()
async def on_member_unban(guild, user):
  log_channel = bot.get_channel({YOUR_CHANNEL_ID})
  async for entry in guild.audit_logs(limit=1,
                                      action=discord.AuditLogAction.unban):
    unbanner = entry.user
    log_message = f"{user} was unbanned from {guild.name} by {unbanner} at {datetime.utcnow()}"
    embed = discord.Embed(title="Member Unbanned!", color=0x9c08ff)
    embed.add_field(name="User:", value=f"{user.name}", inline=True)
    embed.add_field(name="Server:", value=f"{guild.name}", inline=True)
    embed.add_field(name="Moderator:", value=f"{unbanner.name}", inline=True)
    embed.add_field(name="User ID:", value=f"`{user.id}`", inline=True)
    embed.add_field(name="Mod ID:", value=f"`{unbanner.id}`", inline=True)
    embed.set_footer(text="Unbanned at:")
    embed.timestamp = datetime.now()
    await log_channel.send(embed=embed)


@bot.listen()
async def on_member_remove(member):
  log_channel = bot.get_channel({YOUR_CHANNEL_ID})
  async for entry in member.guild.audit_logs(
      limit=1, action=discord.AuditLogAction.kick):
    kicker = entry.user
    reason = entry.reason
    log_message = f"{member} was kicked from {member.guild.name} by {kicker} at {datetime.utcnow()} for the following reason: {reason}"
    embed = discord.Embed(title="Member Kicked from server!", color=0x9c08ff)
    embed.add_field(name="Member:", value=f"{member.name}", inline=True)
    embed.add_field(name="Server:", value=f"{member.guild.name}", inline=True)
    embed.add_field(name="Moderator:", value=f"{kicker.name}", inline=True)
    embed.add_field(name="Reason:", value=f"{reason}", inline=True)
    embed.add_field(name="Member ID:", value=f"`{member.id}`", inline=True)
    embed.add_field(name="Mod ID:", value=f"`{kicker.id}`", inline=True)
    embed.set_footer(text="kicked at:")
    embed.timestamp = datetime.now()
    await log_channel.send(embed=embed)


@bot.listen()
async def on_member_join(member):
  log_channel = bot.get_channel({YOUR_CHANNEL_ID})
  embed = discord.Embed(title="New Member joined the Server!", color=0x9c08ff)
  embed.add_field(name="Member:", value=f"{member.name}", inline=False)
  embed.add_field(name="Server:", value=f"{member.guild.name}", inline=False)
  embed.add_field(name="Member ID:", value=f"`{member.id}`", inline=False)
  embed.set_footer(text="Joined at:")
  embed.timestamp = datetime.now()
  await log_channel.send(embed=embed)


@bot.listen()
async def on_member_join(member):
  announce_channel = bot.get_channel(YOUR_CHANNEL_ID)
  embed = discord.Embed(
    title=
    f"@{member.name} aja tujhe welcome karta hu {member.guild.name} me !!",
    description=
    f"Make sure to be respectful to your fellow server members. Treat others how you wish to be treated. Keep all conversation to the appropriate channel whenever possible and dont post any `NSFW` content in the server except in channels specified! \n\nBTW please [check out](https://discord.com/channels/888804753738457138/889483311171391519) the <#889483311171391519> before Steppin in.",
    color=0xff9208)
  embed.set_thumbnail(url=member.avatar)
  embed.set_footer(text="Joined at:")
  embed.timestamp = datetime.now()
  await announce_channel.send(content=f"{member.mention}", embed=embed)
  embed2 = discord.Embed(
    title=f"Hey {member.name} welcome to the {member.guild.name} Server !!",
    description=
    f"But first of all get yourself Verified [[HERE]]({YOUR_CHANNEL_LINK})",
    color=0xf50c60)
  embed2.set_author(name=f"{member.guild.name}", icon_url=member.guild.icon)
  embed2.timestamp = datetime.now()
  await member.send(embed=embed2)


@bot.listen()
async def on_member_remove(member):
  announce_channel = bot.get_channel({YOUR_CHANNEL_ID})
  embed = discord.Embed(title=f"Alas! {member.name} left the server!",
                        color=0xac204d)
  embed.set_author(name=f"{member.name}", icon_url=member.avatar)
  embed.timestamp = datetime.now()
  await announce_channel.send(embed=embed)


@bot.listen()
async def on_member_update(before, after):
  if before.roles != after.roles:
    added_roles = set(after.roles) - set(before.roles)
    if added_roles:
      role_names = ", ".join([r.name for r in added_roles])
      embed = discord.Embed(title=f"🎉wooo! you have been given a new role!",
                            description=f"**Role name: {role_names}**",
                            color=0x09a5ee)
      embed.timestamp = datetime.now()
      await after.send(embed=embed)


'''@bot.listen()
async def on_guild_member_update(before, after):
    log_channel = bot.get_channel(1056900497405128735)
    if before.mute != after.mute:
        if after.mute:
            async for entry in after.guild.audit_logs(limit=1, action=discord.AuditLogAction.member_update):
                muter = entry.user
                mute_duration = after.mute.duration
                mute_reason = after.mute.reason
                log_message = (
                    f"{after} was put into timeout for {mute_duration} seconds by {muter} at {after.mute.created_at} "
                    f"for the following reason: {mute_reason}"
                )
                await log_channel.send(log_message)
        else:
            log_message = f"{after} was removed from timeout by {after.guild.me.name} at {datetime.utcnow()}"
            await log_channel.send(log_message)'''
'''class persistentbutton(commands.Bot):
  def __init__(self):
    super().__init__(command_prefix=commands.when_mentioned_or(">"), intents=discord.Intents.all())
    self.role = 1057656721360814092
  async def setup_hook(self):
    self.add_view(button_view())

bot = persistentbutton()


class button_view(discord.ui.View):
    def __init__(self) -> None:
        super().__init__(timeout=None)

    @discord.ui.button(label="Verify", style=discord.ButtonStyle.green, custom_id="verify")
    async def verify(self, interaction: discord.Interaction, button: discord.ui.Button):
        if type(bot.role) is not discord.Role:
            bot.role = interaction.guild.get_role(1057656721360814092)
        if bot.role not in interaction.user.roles:
            await interaction.user.add_roles(bot.role)
            await interaction.response.send_message(f'You are now {bot.role.mention}!', ephemeral=True)
            embed = discord.Embed(title=f"Hey {interaction.user.name} you are now verified ✅ !!", description="**Welcome to our Discord community! We're so glad you're here. We hope you have a great time chatting and getting to know everyone. If you have any questions or need any help, don't hesitate to reach out to a moderator or ask in the general channel. We look forward to getting to know you better! You can also DM the bot! for any query or feedback. Also dont forget to checkout the server rules [[HERE]](https://discord.com/channels/888804753738457138/889483311171391519)**", color=0x05f06d)
            embed.set_author(name=f"{interaction.guild.name}", icon_url=interaction.guild.icon)
            embed.timestamp = datetime.now()
            await interaction.user.send(embed=embed)
        else:
            await interaction.response.send_message(f'You are already {bot.role.mention}!', ephemeral=True)'''


@bot.listen()
async def on_ready():
  bot.loop.create_task(set_status())
  bot.loop.create_task(schedule_memes())
  print(f"{bot.user} is Online and Serving!!")
  channel = bot.get_channel({YOUR_CHANNEL_ID})
  await channel.send("Online")
  setattr(bot, "db", await aiosqlite.connect("level.db"))
  await asyncio.sleep(3)
  async with bot.db.cursor() as cursor:
    await cursor.execute(
      "CREATE TABLE IF NOT EXISTS levels (level INTEGER, xp INTEGER, user INTEGER, guild INTEGER)"
    )


async def set_status():
  await bot.wait_until_ready()
  statuses = [
    "Breaking Bad", "over the MODS", "over the Server", "the Bots", "| >help",
    "Peaky Blinders", "the sky", "DMs", "Youtube", "Memes", "over members",
    "#Text Channels", "Voice Channels", "| >help", "| >help", "| >help",
    "Stranger Things", "DMs", "DMs", "football", "Soccer", "UFC", "WWE",
    "NBA", "the moon"
  ]
  while not bot.is_closed():
    status = random.choice(statuses)
    await bot.change_presence(activity=discord.Activity(
      type=discord.ActivityType.watching, name=status))
    await asyncio.sleep(30)


@bot.listen()
async def on_message(message):
  if message.author.bot:
    return
  author = message.author
  guild = message.guild
  async with bot.db.cursor() as cursor:
    await cursor.execute("SELECT xp FROM levels WHERE user = ? AND guild = ?",
                         (
                           author.id,
                           guild.id,
                         ))
    xp = await cursor.fetchone()
    await cursor.execute(
      "SELECT level FROM levels WHERE user = ? AND guild = ?", (
        author.id,
        guild.id,
      ))
    level = await cursor.fetchone()

    if not xp or not level:
      await cursor.execute(
        "INSERT INTO levels (level, xp, user, guild) VALUES (?, ?, ?, ?)", (
          0,
          0,
          author.id,
          guild.id,
        ))

    try:
      xp = xp[0]
      level = level[0]
    except TypeError:
      xp = 0
      level = 0

    if level < 5:
      xp += random.randint(1, 3)
      await cursor.execute(
        "UPDATE levels SET xp = ? WHERE user = ? AND guild = ?", (
          xp,
          author.id,
          guild.id,
        ))
    else:
      rand = random.randint(1, (level // 4))
      if rand == 1:
        xp += random.randint(1, 3)
        await cursor.execute(
          "UPDATE levels SET xp = ? WHERE user = ? AND guild = ?", (
            xp,
            author.id,
            guild.id,
          ))
    if xp >= 100:
      level += 1
      await cursor.execute(
        "UPDATE levels SET level = ? WHERE user = ? AND guild = ?", (
          level,
          author.id,
          guild.id,
        ))
      await cursor.execute(
        "UPDATE levels SET xp = ? WHERE user = ? AND guild = ?", (
          0,
          author.id,
          guild.id,
        ))
      embed = discord.Embed(color=0x40f108)
      embed.set_author(name=f"🎉Congrats! {author.name} has advanced to level {level}", icon_url= author.avatar)
      await message.channel.send(content=f"{author.mention}", embed=embed)
      embed2 = discord.Embed(
        title=f"🥳Yuhoo! {author.name} You have reached level {level}",
        description=
        "**Check your level by using `>level` in the server \nTo access the server leaderboard use `>leaderboard` in the server**",
        color=0xf50695)
      embed2.timestamp = datetime.now()
      await author.send(embed=embed2)
    if level == 10:
      role = discord.utils.get(guild.roles, name="{YOUR_ROLE_NAME}")
      if role not in author.roles:
        await author.add_roles(role)

  await bot.db.commit()


@bot.command()
async def level(ctx, member: discord.Member = None):
  if member is None:
    member = ctx.author
  async with bot.db.cursor() as cursor:
    await cursor.execute("SELECT xp FROM levels WHERE user = ? AND guild = ?",
                         (
                           member.id,
                           ctx.guild.id,
                         ))
    xp = await cursor.fetchone()
    await cursor.execute(
      "SELECT level FROM levels WHERE user = ? AND guild = ?", (
        member.id,
        ctx.guild.id,
      ))
    level = await cursor.fetchone()

    if not xp or not level:
      await cursor.execute(
        "INSERT INTO levels (level, xp, user, guild) VALUES (?, ?, ?, ?)",
        (0, 0, member.id, ctx.guild.id))

    try:
      xp = xp[0]
      level = level[0]
    except TypeError:
      xp = 0
      level = 0

    user_data = {
      "name": f"{member.name}#{member.discriminator}",
      "xp": xp,
      "level": level,
      "next_level_xp": 100,
      "percentage": xp,
    }

    background = Editor(Canvas((900, 300), color="#141414"))
    profile_picture = await load_image_async(str(member.avatar.url))
    profile = Editor(profile_picture).resize((150, 150)).circle_image()

    poppins = Font.poppins(size=40)
    poppins_small = Font.poppins(size=30)

    card_right_shape = [(600, 0), (750, 300), (900, 300), (900, 0)]

    background.polygon(card_right_shape, color="#FFFFFF")
    background.paste(profile, (30, 30))

    background.rectangle(
      (30, 220),
      width=650,
      height=40,
      color="#FFFFFF",
      radius=20,
    )
    background.bar(
      (30, 220),
      max_width=650,
      height=40,
      percentage=user_data["percentage"],
      color="#282828",
      radius=20,
    )
    background.text((200, 40),
                    user_data["name"],
                    font=poppins,
                    color="#FFFFFF")

    background.rectangle((200, 100), width=350, height=2, fill="#FFFFFF")
    background.text(
      (200, 130),
      f"Level - {user_data['level']} | XP - {user_data['xp']}/{user_data['next_level_xp']}",
      font=poppins_small,
      color="#FFFFFF",
    )
    file = discord.File(fp=background.image_bytes, filename="levelcard.png")
    await ctx.send(content=f"{member.mention}'s level!", file=file)


@bot.command()
async def leaderboard(ctx):
  async with bot.db.cursor() as cursor:
    await cursor.execute(
      "SELECT user, level FROM levels WHERE guild = ? ORDER BY level DESC LIMIT 10",
      (ctx.guild.id, ))
    leaderboard = await cursor.fetchall()

  if not leaderboard:
    await ctx.send("No one has leveled up yet.")
    return

  embed = discord.Embed(title=f"{ctx.guild.name} Leaderboard 🛡️",
                        color=0x09d2ee)
  for i, (user_id, level) in enumerate(leaderboard):
    user = bot.get_user(user_id)
    embed.add_field(name=f"#{i+1} {user.name}#{user.discriminator} ⚔️",
                    value=f"Level: `{level}`",
                    inline=True)
    embed.set_thumbnail(url=ctx.guild.icon)
    embed.timestamp = datetime.now()

  await ctx.send(embed=embed)


@bot.listen()
async def on_member_join(member):
  # Update the channel name to show the current number of members
  channel = member.guild.get_channel(
    {YOUR_CHANNEL_ID}
  )  # Replace `channel_id` with the ID of the channel you want to update
  await channel.edit(name=f"All Members: {member.guild.member_count}")


@bot.listen()
async def on_member_remove(member):
  # Update the channel name to show the current number of members
  channel = member.guild.get_channel(
    {YOUR_CHANNEL_ID}
  )  # Replace `channel_id` with the ID of the channel you want to update
  await channel.edit(name=f"All Members: {member.guild.member_count}")


async def update_channel_name(channel, member):
  # Set the initial backoff time to 1 second
  backoff_time = 1
  while True:
    try:
      # Update the channel name
      await channel.edit(name=f"Members: {member.guild.member_count}")
      # Reset the backoff time
      backoff_time = 1
      break
    except discord.HTTPException as e:
      if e.status == 429:  # Rate limit error
        # Increase the backoff time
        backoff_time *= 2
        # Wait for the backoff time before retrying
        time.sleep(backoff_time)
      else:
        raise e


@bot.listen()
async def on_member_join(member):
  # Update the channel name to show the current number of bots
  bots = len([m for m in member.guild.members if m.bot])
  channel = member.guild.get_channel(
    {YOUR_CHANNEL_ID}
  )  # Replace `channel_id` with the ID of the channel you want to update
  await channel.edit(name=f"Bots: {bots}")


@bot.listen()
async def on_member_remove(member):
  # Update the channel name to show the current number of bots
  bots = len([m for m in member.guild.members if m.bot])
  channel = member.guild.get_channel(
    {YOUR_CHANNEL_ID}
  )  # Replace `channel_id` with the ID of the channel you want to update
  await channel.edit(name=f"Bots: {bots}")


async def update_channel_name(channel, bots):
  # Set the initial backoff time to 1 second
  backoff_time = 1
  while True:
    try:
      # Update the channel name
      await channel.edit(name=f"Bots: {bots}")
      # Reset the backoff time
      backoff_time = 1
      break
    except discord.HTTPException as e:
      if e.status == 429:  # Rate limit error
        # Increase the backoff time
        backoff_time *= 2
        # Wait for the backoff time before retrying
        time.sleep(backoff_time)
      else:
        raise e


@bot.listen()
async def on_member_join(member):
  # Update the channel name to show the current number of members (excluding the bot)
  members = len([m for m in member.guild.members if not m.bot])
  channel = member.guild.get_channel(
    {YOUR_CHANNEL_ID}
  )  # Replace `channel_id` with the ID of the channel you want to update
  await channel.edit(name=f"Members: {members}")


@bot.listen()
async def on_member_remove(member):
  # Update the channel name to show the current number of members (excluding the bot)
  members = len([m for m in member.guild.members if not m.bot])
  channel = member.guild.get_channel(
    {YOUR-CHANNEL_ID}
  )  # Replace `channel_id` with the ID of the channel you want to update
  await channel.edit(name=f"Members: {members}")


async def update_channel_name(channel, members):
  # Set the initial backoff time to 1 second
  backoff_time = 1
  while True:
    try:
      # Update the channel name
      await channel.edit(name=f"Members: {members}")
      # Reset the backoff time
      backoff_time = 1
      break
    except discord.HTTPException as e:
      if e.status == 429:  # Rate limit error
        # Increase the backoff time
        backoff_time *= 2
        # Wait for the backoff time before retrying
        time.sleep(backoff_time)
      else:
        raise e


message_count = 0


@bot.listen()
async def on_message(message):
  global counting_channel
  if message.author.bot:
    return
  if counting_channel == message.channel:
    return
  global message_count
  message_count += 1
  if message_count == 200:
    msg1 = [
      "You are not Gay", "You are a Pedophile", "You are a Memer",
      "You are Normie", "You are a Son of a bitch", "You are Nuts",
      "You have a small Dick", "You have a big Cock", "You wear skirt",
      "You are Stoner!", "You think you gonna fail in the Exam",
      "You are dumb", "You are handsome!", "You are loner", "You need a cock",
      "You are Ugly", "You need a girl", "You are lame!",
      "You wear panties secretly", "You sniff panties", "nothing", "You smoke",
      "You drink", "You are over 15", "You use reddit", "You are bi..!",
      "You know Andrew Tate", "Your ass is big enough to fit my cock!",
      "You are toxic!",  "You are joker!", "You do Komedy", "You are a loyal friend",
      "You find any girl attractive in this server"
    ]
    messg = await message.channel.send(f"Vote 🟩 If {random.choice(msg1)}")
    await messg.add_reaction("🟥")
    await messg.add_reaction("🟩")
  elif message_count == 500:
    msg2 = [
      "You are Cool. APPROVED✅", "Hey! Long time no see huh!", "You looser👎",
      "I kinda hate Dank Memer", "Shut up! I am sleeping🤬",
      "You surely have a small penis", "I have a crush on you! 💍",
      "Is this a joke, Should I laugh!", "Phuck u!",
      "Listen! I am the alpha, omega, sigma.", "Whoa! are you pedophile",
      "Aye! Whats (a + b)^2", "How's your day?", "Pervert!"
      "You know what you can use `>meme` command to see some memes...",
      "Hey you avatar is looking so noice! check it by using `>avatar`",
      "Do you feel like slapping someone? Use `>slap @user` and DONE!",
      "Hey mods! Can I kick this guy...", "Server is Active👍",
      "Good to see you all!", "Lmao!", "Did you know you were adopted!",
      "Feeling like playing a tictactoe? use `>tictactoe`",
      "Do you know that you can use `>joke` to get some cool jokes",
      "Incase you feel low use `>quote` to get some motivation",
      "You are my friend fr..", "How many Philes are there ?",
      "I love you guys!", "Death causes cancer",
      "Hey check out all the new commands added to the bot by typing `>help`"
    ]
    await message.reply(f"{random.choice(msg2)}")
    message_count = 0


counting_channel = None  # channel where the counting game is taking place
counting_active = False  # flag to check if counting game is active or not
current_count = 1  # current number to be counted
scores = {}  # dictionary to store scores of each player
last_user = None
embed = None


@bot.command()
async def countingstart(ctx):
  global counting_channel, counting_active
  if counting_active == True:
    embed = discord.Embed(
      description=
      f"A game is already in progress in {counting_channel.mention}!!",
      color=discord.Color.darker_grey())
    await ctx.reply(embed=embed)
  else:
    counting_channel = ctx.channel
    counting_active = True
    embed = discord.Embed(
      description=f"Counting game started in {counting_channel.mention}!",
      color=discord.Color.orange())
    await ctx.send(embed=embed)


@bot.command()
async def countingstop(ctx):
  global counting_active, embed
  if counting_active == False:
    embed1 = discord.Embed(
      description="No game to end, Use `>countingstart` to start a game!",
      color=discord.Color.dark_purple())
    await ctx.send(embed=embed1)
  else:
    counting_active = False
    embed = discord.Embed(
      description=f"**Game Ended!**\n{ctx.author.mention} stopped the game!",
      color=discord.Color.blurple())
    await counting_end()


@bot.listen()
async def on_message(message):
  global last_user
  if not counting_active:
    return
  if message.author == bot.user:
    return
  if message.channel != counting_channel:
    return
  try:
    number = int(message.content)
  except ValueError:
    return
  global current_count, scores, embed
  if last_user == message.author:
    await message.add_reaction("❌")
    embed = discord.Embed(
      description=
      f"**Game Ended!**\n{message.author.mention} ruined the game!\n*Cannot count two numbers in a row!*",
      color=discord.Color.brand_red())
    await counting_end()
    return
  if number == current_count:
    scores[message.author.id] = scores.get(message.author.id, 0) + 1
    await message.add_reaction('☑️')
    current_count += 1
    last_user = message.author
  else:
    await message.add_reaction("❌")
    embed = discord.Embed(
      description=
      f"**Game Ended!**\n{message.author.mention} ruined the game!\n*Wrong number!*",
      color=discord.Color.brand_red())
    await counting_end()


async def counting_end():
  global counting_channel, counting_active, current_count, scores, embed, last_user
  counting_active = False
  values = ""
  for player, score in scores.items():
    player_obj = bot.get_user(player)
    values += f"{player_obj.mention}: `{score}`\n"
  embed.add_field(name="Score", value=values, inline=False)
  await counting_channel.send(embed=embed)
  scores = {}
  current_count = 1
  last_user = None
  counting_channel = None


@bot.listen()
async def on_ready():
  conn = sqlite3.connect("birthdays.db")
  c = conn.cursor()
  c.execute(
    '''CREATE TABLE IF NOT EXISTS birthdays (user_id TEXT, birthday TEXT, age INTEGER)'''
  )
  conn.commit()
  conn.close()
  bot.loop.create_task(timer_bd())

'''This command is for setting your own birthday in the server
which will get saved in the bot's database....'''
@bot.command()
async def setbday(ctx, *, bday: str, user: discord.Member = None):
  if user is None:
    user = ctx.author
  elif user.bot:
    await ctx.send(
      f"{user.mention} is a bot user, you cannot set their birthday.")
  try:
    bday_dt = datetime.strptime(bday, '%d/%m/%Y')
    age = (datetime.now() - bday_dt).days // 365
  except ValueError:
    await ctx.send('Invalid date format. Please use the format dd/mm/yyyy.')
    return
  bday1 = bday
  bday = bday_dt.strftime('%d/%m')
  conn = sqlite3.connect('birthdays.db')
  c = conn.cursor()
  c.execute(f"SELECT * FROM birthdays WHERE user_id = '{user.id}'")
  if c.fetchone() is None:
    c.execute(f"INSERT INTO birthdays VALUES ('{user.id}', '{bday}', '{age}')")
  else:
    c.execute(
      f"UPDATE birthdays SET birthday = '{bday}', age = '{age}' WHERE user_id = '{user.id}'"
    )
  conn.commit()
  conn.close()
  embed = discord.Embed(
    title=f"🗓️ {user.name}\'s birthday has been set to `{bday1}`.",
    color=0xe07e23)
  await ctx.send(embed=embed)



'''This is a birthday wishing command
this command is not fully developed yet
I am working on it....'''


async def check_birthdays():
  today = datetime.now().strftime("%d/%m")
  conn = sqlite3.connect('birthdays.db')
  c = conn.cursor()
  c.execute("SELECT * FROM birthdays")
  rows = c.fetchall()
  for row in rows:
    user_id, birthday, age = row
    if birthday == today:
      user = bot.get_user(int(user_id))
      embed = discord.Embed(
        title=f"🥳 Happy Birthday {user.name}, you have turned {age} today...",
        description=
        "Happy birthday! I hope your special day is filled with joy, laughter, and love. May all your dreams and wishes come true, and may you be surrounded by the people you care about most. I hope this year brings you happiness, success, and many blessings. Enjoy your birthday and have a great time celebrating!",
        color=0x6aa030
      ).set_thumbnail(
        url=
        "https://cdna.artstation.com/p/assets/images/images/033/167/860/original/marieke-de-roy-happy-birthday.gif?1608636168"
      ).set_footer(text="🎂🎂")
      await user.send(embed=embed)
      await asyncio.sleep(5)
      channel = bot.get_channel(889472846252900373)
      embed2 = discord.Embed(
        title=f"Its {user.name}\'s Birthday 🥳",
        description=f"**{user.name} just turned {age} today**",
        color=0x40b7e6)
      embed2.set_author(name="🎂🎂", icon_url=user.avatar)
      embed2.set_thumbnail(
        url="https://media4.giphy.com/media/ytBuODur5PaUlOHyQ7/giphy.gif")
      msg = await channel.send(content="@everyone", embed=embed2)
      await msg.add_reaction("🎂")
      conn.close()


async def timer_bd():
  while True:
    timezone = pytz.timezone("Asia/Kolkata")
    current_time = datetime.now(timezone).strftime("%H:%M")
    if current_time == "09:00":
      await check_birthdays()
    await asyncio.sleep(60)




'''this is a Gif command when somebody enters this command
and what gif they want the boit will send the specific gif
by fetching it from the GIPHY api... for sending gif you have
to create a account and create a free api and get the api key 
and paste it below.....'''

# Define the gif command
@bot.command()
async def gif(ctx, *, query: str):
  # Use the GIPHY API to search for a gif based on the query
  res = requests.get(
    f"http://api.giphy.com/v1/gifs/search?api_key={YOUR_API_KEY}={query}&limit=1"
  )
  if res.status_code == 200:
    # If the API call was successful, parse the response as JSON
    data = json.loads(res.text)
    # Send the first result as a message in the Discord channel
    response = data['data'][0]['images']['original']['url']
    embed = discord.Embed(title=query, color=discord.Color.blue())
    embed.set_image(url=response)
    embed.set_footer(text="Requested at", icon_url=ctx.author.avatar)
    embed.timestamp = datetime.now()
    await ctx.send(embed=embed)
  else:
    # If the API call was unsuccessful, send an error message
    await ctx.send(
      'An error occurred while searching for a gif. Please try again later.')







'''this command is for a channel in the server which you want to post only pciture
links, and videos and dont want anyone to clutter this channel.... The bot is here to 
help you out by automatically deleteing any messages except any attachments and links
If anyone tries to text in the channel their texts will be deletd and they will get a 
alert message in the channel and as well as in their DM....'''
@bot.listen()
async def on_message(message):
  if message.channel.id == {YOUR_CHANNEL_ID} and message.author != bot.user:
    if message.attachments:
      return
    if message.content.startswith("http"):
      return
    else:
      await message.delete()
      embed = discord.Embed(
        description=
        "Your message has been removed, this channel is dedicated to images, videos. You are not allowed to post anything else.",
        color=discord.Color.dark_red())
      embed.set_author(
        icon_url=message.author.avatar,
        name=f"{message.author.name}#{message.author.discriminator}")
      msg = await message.channel.send(embed=embed)
      embed2 = discord.Embed(
        description=
        f"Your message in the channel {message.channel.mention} has been removed. The channel is dedicated to images, videos. You are not allowed to post anything else.",
        color=discord.Color.dark_red())
      await message.author.send(embed=embed2)
      await asyncio.sleep(10)
      await msg.delete()

'''This command is for auto assigning roles to members when they join the server
If the member is a bot the bot will assign a bot specific role or else it will assign
a normal role to a person when they join the server.......'''
@bot.listen()
async def on_member_join(member):
    await asyncio.sleep(10)
    if member.bot:
        role = discord.utils.get(member.guild.roles, id=ENTER_YOUR_ROLE_ID) #Enter your role id
    else:
        role = discord.utils.get(member.guild.roles, id=ENTER_YOUR_ROLE_ID) #Enter your role id
    await member.add_roles(role)



@bot.command()
async def joke(ctx):
  joke = requests.get("https://official-joke-api.appspot.com/random_joke").json()
  setup = joke["setup"]
  punchline = joke["punchline"]
  msg= await ctx.send(f"```{setup}```")
  await asyncio.sleep(2)
  await msg.edit(content=f"```{setup}\n\n{punchline}```")
  await asyncio.sleep(1)
  await msg.add_reaction("ENTER_YOUR_EMOJI") #Enter your custom server emoji or any other emojis here.... SYNTAX: <:emoji_NAME:Emoji ID>



@bot.command()
async def quote(ctx):
    response = requests.get("https://zenquotes.io/api/random")
    quote = response.json()[0]['q']
    author = response.json()[0]['a']
    embed = discord.Embed(description=f"**{quote}**", color=discord.Color.dark_magenta())
    embed.set_footer(text=author)
    await ctx.send(embed=embed)


@bot.command()
async def wiki(ctx, *, query):
    try:
        # Set the language of the wikipedia to english
        wikipedia.set_lang("en")
        # Search wikipedia for the query and get the summary
        summary = wikipedia.summary(query)
        # Send the summary to the channel
        await ctx.send(f"```{summary}```")
    except wikipedia.exceptions.DisambiguationError as e:
        # If there is a disambiguation error, send a message to the channel
        await ctx.send(f"```Multiple results found. Please be more specific.\n{e.options}```")
    except wikipedia.exceptions.PageError:
        # If there is a page error, send a message to the channel
        await ctx.send("No results found.")


emails =["Anderson", "Ashwoon", "Aikin", "Bateman", "bongard", "randi123", "beckingham"]
passwords = ["rock", "fatman", "hitler, terimaakichut"]
quotes = ["Did she actually say this in seriousness?", "ILU", "I actually like her!"]
randword = ["rainbow", "heart", "mask", "kink"]
ip = ["192.168.0.102", "127.0.0.1", "186.0.1.104"]


@bot.command()
async def hack(ctx, *, member: discord.Member = None):
  if member == None:
    await ctx.send("Mention somebody to hack... DUMB")
    return
  if member == ctx.author:
    await ctx.send("Wait... are you actually trying to hack yourself....")
    return
  if member == bot.user:
    member = ctx.author
    await ctx.send("Listen son! Cheap tricks doesn't work!....")
  message = await ctx.send(f"Hacking {member.name} now...")
  await asyncio.sleep(2)
  await message.edit(content=f"```js\nFinding discord login...(2FA bypassed)\n\nProcessing: [==                          ]```")
  await asyncio.sleep(2)
  await message.edit(content=f"```js\nFound:\nEmail: {member.name}{random.choice(emails)}@gmail.com\nPassword: {random.choice(passwords)}\n\nProcessing: [====                        ]```")
  await asyncio.sleep(2)
  await message.edit(content=f"```js\nFetching dms with closest friends (if you got any init)\n\nProcessing: [======                      ]```")
  await asyncio.sleep(2)
  await message.edit(content=f"```js\nLast DM: {random.choice(quotes)}\n\nProcessing: [========                    ]```")
  await asyncio.sleep(2)
  await message.edit(content=f"```js\nFinding most common word...\n\nProcessing: [==========                ]```")
  await asyncio.sleep(2)
  await message.edit(content=f"```js\nMost common = {random.choice(randword)}\n\nProcessing: [============                ]```")
  await asyncio.sleep(2)
  await message.edit(content=f"```js\nInjecting the big boy virus into the discriminator #{member.discriminator}\n\nProcessing: [==============              ]```")
  await asyncio.sleep(2)
  await message.edit(content=f"```js\nVirus injected nitro stolen..\n\nProcessing: [================            ]```")
  await asyncio.sleep(2)
  await message.edit(content=f"```js\nSetting up the nintendo account..\n\nProcessing: [==================          ]```")
  await asyncio.sleep(2)
  await message.edit(content=f"```js\nHacking nintendo account...\n\nProcessing: [====================        ]```")
  await asyncio.sleep(2)
  await message.edit(content=f"```js\nFinding IP address\n\nProcessing: [======================      ]```")
  await asyncio.sleep(2)
  await message.edit(content=f"```js\nIP address: {random.choice(ip)}\n\nProcessing: [========================    ]```")
  await asyncio.sleep(2)
  await message.edit(content=f"```js\nStealing data from the Scary Government...\n\nProcessing: [==========================  ]```")
  await asyncio.sleep(2)
  await message.edit(content=f"```js\nReporting account to discord for breaking TOS...\n\nProcessing: [============================]```")
  await asyncio.sleep(2)
  await message.edit(content=f"```js\nHacking your google history\n\nProcessing: [==============================]```")
  await asyncio.sleep(2)
  await message.edit(content=f"```js\nFinished hacking {member.name}\nThe scary and dangerous hack is successful\n\nProcessing: [COMPLETED!!]```")


@bot.command()
async def kick(ctx, member: discord.Member = None):
  if member == None:
    msg = await ctx.send("```Mention a user!!\neg: >kick [@user]```")
    await asyncio.sleep(5)
    await msg.delete()
    return
  gif = ["https://media.tenor.com/IlaJyD0XEMwAAAAd/index-anime.gif",
         "https://media.tenor.com/Lyqfq7_vJnsAAAAd/kick-funny.gif",
         "https://media.tenor.com/icV2ba3gU7MAAAAd/kick-anime.gif",
         "https://media.tenor.com/LrHHh0amD7gAAAAd/ada-ninjaz-kick.gif",
         "https://media.tenor.com/4zwRLrLMGm8AAAAd/chifuyu-chifuyu-kick.gif,",
         "https://media.tenor.com/lxd8SO_uRIYAAAAd/anime-kick.gif",
         "https://media.tenor.com/Qbt44it3rasAAAAd/taiga-aisaka-starling-bg-waifu.gif",
         "https://media.tenor.com/EUif99vl0n4AAAAd/anime-tokyo-revengers.gif",
         "https://media.tenor.com/7jHz_zT5WNIAAAAd/haikyuu-kick.gif",
         "https://media.tenor.com/BdoM4LQLiSkAAAAd/mitsume-ga-toru-sharaku.gif",
         "https://media.tenor.com/4F6aGlGwyrwAAAAd/sdf-avatar.gif",
         "https://media.tenor.com/Ny18a0PmzS0AAAAd/kick-anime.gif",
         "https://media.tenor.com/eVXsVH-2Sb4AAAAd/kick.gif",
         "https://media.tenor.com/9E2ja0Lb6VQAAAAd/shenmue-shenmue-anime.gif",
         "https://media.tenor.com/fGSyYSbD0-4AAAAd/mikey-mickey.gif",
         "https://media.tenor.com/u_v-f2md4E8AAAAd/kick-anime.gif",
         "https://media.tenor.com/2wmVyLuDzVAAAAAd/bnc.gif",
         "https://media.tenor.com/Nb2kzrvGqXUAAAAd/kengan-ashura-ohma-tokita.gif",
         "https://media.tenor.com/pE7EFzZ8azIAAAAd/epic-anime.gif",
         "https://media.tenor.com/PqTmhDmL_QsAAAAd/lycoris-recoil-kick.gif",
         "https://media.tenor.com/Z2J0XHsTCJYAAAAd/kuroko-kick-ass.gif",
         "https://media.tenor.com/BZ1JVakDjycAAAAd/kirima-nagi-kick.gif",
         "https://media.tenor.com/CNIeMo7XlAwAAAAd/anime-angel-beats.gif",
         "https://media.tenor.com/u0jz2yiKBDUAAAAd/mirko-miruko.gif",
         "https://media.tenor.com/WAPls5eZg-oAAAAd/attack-on-titan-shingeki-no-kyojin.gif",
         "https://media.tenor.com/IGinxizmV5cAAAAd/luta.gif",
         "https://media.tenor.com/xPU9VuvgcB0AAAAd/gajeel-lucy.gif",
         "https://media.tenor.com/ZElYwhbPYvAAAAAd/one-punch-man-suiryu.gif",
         "https://media.tenor.com/iadpsOYne74AAAAd/fire-force-fight.gif",
         "https://media.tenor.com/D67kRWw_cEEAAAAd/voz-dap-chym-dap-chym.gif",
         "https://media.tenor.com/BtwpZlg90ZkAAAAd/kick-anime.gif"]

  reason = []
  embed = discord.Embed(color=discord.Color.blue())
  embed.set_author(name=f"{ctx.author.name} kicked {member.name}", icon_url=ctx.author.avatar)
  embed.set_image(url=random.choice(gif))
  await ctx.send(embed=embed)



@bot.command()
async def punch(ctx, member: discord.Member = None):
  if member == None:
    msg = await ctx.send("```Mention a user!!\neg: >punch [@user]```")
    await asyncio.sleep(5)
    await msg.delete()
    return
  gif = ["https://media.tenor.com/6a42QlkVsCEAAAAd/anime-punch.gif",
         "https://media.tenor.com/YQ08ifsOb0EAAAAd/anime-angry.gif",
         "https://media.tenor.com/p_mMicg1pgUAAAAd/anya-forger-damian-spy-x-family.gif",
         "https://media.tenor.com/qDDsivB4UEkAAAAd/anime-fight.gif",
         "https://media.tenor.com/GR_ia5xLWkkAAAAd/koiseka-anime-punch.gif",
         "https://media.tenor.com/wYyB8BBA8fIAAAAd/some-guy-getting-punch-anime-punching-some-guy-anime.gif",
         "https://media.tenor.com/s0bU-NO1QIQAAAAd/anime-punch.gif",
         "https://media.tenor.com/-wfr09tbkwcAAAAd/discord-anime.gif",
         "https://media.tenor.com/FKP8EFeGFzEAAAAd/no-chiochannotsuugakuro.gif",
         "https://media.tenor.com/SwMgGqBirvcAAAAd/saki-saki-kanojo-mo-kanojo.gif",
         "https://media.tenor.com/pWXJ5NlI-g0AAAAd/one-punch-man-anime.gif",
         "https://media.tenor.com/2VSFzXr7oTgAAAAd/kofune-ushio.gif",
         "https://media.tenor.com/l_zcD2qX5M4AAAAd/double-punch-anime-double-punch.gif"
         "https://media.tenor.com/jVeoj7B-OxEAAAAd/punch-anime.gif",
         "https://media.tenor.com/mGAb7-9NdGUAAAAd/anime-bleach.gif",
         "https://media.tenor.com/43o6k3xh8XEAAAAd/ueno-san.gif",
         "https://media.tenor.com/HCde75pCLAcAAAAd/tokyo-revengers-smiley.gif"
         "https://media.tenor.com/DiklRsNqBS4AAAAd/angry-anime.gif",
         "https://media.tenor.com/1RBnlYXh04QAAAAd/anime-anime-grisl.gif",
         "https://media.tenor.com/UTQAtasSxmUAAAAd/barakamon-punch.gif",
         "https://media.tenor.com/3TvlgppifSMAAAAd/anime-girls.gif",
         "https://media.tenor.com/xWqmJMePsqEAAAAd/weaboo-otaku.gif",
         "https://media.tenor.com/pJV_kxsf-XEAAAAd/anime-face-punch.gif",
         "https://media.tenor.com/-643yjNTOB4AAAAd/cowboy-bebop-faye-valentine.gif",
         "https://media.tenor.com/JfTmqjERkSkAAAAd/anime-punch.gif",
         "https://media.tenor.com/CQSc4y_C-9gAAAAd/the-god-of-high-school-anime.gif",
         "https://media.tenor.com/kFL3iEag_60AAAAd/azumanga-daioh-azumanga.gif",
         "https://media.tenor.com/m1CiE8xvqTEAAAAd/beat-up.gif",
         "https://media.tenor.com/8TnT2yWwNWgAAAAd/punch-meliodas.gif",
         "https://media.tenor.com/dLaisLGeL1cAAAAd/shy-punch.gif",
         "https://media.tenor.com/1I0Om7HbUscAAAAd/baki-anime.gif"]

  reason = []
  embed = discord.Embed(color=discord.Color.blue())
  embed.set_author(name=f"{ctx.author.name} punched {member.name}", icon_url=ctx.author.avatar)
  embed.set_image(url=random.choice(gif))
  await ctx.send(embed=embed)




@bot.command()
async def hug(ctx, member: discord.Member = None):
  if member == None:
    msg = await ctx.send("```Mention a user!!\neg: >hug [@user]```")
    await asyncio.sleep(5)
    await msg.delete()
    return
  gif = ["https://media.tenor.com/kCZjTqCKiggAAAAd/hug.gif",
         "https://media.tenor.com/uCYf6ApjTOoAAAAd/hug-animated.gif",
         "https://media.tenor.com/HYkaTQBybO4AAAAd/hug-anime.gif",
         "https://media.tenor.com/J7eGDvGeP9IAAAAd/enage-kiss-anime-hug.gif",
         "https://media.tenor.com/RWD2XL_CxdcAAAAd/hug.gif",
         "https://media.tenor.com/wUQH5CF2DJ4AAAAd/horimiya-hug-anime.gif",
         "https://media.tenor.com/iyztKN68avcAAAAd/aharen-san-aharen-san-anime.gif",
         "https://media.tenor.com/7oCaSR-q1kkAAAAd/alice-vt.gif",
         "https://media.tenor.com/H7i6GIP-YBwAAAAd/a-whisker-away-hug.gif",
         "https://media.tenor.com/ddoVrTIX7tIAAAAd/hug.gif",
         "https://media.tenor.com/5Ob_5GPPdhwAAAAd/hug.gif",
         "https://media.tenor.com/-3I0yCd6L6AAAAAd/anime-hug-anime.gif",
         "https://media.tenor.com/cGFtCNuJE6sAAAAd/anime-aesthetic.gif",
         "https://media.tenor.com/3mr1aHrTXSsAAAAd/hug-anime.gif",
         "https://media.tenor.com/sFmoCYbNycwAAAAd/hug-anime.gif",
         "https://media.tenor.com/YuwEoQvncPgAAAAd/hug.gif",
         "https://media.tenor.com/P9QCcdH__n4AAAAd/anime.gif",
         "https://media.tenor.com/m_bbfF_KS-UAAAAd/engage-kiss-anime-hug.gif",
         "https://media.tenor.com/XptUhNOfUXUAAAAd/anime-anime-couple.gif",
         "https://media.tenor.com/FQJ8uxqQoIkAAAAd/val-ally-hug.gif",
         "https://media.tenor.com/ovNCUj6S8ycAAAAd/aharen-san-anime-hug.gif",
         "https://media.tenor.com/VAs1xJlpINIAAAAd/tenki-no-ko-hug.gif",
         "https://media.tenor.com/TtAcSUIxopgAAAAd/hug.gif",
         "https://media.tenor.com/bLttPccI_I4AAAAd/cuddle-anime.gif",
         "https://media.tenor.com/q9Mk711vGI0AAAAd/hug.gif",
         "https://media.tenor.com/jSr41Jz0CQYAAAAd/anime-hug-anime-girls.gif",
         "https://media.tenor.com/Fld0jbqWpDsAAAAd/gochuumon-wa-usagi-desuka-is-the-order-a-rabbit.gif",
         "https://media.tenor.com/PzIA_wdL3zgAAAAd/wlw-hug.gif",
         "https://media.tenor.com/GoU0SzuKHVgAAAAd/danmachi-anime-hug.gif",
         "https://media.tenor.com/gqM9rl1GKu8AAAAd/kitsune-upload-hug.gif",
         "https://media.tenor.com/gOcOLipgnkoAAAAd/hug-hugs.gif",
         "https://media.tenor.com/Pc0J3qy-MMIAAAAd/anime-hug.gif",
         "https://media.tenor.com/40zFxot4NCUAAAAd/kitsune-upload-anime.gif",
         "https://media.tenor.com/-WH2yihelbMAAAAd/kitsune-upload-anime.gif",
         "https://media.tenor.com/5V9Fo_AoXKoAAAAd/anime-hug-micchon-shikimori.gif",
         "https://media.tenor.com/j2uTo-vfZdsAAAAd/princess-connect-yuuki-pc.gif",
         "https://media.tenor.com/i5NMDbbpwckAAAAd/hug-umibe-no-etranger.gif",
         "https://media.tenor.com/XKJwFX9B_DUAAAAd/hug.gif",
         "https://media.tenor.com/dKxCiL6iEl4AAAAd/anime-couple-hug.gif",
         "https://media.tenor.com/0ktXWL1PH9sAAAAd/idolish7-i7.gif",
         "https://media.tenor.com/KAugZZt_NTwAAAAd/rikka-chuunibyou.gif",
         "https://media.tenor.com/UEDSig1KR2wAAAAd/kiss-anime.gif"]

  reason = []
  embed = discord.Embed(color=discord.Color.blue())
  embed.set_author(name=f"{ctx.author.name} hugged {member.name}", icon_url=ctx.author.avatar)
  embed.set_image(url=random.choice(gif))
  await ctx.send(embed=embed)




@bot.command()
async def lick(ctx, member: discord.Member = None):
  if member == None:
    msg = await ctx.send("```Mention a user!!\neg: >lick [@user]```")
    await asyncio.sleep(5)
    await msg.delete()
    return
  gif = ["https://media.tenor.com/Jel-MDAH0ucAAAAd/anime-zero-two.gif",
         "https://media.tenor.com/30jarFTFk5kAAAAd/anime-girl.gif",
         "https://media.tenor.com/Pb1JPfqXpAIAAAAd/lick-licky.gif",
         "https://media.tenor.com/VMX-34hNSaUAAAAd/lick.gif",
         "https://media.tenor.com/t6cxb_yox3QAAAAd/lick-ear.gif",
         "https://media.tenor.com/286PoD-NAiIAAAAd/anime-hajimete-no-gal.gif",
         "https://media.tenor.com/Xb1u2Z6nLRQAAAAd/lick-anime.gif",
         "https://media.tenor.com/Go7wnhOWjSkAAAAd/anime-lick-face.gif",
         "https://media.tenor.com/S5I9g4dPRn4AAAAd/omamori-himari-manga.gif",
         "https://media.tenor.com/rK5iY4CspSgAAAAd/lick.gif",
         "https://media.tenor.com/bggH5fB9mm4AAAAd/lick.gif",
         "https://media.tenor.com/g1HYBQGPEVYAAAAd/anime-lick.gif",
         "https://media.tenor.com/o5YDW53RaQkAAAAd/kurumi-anime.gif",
         "https://media.tenor.com/3a1ZGKCcmN0AAAAd/zatch-bell-lick.gif",
         "https://media.tenor.com/eYR7T8Lt1FYAAAAd/kaze-no-stigma-lick.gif",
         "https://media.tenor.com/nvv0tN9ZzegAAAAd/eye-manako.gif",
         "https://media.tenor.com/v4UGxvqSvQoAAAAd/gakkou-anime.gif",
         "https://media.tenor.com/A3zhcj9Det4AAAAd/nekohime-lick.gif",
         "https://media.tenor.com/xtajFaS35E0AAAAd/animes-anime.gif",
         "https://media.tenor.com/Ej2_h99PKWoAAAAd/lick.gif",
         "https://media.tenor.com/n_Jvvl7Ol54AAAAd/lick-jojo.gif",
         "https://media.tenor.com/-jl-FNtEIS8AAAAd/anime-lick.gif",
         "https://media.tenor.com/fkSCDbBeE_gAAAAd/cuello-vampire.gif",
         "https://media.tenor.com/d6cXexCTJ4IAAAAd/sono-hanabira-ni-kuchikuze-wo-anime.gif",
         "https://media.tenor.com/vOGtoN6xX78AAAAd/date-a-live-iv-tongue.gif",
         "https://media.tenor.com/OnyaqADtoLsAAAAd/jilat-ear.gif",
         "https://media.tenor.com/Q-RjY3zuBcsAAAAd/anime-kiss.gif",
         "https://media.tenor.com/AHHcFRVLx4EAAAAd/user-hwan.gif"]

  reason = []
  embed = discord.Embed(color=discord.Color.blue())
  embed.set_author(name=f"{ctx.author.name} licked {member.name}", icon_url=ctx.author.avatar)
  embed.set_image(url=random.choice(gif))
  await ctx.send(embed=embed)



@bot.command()
async def kiss(ctx, member: discord.Member = None):
  if member == None:
    msg = await ctx.send("```Mention a user!!\neg: >kiss [@user]```")
    await asyncio.sleep(5)
    await msg.delete()
    return
  gif = ["https://media.tenor.com/jnndDmOm5wMAAAAd/kiss.gif",
         "https://media.tenor.com/fiafXWajQFoAAAAd/kiss-anime.gif",
         "https://media.tenor.com/KlpH_uI8fH4AAAAd/anime-kiss.gif",
         "https://media.tenor.com/OjcDtiEDUvMAAAAd/friendly-kiss.gif",
         "https://media.tenor.com/dn_KuOESmUYAAAAd/engage-kiss-anime-kiss.gif",
         "https://media.tenor.com/Ogthkl9rYBMAAAAd/ichigo-hiro.gif",
         "https://media.tenor.com/Knn50NQGQ3gAAAAd/kiss.gif",
         "https://media.tenor.com/EP_-3YtRtBMAAAAd/yui-komori-subaru-sakamaki.gif",
         "https://media.tenor.com/3xrkm45MqkIAAAAd/anime-kiss.gif",
         "https://media.tenor.com/06lz817csVgAAAAd/anime-anime-kiss.gif",
         "https://media.tenor.com/KRCWgDqlfjkAAAAd/kiss-anime.gif",
         "https://media.tenor.com/9jB6M6aoW0AAAAAd/val-ally-kiss.gif",
         "https://media.tenor.com/cbIOD1pMlEQAAAAd/mst.gif",
         "https://media.tenor.com/SuwKlp8g2xQAAAAd/forehead-worried.gif",
         "https://media.tenor.com/8JdJyDd1higAAAAd/kiss-cheek.gif",
         "https://media.tenor.com/6kNSYyne7b8AAAAd/zorome-hiro.gif",
         "https://media.tenor.com/8ln6Z1e-FVYAAAAd/nagumi-koushi-hozumi-serene.gif",
         "https://media.tenor.com/QhHQ-qyFGe0AAAAd/kiss-anime.gif",
         "https://media.tenor.com/3wE3JNW0fswAAAAd/anime-kiss-love.gif",
         "https://media.tenor.com/SYwRyd6N1UIAAAAd/anime-kiss.gif",
         "https://media.tenor.com/dng5wrAkNloAAAAd/anime.gif",
         "https://media.tenor.com/e11GZan2cUQAAAAd/anime-sleep.gif",
         "https://media.tenor.com/2HVJc6Z9wYIAAAAd/val-ally-anime.gif",
         "https://media.tenor.com/Ko1AOLzUmyEAAAAd/kiss-anime.gif",
         "https://media.tenor.com/QbYxVBr1p5MAAAAd/rikekoi-anime-love-kiss.gif",
         "https://media.tenor.com/bhG9NSfd9TIAAAAd/animekiss-kiss.gif",
         "https://media.tenor.com/Qaysgk3QifsAAAAd/classic-ef-yuri.gif",
         "https://media.tenor.com/Senvg_X8dYcAAAAd/kiss-anime.gif",
         "https://media.tenor.com/ncZ-U5CQbxcAAAAd/kissxsis-kiss.gif",
         "https://media.tenor.com/QQnlCFl0UTwAAAAd/maken-ki-kiss-cheek.gif",
         "https://media.tenor.com/jp4N0K_sdiYAAAAd/yamada-kun-to7nin-no-majo-anime.gif",
         "https://media.tenor.com/oycVsygfaF8AAAAd/headkiss-anime-anime.gif",
         "https://media.tenor.com/2NyAis05-twAAAAd/anime-kiss-kiss.gif",
         "https://media.tenor.com/vOjYlpPHIygAAAAd/anime-anime-kiss-gif.gif",
         "https://media.tenor.com/sHAz5XMtP0kAAAAd/anime-kiss.gif",
         "https://media.tenor.com/o1aNZa1LSM8AAAAd/anime-kiss.gif",
         "https://media.tenor.com/hayBS0l13xcAAAAd/anime-kiss.gif",
         "https://media.tenor.com/-I3Rhg9mmb0AAAAd/anime-kiss.gif",
         "https://media.tenor.com/LUqUEGinUNUAAAAd/kiss.gif",
         "https://media.tenor.com/ivnnNqJ5_HwAAAAd/kiss-sweet.gif",
         "https://media.tenor.com/3DHc1_2PZ-oAAAAd/kiss.gif",
         "https://media.tenor.com/S7pNDfLO5W8AAAAd/anime-kiss-on-neck-anime-cute.gif",
         "https://media.tenor.com/WgjfF3PIjoAAAAAd/fate-shocked.gif",
         "https://media.tenor.com/Si3B7QuF7WYAAAAd/microsoft-solitaire.gif",
         "https://media.tenor.com/-ScgZrF7Y0wAAAAd/yuri-kiss.gif",
         "https://media.tenor.com/ZIT8NI2lSlYAAAAd/hop-on-pso2-pso2ngs.gif",
         "https://media.tenor.com/78GScl335DwAAAAd/rias-gremory.gif"]

  reason = []
  embed = discord.Embed(color=discord.Color.blue())
  embed.set_author(name=f"{ctx.author.name} kissed {member.name}", icon_url=ctx.author.avatar)
  embed.set_image(url=random.choice(gif))
  await ctx.send(embed=embed)



@bot.command()
async def bite(ctx, member: discord.Member = None):
  if member == None:
    msg = await ctx.send("```Mention a user!!\neg: >bite [@user]```")
    await asyncio.sleep(5)
    await msg.delete()
    return
  gif = ["https://media.tenor.com/6HhJw-4zmQUAAAAd/anime-bite.gif",
         "https://media.tenor.com/5mVQ3ffWUTgAAAAd/anime-bite.gif",
         "https://media.tenor.com/ECCpi63jZlUAAAAd/anime-bite.gif",
         "https://media.tenor.com/0neaBmDilHsAAAAd/anime-bite.gif",
         "https://media.tenor.com/1LtA9dSoAIQAAAAd/zero-no-tsukaima-bite.gif",
         "https://media.tenor.com/_AkeqheWU-4AAAAd/anime-bite.gif",
         "https://media.tenor.com/BwdIq2Nuu_wAAAAd/love-amagami.gif",
         "https://media.tenor.com/mXc2f5NeOpgAAAAd/no-blood-neck-bite.gif",
         "https://media.tenor.com/n__KGrZPlQEAAAAd/bite.gif",
         "https://media.tenor.com/ZcRsB_nb9cIAAAAd/bite.gif",
         "https://media.tenor.com/y91DzE22_V4AAAAd/anime-bite.gif",
         "https://media.tenor.com/5FOgNEcoaYMAAAAd/neck-kisses.gif",
         "https://media.tenor.com/jQ1anSa1FekAAAAd/bite-me.gif",
         "https://media.tenor.com/372dnKlcjBQAAAAd/anime-bite.gif",
         "https://media.tenor.com/hwCVSWyji0QAAAAd/anime-bite.gif",
         "https://media.tenor.com/MGuHaYdPUJ4AAAAd/my-hero-academia-anime.gif",
         "https://media.tenor.com/KP9bTT9og9YAAAAd/bite-anime.gif",
         "https://media.tenor.com/H2bi31hpZnYAAAAd/re-zero-rem.gif",
         "https://media.tenor.com/7Mc_NjKVf1EAAAAd/vampire-anime.gif",
         "https://media.tenor.com/udsFVWyKbOgAAAAd/bite-anime.gif",
         "https://media.tenor.com/_smhsCVsH4AAAAAd/no-blood-neck-bite.gif",
         "https://media.tenor.com/iIAvibfzzFYAAAAd/demichan-wa-kataritai-nom-nom.gif",
         "https://media.tenor.com/PKKQgm3GP8UAAAAd/vanitas-jeanne-the-hellfire-witch.gif",
         "https://media.tenor.com/ab2O4qmrpGgAAAAd/index-touma.gif",
         "https://media.tenor.com/greMiXEBwRMAAAAd/love-kiss.gif",
         "https://media.tenor.com/xAiGlpwEVhEAAAAd/josee-josee-to-tora-to-sakanatachi.gif"]

  reason = []
  embed = discord.Embed(color=discord.Color.blue())
  embed.set_author(name=f"{ctx.author.name} bites {member.name}", icon_url=ctx.author.avatar)
  embed.set_image(url=random.choice(gif))
  await ctx.send(embed=embed)



@bot.command()
async def cuddle(ctx, member: discord.Member = None):
  if member == None:
    msg = await ctx.send("```Mention a user!!\neg: >cuddle [@user]```")
    await asyncio.sleep(5)
    await msg.delete()
    return
  gif = ["https://media.tenor.com/bLttPccI_I4AAAAd/cuddle-anime.gif",
         "https://media.tenor.com/08vDStcjoGAAAAAd/cuddle-anime-hug-anime.gif",
         "https://media.tenor.com/Q83w83J1VzUAAAAd/hug-love.gif",
         "https://media.tenor.com/vH1LBxedJ9wAAAAd/hug-anime.gif",
         "https://media.tenor.com/x2785kFjcDkAAAAd/hug-anime.gif",
         "https://media.tenor.com/ABT86RpJUMUAAAAd/love-asuna.gif",
         "https://media.tenor.com/nxjuBYA2thMAAAAd/love-animecute.gif",
         "https://media.tenor.com/kCZjTqCKiggAAAAd/hug.gif",
         "https://media.tenor.com/sK9icjg3xm4AAAAd/strugglesnuggle-annoyed.gif",
         "https://media.tenor.com/u4sdnXy0WY4AAAAd/pat.gif",
         "https://media.tenor.com/oSPZDjEf9vQAAAAd/anime-hug-anime-hugging.gif",
         "https://media.tenor.com/sBFE3GeNpJ4AAAAd/tackle-hug-couple.gif",
         "https://media.tenor.com/G9yuomdknAsAAAAd/anime-couple.gif",
         "https://media.tenor.com/KoS-POKwhQYAAAAd/yuri-hug.gif",
         "https://media.tenor.com/Pd2sMiVr09YAAAAd/hug-anime-hug.gif",
         "https://media.tenor.com/rosigG51p0MAAAAd/anime-couple-anime-bed.gif",
         "https://media.tenor.com/ch1kq7TOxlkAAAAd/anime-cuddle.gif",
         "https://media.tenor.com/wwd7R-pi7DIAAAAd/anime-cuddle.gif",
         "https://media.tenor.com/S3KQ1sDod7gAAAAd/anime-hug-love.gif",
         "https://media.tenor.com/YzPKUuj2psQAAAAd/hair-soft.gif",
         "https://media.tenor.com/2VVGNLi-EV4AAAAd/anime-cute.gif",
         "https://media.tenor.com/oQ4TmuljOSsAAAAd/clannad-anime-hug.gif",
         "https://media.tenor.com/8o4fWGwBY1EAAAAd/aharensan-aharen.gif",
         "https://media.tenor.com/pERmpp-SSJ4AAAAd/eli-cuddle-anime.gif",
         "https://media.tenor.com/X9z9glsxRwoAAAAd/anime-cuddle.gif",
         "https://media.tenor.com/hVGrJp0GhLkAAAAd/hugging-anime.gif",
         "https://media.tenor.com/DlW1R4d1NQAAAAAd/anime-cuddle.gif",
         "https://media.tenor.com/ZKto94-A6l8AAAAd/anime-hug.gif",
         "https://media.tenor.com/aXQIC-mWPL0AAAAd/hug-anime.gif",
         "https://media.tenor.com/EgIwzKyLYscAAAAd/madoka-magica-akemi-homura.gif"]

  reason = []
  embed = discord.Embed(color=discord.Color.blue())
  embed.set_author(name=f"{ctx.author.name} cuddles {member.name}", icon_url=ctx.author.avatar)
  embed.set_image(url=random.choice(gif))
  await ctx.send(embed=embed)



@bot.command()
async def nom(ctx, member: discord.Member = None):
  if member == None:
    msg = await ctx.send("```Mention a user!!\neg: >nom [@user]```")
    await asyncio.sleep(5)
    await msg.delete()
    return
  gif = ["https://media.tenor.com/6HhJw-4zmQUAAAAd/anime-bite.gif",
         "https://media.tenor.com/5mVQ3ffWUTgAAAAd/anime-bite.gif",
         "https://media.tenor.com/ECCpi63jZlUAAAAd/anime-bite.gif",
         "https://media.tenor.com/0neaBmDilHsAAAAd/anime-bite.gif",
         "https://media.tenor.com/1LtA9dSoAIQAAAAd/zero-no-tsukaima-bite.gif",
         "https://media.tenor.com/_AkeqheWU-4AAAAd/anime-bite.gif",
         "https://media.tenor.com/BwdIq2Nuu_wAAAAd/love-amagami.gif",
         "https://media.tenor.com/mXc2f5NeOpgAAAAd/no-blood-neck-bite.gif",
         "https://media.tenor.com/n__KGrZPlQEAAAAd/bite.gif",
         "https://media.tenor.com/ZcRsB_nb9cIAAAAd/bite.gif",
         "https://media.tenor.com/y91DzE22_V4AAAAd/anime-bite.gif",
         "https://media.tenor.com/5FOgNEcoaYMAAAAd/neck-kisses.gif",
         "https://media.tenor.com/jQ1anSa1FekAAAAd/bite-me.gif",
         "https://media.tenor.com/372dnKlcjBQAAAAd/anime-bite.gif",
         "https://media.tenor.com/hwCVSWyji0QAAAAd/anime-bite.gif",
         "https://media.tenor.com/MGuHaYdPUJ4AAAAd/my-hero-academia-anime.gif",
         "https://media.tenor.com/KP9bTT9og9YAAAAd/bite-anime.gif",
         "https://media.tenor.com/H2bi31hpZnYAAAAd/re-zero-rem.gif",
         "https://media.tenor.com/7Mc_NjKVf1EAAAAd/vampire-anime.gif",
         "https://media.tenor.com/udsFVWyKbOgAAAAd/bite-anime.gif",
         "https://media.tenor.com/_smhsCVsH4AAAAAd/no-blood-neck-bite.gif",
         "https://media.tenor.com/iIAvibfzzFYAAAAd/demichan-wa-kataritai-nom-nom.gif",
         "https://media.tenor.com/PKKQgm3GP8UAAAAd/vanitas-jeanne-the-hellfire-witch.gif",
         "https://media.tenor.com/ab2O4qmrpGgAAAAd/index-touma.gif",
         "https://media.tenor.com/greMiXEBwRMAAAAd/love-kiss.gif",
         "https://media.tenor.com/xAiGlpwEVhEAAAAd/josee-josee-to-tora-to-sakanatachi.gif"]

  reason = []
  embed = discord.Embed(color=discord.Color.blue())
  embed.set_author(name=f"{ctx.author.name} noms on {member.name}", icon_url=ctx.author.avatar)
  embed.set_image(url=random.choice(gif))
  await ctx.send(embed=embed)




@bot.command()
async def pat(ctx, member: discord.Member = None):
  if member == None:
    msg = await ctx.send("```Mention a user!!\neg: >pat [@user]```")
    await asyncio.sleep(5)
    await msg.delete()
    return
  gif = ["https://media.tenor.com/XC23-gvv5FgAAAAd/horimiya-pat-pat-anime.gif",
         "https://media.tenor.com/7xrOS-GaGAIAAAAd/anime-pat-anime.gif",
         "https://media.tenor.com/PqT70paf394AAAAd/pat.gif",
         "https://media.tenor.com/YroVxwiL2dcAAAAd/ao-haru-ride-anime-boy.gif",
         "https://media.tenor.com/Dbg-7wAaiJwAAAAd/aharen-aharen-san.gif",
         "https://media.tenor.com/TDqVQaQWcFMAAAAd/anime-pat.gif",
         "https://media.tenor.com/N41zKEDABuUAAAAd/anime-head-pat-anime-pat.gif",
         "https://media.tenor.com/E7Ll04_an30AAAAd/anime-pat.gif",
         "https://media.tenor.com/CIF_Pa3yepwAAAAd/rika-higurashi.gif",
         "https://media.tenor.com/Z-28SFKJaIsAAAAd/anime-pat.gif",
         "https://media.tenor.com/6dyxfdQx--AAAAAd/anime-senko-san.gif",
         "https://media.tenor.com/9lEuseoEheUAAAAd/pat.gif",
         "https://media.tenor.com/wLqFGYigJuIAAAAd/mai-sakurajima.gif",
         "https://media.tenor.com/Y7B6npa9mXcAAAAd/rikka-head-pat-pat-on-head.gif",
         "https://media.tenor.com/oyQjZ5XkWzUAAAAd/anime-pat.gif",
         "https://media.tenor.com/RDfGm9ftwx0AAAAd/anime-pat.gif",
         "https://media.tenor.com/Y31nRi2t5-UAAAAd/anime-pat.gif",
         "https://media.tenor.com/YGQYQKrSsCIAAAAd/anime-pat.gif",
         "https://media.tenor.com/hCh_kg6bS2YAAAAd/anime-pat.gif",
         "https://media.tenor.com/w5cGw7u1NsAAAAAd/anime-pat.gif",
         "https://media.tenor.com/iIZ5BwSuaCQAAAAd/anime-senko-san.gif",
         "https://media.tenor.com/EtvotzSToyMAAAAd/petra-rezero.gif",
         "https://media.tenor.com/LpYeBetRjCQAAAAd/anime-pat.gif",
         "https://media.tenor.com/ZXl-l0JUz54AAAAd/pat-thats-okay.gif",
         "https://media.tenor.com/muVzMQS6mW0AAAAd/pat-anime.gif",
         "https://media.tenor.com/P38qhH-3Zb0AAAAd/pat.gif",
         "https://media.tenor.com/jKd455LtcpsAAAAd/anime-head-pat.gif",
         "https://media.tenor.com/0XzZ4R16RaQAAAAd/anime-smile.gif",
         "https://media.tenor.com/wH0vjFhgl6AAAAAd/anime-taisho-otome-fairy-tale.gif",
         "https://media.tenor.com/Q2gVPbd_lLoAAAAd/azur-lane-anime.gif",
         "https://media.tenor.com/8w4TYd2tsKcAAAAd/anime-pat.gif",
         "https://media.tenor.com/K3N8ahlj2YoAAAAd/establife-anime-headpat.gif",
         "https://media.tenor.com/iAO3Gzwjq2IAAAAd/anime-mushoku-tensei.gif",
         "https://media.tenor.com/Q3gP2y9S94EAAAAd/island-rinne.gif",
         "https://media.tenor.com/o0re0DQzkd8AAAAd/anime-head-rub.gif",
         "https://media.tenor.com/z-zo3LRqx0QAAAAd/head-pat-its-okay.gif",
         "https://media.tenor.com/Nc6VJPpj_NsAAAAd/anime-pat.gif",
         "https://media.tenor.com/bIDVgFNjcn4AAAAd/anime-head-pat-anime-head-rub.gif",
         "https://media.tenor.com/mjzPtcvwO2cAAAAd/pat-head-good-job.gif",
         "https://media.tenor.com/rEBRJsLyXW4AAAAd/akihiko-usami-misaki-takahashi.gif"]

  reason = []
  embed = discord.Embed(color=discord.Color.blue())
  embed.set_author(name=f"{ctx.author.name} pets {member.name}", icon_url=ctx.author.avatar)
  embed.set_image(url=random.choice(gif))
  await ctx.send(embed=embed)




@bot.command()
async def poke(ctx, member: discord.Member = None):
  if member == None:
    msg = await ctx.send("```Mention a user!!\neg: >poke [@user]```")
    await asyncio.sleep(5)
    await msg.delete()
    return
  gif = ["https://media.tenor.com/iu_Lnd86GxAAAAAd/nekone-utawarerumono.gif",
         "https://media.tenor.com/3dOqO4vVlr8AAAAd/poke-anime.gif",
         "https://media.tenor.com/gMqsQ1wwbhgAAAAd/anime-poke.gif",
         "https://media.tenor.com/1YMrMsCtxLQAAAAd/anime-poke.gif",
         "https://media.tenor.com/y4R6rexNEJIAAAAd/boop-anime.gif",
         "https://media.tenor.com/NjIdfk7i3bsAAAAd/poke-poke-poke.gif",
         "https://media.tenor.com/MS7x-A5SsNkAAAAd/boob-poke.gif",
         "https://media.tenor.com/t6ABAaRJEA0AAAAd/oreimo-ore-no-im%C5%8Dto-ga-konna-ni-kawaii-wake-ga-nai.gif",
         "https://media.tenor.com/jNx0V84WbqkAAAAd/anime-anime-poke.gif",
         "https://media.tenor.com/HJa3EjH0iNMAAAAd/poke.gif",
         "https://media.tenor.com/0wPms8tS0eoAAAAd/boop-poke.gif",
         "https://media.tenor.com/JoA5p9DuIkwAAAAd/poke.gif",
         "https://media.tenor.com/vu1AUXE8wtsAAAAd/anime-sleep.gif",
         "https://media.tenor.com/BLCPTKTE2L0AAAAd/poke-anime.gif",
         "https://media.tenor.com/G5u3bfszOPMAAAAd/anime-picking-nose.gif",
         "https://media.tenor.com/_vVL5fuzj4cAAAAd/nagi-no.gif",
         "https://media.tenor.com/WEgDEBbG_XEAAAAd/cowboybebop-poke.gif",
         "https://media.tenor.com/hAIMw-_f6hYAAAAd/anime-girl.gif",
         "https://media.tenor.com/ySdxnfxoTrUAAAAd/ascendence-of-a-bookworm-bookworm-anime.gif",
         "https://media.tenor.com/8RAKw8XAMqAAAAAd/assassination-classroom-assassination-class.gif",
         "https://media.tenor.com/gX0K3YQTugwAAAAd/yes-naruto.gif",
         "https://media.tenor.com/zblzYN2poBAAAAAd/poke-annoy.gif",
         "https://media.tenor.com/X6SFKIxto8kAAAAd/poke-head.gif",
         "https://media.tenor.com/YCZf5AM63E0AAAAd/hidamari-sketch-hiro.gif",
         "https://media.tenor.com/OVrz7NPyL5wAAAAd/nisekoi-chitoge.gif",
         "https://media.tenor.com/ZbCay-NB1TEAAAAd/anime-mad.gif",
         "https://media.tenor.com/9ikjmqECGMsAAAAd/kanna-poke.gif",
         "https://media.tenor.com/iXopfkIEWUUAAAAd/poke.gif",
         "https://media.tenor.com/dCzpPLhJfQ4AAAAd/anime-poke.gif"]

  reason = []
  embed = discord.Embed(color=discord.Color.blue())
  embed.set_author(name=f"{ctx.author.name} boops {member.name}", icon_url=ctx.author.avatar)
  embed.set_image(url=random.choice(gif))
  await ctx.send(embed=embed)



@bot.command()
async def stare(ctx, member: discord.Member = None):
  if member == None:
    msg = await ctx.send("```Mention a user!!\neg: >stare [@user]```")
    await asyncio.sleep(5)
    await msg.delete()
    return
  gif = ["https://media.tenor.com/SEEMSDLdDugAAAAd/anya-forger.gif",
         "https://media.tenor.com/YfqM8h3_6NEAAAAd/rin-anime.gif",
         "https://media.tenor.com/oIJ7OwF0w9UAAAAd/idolypride-narumiya-suzu.gif",
         "https://media.tenor.com/kBWJ5wUmJOwAAAAd/death-stare.gif",
         "https://media.tenor.com/IwyNIipPItQAAAAd/anime-naruto.gif",
         "https://media.tenor.com/iVS8JPEsmD0AAAAd/l-lawliet-death-note.gif",
         "https://media.tenor.com/A_hRaAevYZQAAAAd/ayanokoji-youjitsu.gif",
         "https://media.tenor.com/TeDLSpDfcaQAAAAd/anime-eating.gif",
         "https://media.tenor.com/-htQlAzVwKcAAAAd/anime-blinking.gif",
         "https://media.tenor.com/OGYkjgAqocgAAAAd/anime-stare.gif",
         "https://media.tenor.com/VLUZEOpoKzYAAAAd/eren-yeager-eren.gif",
         "https://media.tenor.com/l2DhMTXahzAAAAAd/anime-boy.gif",
         "https://media.tenor.com/_-oFmzCX16UAAAAd/classroom-of-the-elite-anime.gif",
         "https://media.tenor.com/VVnBNQberP4AAAAd/black-bullet-rentaro-satomi.gif",
         "https://media.tenor.com/oyTDSBzM5ZAAAAAd/stare-anime-death-stare-anime.gif",
         "https://media.tenor.com/5x_LW28qfEgAAAAd/tanaka-kun-is-always-listless-tanaka.gif",
         "https://media.tenor.com/lv5AOWcNp24AAAAd/anime-nisekoi.gif",
         "https://media.tenor.com/WenyzTDFDbEAAAAd/chika-fujiwara.gif",
         "https://media.tenor.com/7AEex-drMYAAAAAd/hato_dove-vtuber.gif",
         "https://media.tenor.com/1opLl5UEkR4AAAAd/lamy-stare-anime-stare.gif",
         "https://media.tenor.com/jyiqqx3fTwMAAAAd/murenase-seton-gakuen-stare.gif",
         "https://media.tenor.com/bT387OQTBvQAAAAd/dn-death-note.gif",
         "https://media.tenor.com/0Zrxg3b0nMwAAAAd/anime-girl.gif",
         "https://media.tenor.com/iY1PrGWEDLAAAAAd/anime-stare.gif",
         "https://media.tenor.com/a0ekFSYSmvMAAAAd/takanashi-sei-anime.gif",
         "https://media.tenor.com/jY-g058OJ2gAAAAd/haruka-karibu-vtuber.gif",
         "https://media.tenor.com/2cn9yVou0VQAAAAd/tanaka-kun-cant-communicate-echizen.gif",
         "https://media.tenor.com/OjuWs32FbFEAAAAd/anime-views.gif",
         "https://media.tenor.com/XRFSOLbOOy8AAAAd/stare-anime-girl-dm.gif",
         "https://media.tenor.com/IjbGZdXP80EAAAAd/one-punch-man-saitama.gif",
         "https://media.tenor.com/dB4m6CohzzwAAAAd/anime-stare.gif",
         "https://media.tenor.com/6oEAus76i4EAAAAd/watame-hololive.gif",
         "https://media.tenor.com/V-6uRDDy_2AAAAAd/anime-girl.gif",
         "https://media.tenor.com/W_o-X6KNuCYAAAAd/anime-stare.gif",
         "https://media.tenor.com/8G8ZZg5e-McAAAAd/creepy-eye-anime.gif",
         "https://media.tenor.com/1LN5O8FDNFoAAAAd/anime-stare.gif"]

  reason = []
  embed = discord.Embed(color=discord.Color.blue())
  embed.set_author(name=f"{ctx.author.name} stares at {member.name}", icon_url=ctx.author.avatar)
  embed.set_image(url=random.choice(gif))
  await ctx.send(embed=embed)




@bot.command()
async def highfive(ctx, member: discord.Member = None):
  if member == None:
    msg = await ctx.send("```Mention a user!!\neg: >highfive [@user]```")
    await asyncio.sleep(5)
    await msg.delete()
    return
  gif = ["https://media.tenor.com/JBBZ9mQntx8AAAAd/anime-high-five.gif",
         "https://media.tenor.com/VaOkUsy8UjMAAAAd/hi-five-high-five.gif",
         "https://media.tenor.com/YCub_pFV2uAAAAAd/anime-high.gif",
         "https://media.tenor.com/MzT2f6AVzMoAAAAd/highfive-cute.gif",
         "https://media.tenor.com/S2_YEMGciNAAAAAd/high-five-excited.gif",
         "https://media.tenor.com/1SKzPjLVtrIAAAAd/friends-high5.gif",
         "https://media.tenor.com/yCNsaEbq9dgAAAAd/kirito-anime.gif",
         "https://media.tenor.com/5yslN1CnSIYAAAAd/jujutsu-kaisen-itadori-and-gojo.gif",
         "https://media.tenor.com/rU9PEKyn4BsAAAAd/fairy-tail-nalu.gif",
         "https://media.tenor.com/i3wzYOB5XysAAAAd/yes-high-five.gif",
         "https://media.tenor.com/ENGhNOukmSoAAAAd/vermeil-in-gold-alto-goldfield.gif",
         "https://media.tenor.com/geq2owR6VPMAAAAd/ban-meliodas.gif",
         "https://media.tenor.com/xkYxi4WFTiMAAAAd/bandori-bangdream.gif",
         "https://media.tenor.com/4lGlb8gHLcUAAAAd/kimi-ni-todoke-highfive.gif",
         "https://media.tenor.com/1R58ySLaR1oAAAAd/edens-zero-shiki-granbell.gif",
         "https://media.tenor.com/3CzQP7KPAyUAAAAd/amandaoneil-akko-cavendish.gif",
         "https://media.tenor.com/TLs2q6CGdu4AAAAd/haikyu-hinata.gif",
         "https://media.tenor.com/o2Gt3WJu8WAAAAAd/rinharu-rin-matsuoka.gif",
         "https://media.tenor.com/2YnOOaHK-gUAAAAd/naruto-sasuke.gif",
         "https://media.tenor.com/FIRdEUCSIEkAAAAd/anime-magic-senpai.gif",
         "https://media.tenor.com/SAa-Y2ivLTsAAAAd/fluorite-eyes-song-anime.gif",
         "https://media.tenor.com/cEfzG3tRRJAAAAAd/my-mai-tonight-mari-ohara.gif",
         "https://media.tenor.com/fVS2Dxur1OIAAAAd/oikawa-iwaizumi.gif",
         "https://media.tenor.com/CgEgvxLKjkIAAAAd/space-i-think.gif",
         "https://media.tenor.com/P8OC1a6PnzYAAAAd/love-live-nijigasaki.gif",
         "https://media.tenor.com/jvz-0qOXLnUAAAAd/anime-meliodas.gif",
         "https://media.tenor.com/mpzev9mwQkQAAAAd/yay-high-five.gif",
         "https://media.tenor.com/jMCqWQ6a5TMAAAAd/dr-stone.gif",
         "https://media.tenor.com/USG5pgxThhgAAAAM/erased-romantic.gif"]

  reason = []
  embed = discord.Embed(color=discord.Color.blue())
  embed.set_author(name=f"{ctx.author.name} gave a highfive to {member.name}", icon_url=ctx.author.avatar)
  embed.set_image(url=random.choice(gif))
  await ctx.send(embed=embed)




@bot.command()
async def greet(ctx, member: discord.Member = None):
  if member == None:
    msg = await ctx.send("```Mention a user!!\neg: >greet [@user]```")
    await asyncio.sleep(5)
    await msg.delete()
    return
  gif = ["https://media.tenor.com/1jbliqfE_hEAAAAd/anime-greet.gif",
         "https://media.tenor.com/nHot173LZw8AAAAd/well-done-good-work.gif",
         "https://media.tenor.com/FSK1EksixakAAAAd/thumbs-up-anime.gif",
         "https://media.tenor.com/uGN3n2O03GIAAAAd/anime-wave.gif",
         "https://media.tenor.com/aPVo-SkINo4AAAAd/anime-cool.gif",
         "https://media.tenor.com/7v9H8fvLGRMAAAAd/anime-hi.gif",
         "https://media.tenor.com/FJzcVnWgHjgAAAAd/wave.gif",
         "https://media.tenor.com/n1szpPp19d0AAAAd/yuigahama-yahallo.gif",
         "https://media.tenor.com/OoQlWsxH2SEAAAAd/hi-anime-hello.gif",
         "https://media.tenor.com/13pXqJxFzhIAAAAd/slow-loop-koharu-minagi.gif",
         "https://media.tenor.com/Q1dW7INg5ioAAAAd/hello-anime.gif",
         "https://media.tenor.com/D2OSnpPjyYoAAAAd/black-rock.gif",
         "https://media.tenor.com/tLl0Bru9EdwAAAAd/thumbs-up-good-job.gif",
         "https://media.tenor.com/mIteh_Sas9QAAAAd/anime-hello.gif",
         "https://media.tenor.com/5iKjpRuEUl8AAAAd/ok-nice.gif",
         "https://media.tenor.com/wfX0l5GwL28AAAAd/trigun-vash.gif",
         "https://media.tenor.com/eetnAeDdHHcAAAAd/hi.gif",
         "https://media.tenor.com/PQjRKrKQdpkAAAAd/yui-wave.gif",
         "https://media.tenor.com/5hMBrCqb5x4AAAAd/genshin-impact-hu-tao.gif",
         "https://media.tenor.com/WTgNozhPPTcAAAAd/good-nice.gif",
         "https://media.tenor.com/9ymo67Vq-yoAAAAd/anime-approve.gif",
         "https://media.tenor.com/Rf5v6glMta8AAAAd/hey-waves.gif",
         "https://media.tenor.com/YMdzCwOZGLkAAAAd/anime-greetings.gif",
         "https://media.tenor.com/-AzbRX2AC2IAAAAd/liella-love-live.gif",
         "https://media.tenor.com/TgmHmGTXrrIAAAAd/anime-cute.gif",
         "https://media.tenor.com/avKpdYFG4GkAAAAd/goblin-slayer-big-boobs.gif",
         "https://media.tenor.com/PVOLP-zHqooAAAAd/hello.gif",
         "https://media.tenor.com/jSXQXglLPJIAAAAd/boobs-anime.gif",
         "https://media.tenor.com/iDEP8_jSEmIAAAAd/good-bye.gif"]

  reason = []
  embed = discord.Embed(color=discord.Color.blue())
  embed.set_author(name=f"{ctx.author.name} greets {member.name}", icon_url=ctx.author.avatar)
  embed.set_image(url=random.choice(gif))
  await ctx.send(embed=embed)




@bot.command()
async def handholding(ctx, member: discord.Member = None):
  if member == None:
    msg = await ctx.send("```Mention a user!!\neg: >handholding [@user]```")
    await asyncio.sleep(5)
    await msg.delete()
    return
  gif = ["https://media.tenor.com/LIkJArfAgQIAAAAd/holding-hands-lewd.gif",
         "https://media.tenor.com/WUZAwo5KFdMAAAAd/love-holding-hands.gif",
         "https://media.tenor.com/BPJqBueNYdoAAAAd/couple-anime.gif",
         "https://media.tenor.com/4wqTSH9Ep30AAAAd/couple-anime.gif",
         "https://media.tenor.com/qZ5UWbLAEBAAAAAd/val-ally-anime.gif",
         "https://media.tenor.com/-76rfR0BNTAAAAAd/anime-couple-hand-holding.gif",
         "https://media.tenor.com/pqve83ZQ8d8AAAAd/anime-shida-kuroha.gif",
         "https://media.tenor.com/svz4FKshzMgAAAAd/anime-hold.gif",
         "https://media.tenor.com/6HrHMauHVbYAAAAd/hand-handholding.gif",
         "https://media.tenor.com/rU3xZo2_jaIAAAAd/anime-hold.gif",
         "https://media.tenor.com/pLpH6gvuLeYAAAAd/sumi-sakurasawa-kazuya-kinoshita.gif",
         "https://media.tenor.com/du8B7p54DLcAAAAd/hand-couple.gif",
         "https://media.tenor.com/hR0_ADh9YqwAAAAd/anime-hand-holding.gif",
         "https://media.tenor.com/_TtNJsBXkOAAAAAd/noragami-anime.gif",
         "https://media.tenor.com/4aRC-mZsSFsAAAAd/asthetic-anime.gif",
         "https://media.tenor.com/8pPXeV_KRzUAAAAd/anime-oreimo.gif",
         "https://media.tenor.com/u5Z93b2h3GYAAAAd/ender.gif",
         "https://media.tenor.com/QO3T5tZ4Ia4AAAAd/mai-sakurajima-rascal-does-not-dream-of-bunny-girl-senpai.gif",
         "https://media.tenor.com/wC3hJXbQtYMAAAAd/touch-hands.gif",
         "https://media.tenor.com/3TsjCLNpfZ0AAAAd/animehandholding-handhold.gif",
         "https://media.tenor.com/ePhcCRRL9YkAAAAd/hold-hand-ally-val.gif",
         "https://media.tenor.com/yVU0CGpQuYsAAAAd/holding-hands.gif",
         "https://media.tenor.com/NuDEahFzxokAAAAd/love-hold-hands.gif",
         "https://media.tenor.com/SuIqnqSNobkAAAAd/jujutsu-kaisen-jujutsu.gif",
         "https://media.tenor.com/7fazqx3v-CMAAAAd/rent-a-girlfriend-mami-chan.gif",
         "https://media.tenor.com/ONvOvboeaYAAAAAd/aesthetic-animated.gif",
         "https://media.tenor.com/s3m0OhLfdqQAAAAd/hold-hands-shy.gif",
         "https://media.tenor.com/DZHkpRqIIugAAAAd/clannad-anime.gif",
         "https://media.tenor.com/lLaxhG8FkRkAAAAd/hold-hands-cute.gif",
         "https://media.tenor.com/cxhP0s4TErAAAAAd/anime-hands-clasped.gif",
         "https://media.tenor.com/ey9qr-8abVoAAAAd/middle-school-couple.gif",
         "https://media.tenor.com/9M6ony3DrdAAAAAd/hitagi-koyomi.gif",
         "https://media.tenor.com/OX0pXghJFjoAAAAd/handholding-anime.gif",
         "https://media.tenor.com/CQiJKN5W0JkAAAAd/kirito-asuna.gif",
         "https://media.tenor.com/uMkiDqDEk6wAAAAd/aesthetic.gif",
         "https://media.tenor.com/eI9ISe_cqEcAAAAd/anime-ally-val.gif",
         "https://media.tenor.com/8gpFRYU3hr8AAAAd/bang-dream-bandori.gif",
         "https://media.tenor.com/Hc_UI21ysyQAAAAd/holding-hands.gif",
         "https://media.tenor.com/EBX-2AmtAfgAAAAd/clinch-hold-hands.gif"]
         
  reason = []
  embed = discord.Embed(color=discord.Color.blue())
  embed.set_author(name=f"{ctx.author.name} holds {member.name}'s hands", icon_url=ctx.author.avatar)
  embed.set_image(url=random.choice(gif))
  await ctx.send(embed=embed)




@bot.command()
async def tickle(ctx, member: discord.Member = None):
  if member == None:
    msg = await ctx.send("```Mention a user!!\neg: >tickle [@user]```")
    await asyncio.sleep(5)
    await msg.delete()
    return
  gif = ["https://media.tenor.com/l3c7tV1zYD4AAAAd/date-a-live-date-a-live-iv.gif",
         "https://media.tenor.com/PXL1ONAO9CEAAAAd/tickle-laugh.gif",
         "https://media.tenor.com/L5-ABrIwrksAAAAd/tickle-anime.gif",
         "https://media.tenor.com/0UY84zQWda8AAAAd/laugh-droll.gif",
         "https://media.tenor.com/ymMtVnW-TrYAAAAd/nekopara-anime.gif",
         "https://media.tenor.com/lX4VUs86-q4AAAAd/ijiranaide-nagatoro-nagataro.gif",
         "https://media.tenor.com/QqnsB4N7o6QAAAAd/anime-tickle.gif",
         "https://media.tenor.com/sgMOpHE9oGoAAAAd/free-ikuya-kirishima.gif",
         "https://media.tenor.com/WBwonvADeCoAAAAd/mareva-tickle.gif",
         "https://media.tenor.com/svV5QEFFlLMAAAAd/tickle-scared.gif",
         "https://media.tenor.com/sa1QuA9GFaoAAAAd/anime-tickle.gif",
         "https://media.tenor.com/hwiKJkLF3dUAAAAd/cute-anime.gif",
         "https://media.tenor.com/jiXx-2hbfrkAAAAd/kino-kinokino.gif",
         "https://media.tenor.com/_Y9CKX1m178AAAAd/chika-love-is-war.gif",
         "https://media.tenor.com/OoWr7pTV8NcAAAAd/neptune.gif",
         "https://media.tenor.com/_qVSFtazeVsAAAAd/kare-kano-kawaii.gif",
         "https://media.tenor.com/jT65qUu0eeEAAAAd/anime-boy.gif",
         "https://media.tenor.com/FN4yEyW6Ft4AAAAd/kaichou-wa-maid-sama-love-blow.gif",
         "https://media.tenor.com/0HwTy-ID_Q8AAAAd/cute-tickle.gif",
         "https://media.tenor.com/lo58w7DoUk0AAAAd/anime-precure.gif",
         "https://media.tenor.com/YhS9TU4Ig40AAAAd/dragon-maid-tickling.gif",
         "https://media.tenor.com/HAQ5-GlYWdgAAAAd/vanilla-nekopara.gif",
         "https://media.tenor.com/7RIypC6hRcYAAAAd/tickle-anime.gif",
         "https://media.tenor.com/5j7eivfftw8AAAAd/poke.gif",
         "https://media.tenor.com/9KCaFFBc_lkAAAAd/anime-tickle.gif",
         "https://media.tenor.com/9SGn6N0diwMAAAAd/nico-robin-chopper.gif"]
         
  reason = []
  embed = discord.Embed(color=discord.Color.blue())
  embed.set_author(name=f"{ctx.author.name} tickles {member.name}", icon_url=ctx.author.avatar)
  embed.set_image(url=random.choice(gif))
  await ctx.send(embed=embed)




@bot.command()
async def kill(ctx, member: discord.Member = None):
  if member == None:
    msg = await ctx.send("```Mention a user!!\neg: >kill [@user]```")
    await asyncio.sleep(5)
    await msg.delete()
    return
  gif = ["https://media.tenor.com/NbBCakbfZnkAAAAd/die-kill.gif",
         "https://media.tenor.com/Ce8ZMfAcjdoAAAAd/anime.gif",
         "https://media.tenor.com/cc1EzfBVr4oAAAAd/yandere-tagged.gif",
         "https://media.tenor.com/1dtHuFICZF4AAAAd/kill-smack.gif",
         "https://media.tenor.com/EWhFGCTfmucAAAAd/akame-ga-kill-akame.gif",
         "https://media.tenor.com/vBSRMaLModkAAAAd/memes-anime-memes.gif",
         "https://media.tenor.com/8W5GrIzz1FsAAAAd/anime-wasted.gif",
         "https://media.tenor.com/BBqZiV85kO0AAAAd/headshot-anime.gif",
         "https://media.tenor.com/I_msiNVliZ4AAAAd/wasted-haikyuu.gif",
         "https://media.tenor.com/RU_RjYoHDusAAAAd/wasted-push.gif",
         "https://media.tenor.com/M17-O96DXfMAAAAd/anime-wasted.gif",
         "https://media.tenor.com/5gsqCEJiXQEAAAAd/anime-wasted.gif",
         "https://media.tenor.com/AJmDD6P8LdIAAAAd/kill-wasted.gif",
         "https://media.tenor.com/ISGF32IKyRsAAAAd/tsugumomo-azami.gif",
         "https://media.tenor.com/AIRvkBT7u60AAAAd/love-live-pillow-fight.gif",
         "https://media.tenor.com/yZqNWEg6NTUAAAAd/yandere-anime.gif",
         "https://media.tenor.com/5AFdsWiZGh4AAAAd/satsuki-ryuko.gif",
         "https://media.tenor.com/8MIMDAVXSaIAAAAd/anime.gif",
         "https://media.tenor.com/FMetZ1mJKqoAAAAd/anime.gif",
         "https://media.tenor.com/iQR1abGe4KMAAAAd/isekai-anime.gif",
         "https://media.tenor.com/7ILn1ha-CZEAAAAd/tsugumomo-kukuri.gif",
         "https://media.tenor.com/ai8vvN1mntMAAAAd/anime-fate.gif",
         "https://media.tenor.com/X3h41kA3uJ4AAAAd/monster-shot.gif",
         "https://media.tenor.com/-SRfbUap-m8AAAAd/gridman-ssss-gridman.gif"]
         
  reason = []
  embed = discord.Embed(color=discord.Color.blue())
  embed.set_author(name=f"{ctx.author.name} killed {member.name}", icon_url=ctx.author.avatar)
  embed.set_image(url=random.choice(gif))
  await ctx.send(embed=embed)




@bot.command()
async def hold(ctx, member: discord.Member = None):
  if member == None:
    msg = await ctx.send("```Mention a user!!\neg: >hold [@user]```")
    await asyncio.sleep(5)
    await msg.delete()
    return
  gif = ["https://media.tenor.com/7xnJ_7SxVSoAAAAd/hold-me-anime.gif",
         "https://media.tenor.com/ylmHaKka3xcAAAAd/anime-haru-yoshida.gif",
         "https://media.tenor.com/G9yuomdknAsAAAAd/anime-couple.gif",
         "https://media.tenor.com/yU9VFxwgWpoAAAAd/anime-my-dressup-darling.gif",
         "https://media.tenor.com/0rsmThft31AAAAAd/stand-up-couple.gif",
         "https://media.tenor.com/bWvPyYDBpdcAAAAd/anime-couple-anime-head-rub.gif",
         "https://media.tenor.com/vUBIqzLEI-EAAAAd/anime-straight-face.gif",
         "https://media.tenor.com/bWvPyYDBpdcAAAAd/anime-couple-anime-head-rub.gif",
         "https://media.tenor.com/eI9ISe_cqEcAAAAd/anime-ally-val.gif",
         "https://media.tenor.com/wC3hJXbQtYMAAAAd/touch-hands.gif",
         "https://media.tenor.com/HwWBs-UREzcAAAAd/hold-me-hug.gif",
         "https://media.tenor.com/RFY9xILOZHUAAAAd/princess-mononoke-hug.gif",
         "https://media.tenor.com/7fazqx3v-CMAAAAd/rent-a-girlfriend-mami-chan.gif",
         "https://media.tenor.com/vyVrakxE8swAAAAd/anime-love.gif",
         "https://media.tenor.com/WUZAwo5KFdMAAAAd/love-holding-hands.gif",
         "https://media.tenor.com/N3ohAhI3HLkAAAAd/noragami-yatori.gif",
         "https://media.tenor.com/ePhcCRRL9YkAAAAd/hold-hand-ally-val.gif",
         "https://media.tenor.com/4aRC-mZsSFsAAAAd/asthetic-anime.gif",
         "https://media.tenor.com/SCF4s980dKsAAAAd/shinobu-monogatari.gif",
         "https://media.tenor.com/-76rfR0BNTAAAAAd/anime-couple-hand-holding.gif",
         "https://media.tenor.com/SQ_s1JdywOYAAAAd/anime-girl.gif",
         "https://media.tenor.com/UgRCxLIQcrQAAAAd/abra%C3%A7o-hug.gif",
         "https://media.tenor.com/NuDEahFzxokAAAAd/love-hold-hands.gif",
         "https://media.tenor.com/iCIhmYt6iA8AAAAd/anime-cheeks.gif",
         "https://media.tenor.com/B4ijnPYcO3EAAAAd/the-betrayal-knows-my-name-luka-crosszeria.gif",
         "https://media.tenor.com/4yWFhsgqzfEAAAAd/anime-handshake.gif",
         "https://media.tenor.com/Y7r4c6aotX8AAAAd/90s-anime-holding-hands.gif",
         "https://media.tenor.com/_TtNJsBXkOAAAAAd/noragami-anime.gif",
         "https://media.tenor.com/T1dGuFK7S6sAAAAd/tsuki-ga-kirei-anime.gif",
         "https://media.tenor.com/bsMvxQQCrCkAAAAd/hug-anime.gif",
         "https://media.tenor.com/GCWKqT1ukt4AAAAd/hold-me-couple.gif",
         "https://media.tenor.com/IY80yS-NYUcAAAAd/anime-face.gif",
         "https://media.tenor.com/Hyl4a0S1iIkAAAAd/hold-hands-hold.gif"]
         
  reason = []
  embed = discord.Embed(color=discord.Color.blue())
  embed.set_author(name=f"{ctx.author.name} holds {member.name}'s hands", icon_url=ctx.author.avatar)
  embed.set_image(url=random.choice(gif))
  await ctx.send(embed=embed)




@bot.command()
async def wave(ctx, member: discord.Member = None):
  if member == None:
    msg = await ctx.send("```Mention a user!!\neg: >wave [@user]```")
    await asyncio.sleep(5)
    await msg.delete()
    return
  gif = ["https://media.tenor.com/AuBOgaPV41cAAAAd/shinya-shinyahiragi.gif",
         "https://media.tenor.com/ILT5-vuNzB8AAAAd/anime-anime-wave-bye.gif",
         "https://media.tenor.com/nQOSTbcTKZcAAAAd/anime-waves-hi.gif",
         "https://media.tenor.com/AJrPXQyoNCQAAAAd/kanokari-anime-wave.gif",
         "https://media.tenor.com/dessgik7ovcAAAAd/anime-wave.gif",
         "https://media.tenor.com/B8PvHQ3BhuoAAAAd/kakashi-kakashi-hatake.gif",
         "https://media.tenor.com/FMpLzF4UJhwAAAAd/kisumi-wave.gif",
         "https://media.tenor.com/1MfQk9vFF7MAAAAd/anime-bye-bye-maki.gif",
         "https://media.tenor.com/jJbRll1S_pYAAAAd/wave-tomoko.gif",
         "https://media.tenor.com/BfOaQrPTl4YAAAAd/wataten-watashi-ni-tenshi-ga-maiorita.gif",
         "https://media.tenor.com/SPkUmWsvnGIAAAAd/sumi-sakurasawa-rent-a-girlfriend.gif",
         "https://media.tenor.com/73wKQVjruFcAAAAd/chiaki-nanami-anime.gif",
         "https://media.tenor.com/Hntke7HWHhIAAAAd/wave-anime.gif",
         "https://media.tenor.com/EERR4LXoJBoAAAAd/hi-wave.gif",
         "https://media.tenor.com/RVydL_9yULgAAAAd/bye-anime.gif",
         "https://media.tenor.com/DBcVKLog4qUAAAAd/sasaki-to-miyano-sasaki-and-miyano.gif",
         "https://media.tenor.com/MmTMEtRSIOUAAAAd/nijima-ibuki-d4dj-first-mix.gif",
         "https://media.tenor.com/FJzcVnWgHjgAAAAd/wave.gif",
         "https://media.tenor.com/qlT4AO1LID0AAAAd/anime-wave.gif",
         "https://media.tenor.com/dCTUyNt499gAAAAd/kobayashi-dragon.gif",
         "https://media.tenor.com/H4xLf6epW-wAAAAd/anime-wave.gif",
         "https://media.tenor.com/vXHprx-XO-AAAAAd/sasaki-to-miyano-sasaki-and-miyano.gif",
         "https://media.tenor.com/lQytipokZMIAAAAd/takagi-san-anime-wave.gif",
         "https://media.tenor.com/OnopeiLDgecAAAAd/princess-connect-anime-wave.gif",
         "https://media.tenor.com/vPAn-usxXUMAAAAd/kanbaru-anime.gif",
         "https://media.tenor.com/Kvyc2YRvnlAAAAAd/kagome-hello.gif",
         "https://media.tenor.com/sLdhqMNKrFcAAAAd/anime-wave-micchon-shikimori.gif",
         "https://media.tenor.com/OoQlWsxH2SEAAAAd/hi-anime-hello.gif",
         "https://media.tenor.com/DDnp-TLMTWQAAAAd/hello-anime.gif",
         "https://media.tenor.com/R1fs908C1zwAAAAd/bye-hi.gif",
         "https://media.tenor.com/uUvx4rPO85AAAAAd/shima-rin-yuru-camp.gif",
         "https://media.tenor.com/vNLXWrJpWKsAAAAd/komi-san-wa-comyushou-desu-wave.gif",
         "https://media.tenor.com/MjgjyW0Gnf0AAAAd/anime-hi.gif",
         "https://media.tenor.com/JKVDJPZX4kIAAAAd/anime-anime-wave.gif",
         "https://media.tenor.com/FhtL5SNaHvMAAAAd/touhou-keine.gif",
         "https://media.tenor.com/TKMqMAkJL8wAAAAd/anime-wave-anime-hi.gif",
         "https://media.tenor.com/-TKyQcZRmwkAAAAd/hi-hey.gif",
         "https://media.tenor.com/S6V1PHV-PQUAAAAd/kuroha-shida-kuroha.gif",
         "https://media.tenor.com/o9Ak0TpPek0AAAAd/aikatsu-aikatsu-hello.gif",
         "https://media.tenor.com/7Js7ja7gTjAAAAAd/anime-wave.gif",
         "https://media.tenor.com/Bmq9vc_yxj4AAAAd/spy-x-family-yor.gif",
         "https://media.tenor.com/eCXPQUe9NBYAAAAd/rpg-fudousan-anime-wave.gif",
         "https://media.tenor.com/qix2X5XHZ74AAAAd/kuga-yuma-world-trigger.gif",
         "https://media.tenor.com/6_oAZHmPupgAAAAd/akebi-chan-no-sailor-anime-wave.gif",
         "https://media.tenor.com/KjoUZShtrggAAAAd/paiyumi-vtuber.gif"]
         
  reason = []
  embed = discord.Embed(color=discord.Color.blue())
  embed.set_author(name=f"{ctx.author.name} says hi to {member.name}", icon_url=ctx.author.avatar)
  embed.set_image(url=random.choice(gif))
  await ctx.send(embed=embed)




@bot.command()
async def snuggle(ctx, member: discord.Member = None):
  if member == None:
    msg = await ctx.send("```Mention a user!!\neg: >snuggle [@user]```")
    await asyncio.sleep(5)
    await msg.delete()
    return
  gif = ["https://media.tenor.com/xMD2hPYkXasAAAAd/anime-snuggle.gif",
         "https://media.tenor.com/bLttPccI_I4AAAAd/cuddle-anime.gif",
         "https://media.tenor.com/s44ige0diLYAAAAd/sanriokill-anime.gif",
         "https://media.tenor.com/4mJqTEl73VwAAAAd/dragon-hug.gif",
         "https://media.tenor.com/rosigG51p0MAAAAd/anime-couple-anime-bed.gif",
         "https://media.tenor.com/okeP090NK1cAAAAd/anime-couples.gif",
         "https://media.tenor.com/wZQ82apr3YMAAAAd/anime-cuddle.gif",
         "https://media.tenor.com/08vDStcjoGAAAAAd/cuddle-anime-hug-anime.gif",
         "https://media.tenor.com/OISOJLlZOnYAAAAd/hug.gif",
         "https://media.tenor.com/vdIg7bQv2XYAAAAd/snuggle-cuddle-me.gif",
         "https://media.tenor.com/J7eGDvGeP9IAAAAd/enage-kiss-anime-hug.gif",
         "https://media.tenor.com/IQCyn7dd9PwAAAAd/val-ally-hug.gif",
         "https://media.tenor.com/d0hNKcx-GbEAAAAd/anime-cuddle-snow-cuddle.gif",
         "https://media.tenor.com/XptUhNOfUXUAAAAd/anime-anime-couple.gif",
         "https://media.tenor.com/f3K9bGzDzTsAAAAd/zragon-infinity-anime.gif",
         "https://media.tenor.com/wwd7R-pi7DIAAAAd/anime-cuddle.gif",
         "https://media.tenor.com/ri4J0lgBeZoAAAAd/snuggle-anime.gif",
         "https://media.tenor.com/E4MMkAyfiZgAAAAd/anime-hug-nuzzle.gif",
         "https://media.tenor.com/R7uHqlHpDEMAAAAd/cuddle-anime.gif",
         "https://media.tenor.com/rAwmK1qaoVUAAAAd/anime-in-bed.gif",
         "https://media.tenor.com/vpE7LGJcq2gAAAAd/val-ally-anime.gif",
         "https://media.tenor.com/8X6WB7UvCMAAAAAd/anime-couple-hug.gif",
         "https://media.tenor.com/GCWKqT1ukt4AAAAd/hold-me-couple.gif",
         "https://media.tenor.com/iEDbr-ZhHMkAAAAd/anime-hug.gif",
         "https://media.tenor.com/Dc5yd05wu_cAAAAd/couple-hug.gif",
         "https://media.tenor.com/3SVW-1sFBW8AAAAd/snuggle-snuggles.gif",
         "https://media.tenor.com/DqX0oTh5CLsAAAAd/hug-cat.gif",
         "https://media.tenor.com/4B4X_lWK-lgAAAAd/cuddle-clannad.gif",
         "https://media.tenor.com/84vXUVCdL4AAAAAd/anime-couple-anime-winter.gif",
         "https://media.tenor.com/_aaECs9uDSwAAAAd/cuddling-anime-hug.gif",
         "https://media.tenor.com/yqhtNEuG0aEAAAAd/nekopara-cute.gif",
         "https://media.tenor.com/ZByzUq0U6JIAAAAd/anime-cuddle.gif",
         "https://media.tenor.com/3SoYfs-0SrgAAAAd/in-the-land-of-leadale-anime-cuddle.gif",
         "https://media.tenor.com/8TwoveHk9n8AAAAd/anime-cuddle.gif",
         "https://media.tenor.com/aXQIC-mWPL0AAAAd/hug-anime.gif",
         "https://media.tenor.com/6pgBabtIy1cAAAAd/colin-anime.gif",
         "https://media.tenor.com/but4OBeWO7EAAAAd/golden-time-anime.gif",
         "https://media.tenor.com/27bjSDWU9rwAAAAd/anime-couples.gif",
         "https://media.tenor.com/0KJtODIw0UkAAAAd/anime-cuddle.gif",
         "https://media.tenor.com/rhZTzVdGSbsAAAAd/anime-cute.gif",
         "https://media.tenor.com/MApGHq5Kvj0AAAAd/anime-hug.gif",
         "https://media.tenor.com/PEEVUgby2p0AAAAd/anime-anime-hug.gif",
         "https://media.tenor.com/KvRTIAp8Dh0AAAAd/anime-kiss.gif"]
         
  reason = []
  embed = discord.Embed(color=discord.Color.blue())
  embed.set_author(name=f"{ctx.author.name} snuggles {member.name}", icon_url=ctx.author.avatar)
  embed.set_image(url=random.choice(gif))
  await ctx.send(embed=embed)





@bot.command()
async def bully(ctx, member: discord.Member = None):
  if member == None:
    msg = await ctx.send("```Mention a user!!\neg: >bully [@user]```")
    await asyncio.sleep(5)
    await msg.delete()
    return
  gif = ["https://media.tenor.com/IqsMJF8agd4AAAAd/anime-bully.gif",
         "https://media.tenor.com/uh3ye975ovsAAAAd/bully.gif",
         "https://media.tenor.com/k9QsoTYjJSUAAAAd/kick-anime.gif",
         "https://media.tenor.com/FaeI1AeNMTYAAAAd/throw-bully.gif",
         "https://media.tenor.com/xy05so3mD6cAAAAd/please-dont-bully-me-nagatoro-san-anime.gif",
         "https://media.tenor.com/yy8QBx3nhdIAAAAd/anime-bully.gif",
         "https://media.tenor.com/D_-8tx--KDAAAAAd/chuunibyou-anime.gif",
         "https://media.tenor.com/ZUgJGo6xL6QAAAAd/cyberbullying-cyberbully.gif",
         "https://media.tenor.com/LlOE5_cnhJoAAAAd/rika-anime.gif",
         "https://media.tenor.com/8dMvBt6OkxEAAAAd/ijirinaide-nagatoro-san-please-dont-bully-me-nagatoro-san.gif",
         "https://media.tenor.com/mXE1KFL2u2AAAAAd/otoboku-anime.gif",
         "https://media.tenor.com/WK3t25D8fhgAAAAd/bully-mean.gif",
         "https://media.tenor.com/NtT8-yFQ0SsAAAAd/nagatoro-ijirinaide-nagatoro-san.gif",
         "https://media.tenor.com/1RExh3-4f-gAAAAd/cute-kawaii.gif",
         "https://media.tenor.com/v0zNBL6W3DMAAAAd/bleach-ichigo-kurosaki.gif",
         "https://media.tenor.com/Sg9bBFBRTo8AAAAd/nagatoro-ijirinaide-nagatoro-san.gif",
         "https://media.tenor.com/6614XaRvAoEAAAAd/kuro-usagi-bully.gif",
         "https://media.tenor.com/8EF2cz2JB88AAAAd/anime-bully.gif",
         "https://media.tenor.com/VfJGROqFM5AAAAAd/mitsuboshi-colors-kotoha.gif",
         "https://media.tenor.com/2n2BoINr52EAAAAd/nagatoro-ijirinaide-nagatoro-san.gif",
         "https://media.tenor.com/6D5K4tvl6fYAAAAd/otoboku-anime.gif",
         "https://media.tenor.com/o2Q0xMRv-4IAAAAd/mahou-shoujo-site-anime.gif",
         "https://media.tenor.com/D5IOEca8m6cAAAAd/ijirinaide-nagatoro-san-please-dont-bully-me-nagatoro-san.gif",
         "https://media.tenor.com/vBQRaCv6nhkAAAAd/anime-bully.gif",
         "https://media.tenor.com/KKfLfbhNzZ8AAAAd/anime-bully.gif",
         "https://media.tenor.com/YY_mAsOYY7UAAAAd/anime-bully.gif",
         "https://media.tenor.com/ukxLCPO3jGYAAAAd/nagatoro-ijirinaide-nagatoro-san.gif",
         "https://media.tenor.com/p_mMicg1pgUAAAAd/anya-forger-damian-spy-x-family.gif",
         "https://media.tenor.com/V3SOHrzZUewAAAAd/a-silent-voice-shouko-nishimiya.gif",
         "https://media.tenor.com/Qn5oTJTmbGMAAAAd/nagatoro-ijirinaide-nagatoro-san.gif",
         "https://media.tenor.com/1jUXehMGd3AAAAAd/jujutsu-kaisen-anime.gif",
         "https://media.tenor.com/yQATc_LVYj4AAAAd/nagatoro-ijirinaide-nagatoro-san.gif",
         "https://media.tenor.com/K2p_iuYS-tsAAAAd/nagatoro-hayase-nagatoro.gif",
         "https://media.tenor.com/biAtMjW1tFQAAAAd/bully.gif",
         "https://media.tenor.com/Z3xvNGIK-toAAAAd/dna-mad.gif",
         "https://media.tenor.com/4yM1ZO6HjdkAAAAd/kid-luffy.gif",
         "https://media.tenor.com/tCt-DE-1kRcAAAAd/otoboku-anime.gif",
         "https://media.tenor.com/9jQ02bqA4ioAAAAd/rikka-and.gif",
         "https://media.tenor.com/Err8UgTrui8AAAAd/little-busters.gif"]
         
  reason = []
  embed = discord.Embed(color=discord.Color.blue())
  embed.set_author(name=f"{ctx.author.name} bullies {member.name}", icon_url=ctx.author.avatar)
  embed.set_image(url=random.choice(gif))
  await ctx.send(embed=embed)





@bot.command()
async def blush(ctx):
  gif = ["https://media.tenor.com/daIZ-e7VvkwAAAAd/anime-blush.gif",
         "https://media.tenor.com/FRunV08QBXwAAAAd/sumi-sakurasawa-rent-a-girlfriend.gif",
         "https://media.tenor.com/yKtYfA0mizYAAAAd/my-dress-up-darling-anime-blush.gif",
         "https://media.tenor.com/dH4YL72had0AAAAd/blush-anime.gif",
         "https://media.tenor.com/CEkiOjpsylwAAAAd/kitagawa-kitagawa-marin.gif",
         "https://media.tenor.com/y3UyEPZZ36wAAAAd/anime-boy.gif",
         "https://media.tenor.com/cjFjOFwZODIAAAAd/anime-girl.gif",
         "https://media.tenor.com/z3decH92y2gAAAAd/shy-embarrassed.gif",
         "https://media.tenor.com/VRUQ_YhZZIAAAAAd/anime-blush.gif",
         "https://media.tenor.com/OJ7dWLRs3JAAAAAd/mizuhara-chizuru.gif",
         "https://media.tenor.com/73k5d_LqL2IAAAAd/blushing-anime-anime-girl.gif",
         "https://media.tenor.com/30a9CPebaZoAAAAd/koiseka-anime-blush.gif",
         "https://media.tenor.com/1Dtt5RPYfu0AAAAd/anime-blush.gif",
         "https://media.tenor.com/EL3iaTDPsU4AAAAd/shikimoris-not-just-cute-shikimori.gif",
         "https://media.tenor.com/bCULNdEPzU0AAAAd/blushing-anime-anime-girl.gif",
         "https://media.tenor.com/KDPRHWcjUY8AAAAd/yeison.gif",
         "https://media.tenor.com/lezPddWRr64AAAAd/anime-ehehe.gif",
         "https://media.tenor.com/wwxHnJqUNEMAAAAd/anime-blush.gif",
         "https://media.tenor.com/GxX1MIc8piAAAAAd/blush-anime.gif",
         "https://media.tenor.com/ZDHaRFy2CHQAAAAd/koiseka-anime-blush.gif",
         "https://media.tenor.com/g8azBMokn4gAAAAd/koiseka-anime-blush.gif",
         "https://media.tenor.com/qYS0n4QWxd4AAAAd/blush-anime.gif",
         "https://media.tenor.com/GiOGySHeERMAAAAd/anime-blush.gif",
         "https://media.tenor.com/ESCuELwXI58AAAAd/umaru-channnn-blush.gif",
         "https://media.tenor.com/PnNcm6o-eXkAAAAd/anya-forger-anya-spy-x-family-anime.gif",
         "https://media.tenor.com/d3AEjdxSfawAAAAd/anime-blush.gif",
         "https://media.tenor.com/B3ruPv8ye28AAAAd/blushing-anime-anime-girl.gif",
         "https://media.tenor.com/Y6KoYUuYKWAAAAAd/yor-forger-yor.gif",
         "https://media.tenor.com/CSdDnG_7HN4AAAAd/anime-blush-sakuhubtwt.gif",
         "https://media.tenor.com/CZ2ulkJvE5wAAAAd/blue-hair.gif",
         "https://media.tenor.com/OPwfChwsarkAAAAd/anime-blush.gif",
         "https://media.tenor.com/ESLCpugfdDEAAAAd/anime.gif",
         "https://media.tenor.com/j-m-WoO8QhYAAAAd/anime-blush-takagi-san.gif",
         "https://media.tenor.com/XrPSpRg5sYIAAAAd/anime-blush.gif",
         "https://media.tenor.com/9avuvzHbgv4AAAAd/sumi-sakurasawa-rent-a-girlfriend.gif",
         "https://media.tenor.com/rI5Jgr2lQesAAAAd/rikekoi-anime-blush.gif",
         "https://media.tenor.com/vWE_fu3w0PMAAAAd/shy-anime.gif",
         "https://media.tenor.com/H10VzPl5uOcAAAAd/higurashi2020-higurashi-gou.gif",
         "https://media.tenor.com/g8Qgod2OVzgAAAAd/yuru-yuri-flustered.gif",
         "https://media.tenor.com/lXb0jkxThicAAAAd/anime-anime-blush.gif",
         "https://media.tenor.com/VrfSZUjiWn4AAAAd/shy-anime.gif",
         "https://media.tenor.com/B9CVPpxUbD0AAAAd/hayase-nagatoro-nagatoro.gif",
         "https://media.tenor.com/F4eUZjxs_VgAAAAd/gabriel-dropout.gif",
         "https://media.tenor.com/LRmSwB83O6AAAAAd/shy-kasumigaoka-utaha.gif",
         "https://media.tenor.com/-AkkTCm1Y8IAAAAd/flushed.gif",
         "https://media.tenor.com/gFoDNkiAkVoAAAAd/anime-girl.gif",
         "https://media.tenor.com/5A5wKR2x7pIAAAAd/princess-connect-kokkoro.gif",
         "https://media.tenor.com/GT2-EGuUogQAAAAd/anime-girl.gif",
         "https://media.tenor.com/SvyzDsImVVUAAAAd/blushes-girl.gif",
         "https://media.tenor.com/kIrT13huXJwAAAAd/girl-anime.gif"]

  reason = []
  embed = discord.Embed(color=discord.Color.blue())
  embed.set_author(name=f"{ctx.author.name}'s face is red", icon_url=ctx.author.avatar)
  embed.set_image(url=random.choice(gif))
  await ctx.send(embed=embed)



@bot.command()
async def cry(ctx):
  gif = ["https://media.tenor.com/VcdTcSy-sJMAAAAd/sad-cry.gif",
         "https://media.tenor.com/A0g9Rrx4aNsAAAAd/sad-angry.gif",
         "https://media.tenor.com/Qq123ogPo80AAAAd/sad-anime.gif",
         "https://media.tenor.com/j-mVhVzhSAYAAAAd/anime-cry.gif",
         "https://media.tenor.com/FXq5be_Q7oUAAAAd/anime-anime-cry.gif",
         "https://media.tenor.com/XBWh-szFwDQAAAAd/crying-naruto-crying.gif",
         "https://media.tenor.com/8WAGBT7LgA0AAAAd/anime-cry-hinagiku.gif",
         "https://media.tenor.com/0qj0aqZ0nucAAAAd/anya-spy-x-family-anime-anya-crying.gif",
         "https://media.tenor.com/_eEcwl8Mn50AAAAd/akebi-chan-no-sailor-anime-cry.gif",
         "https://media.tenor.com/oeQiYjma65oAAAAd/anime-sad.gif",
         "https://media.tenor.com/0ZNy-QfbcBYAAAAd/anime.gif",
         "https://media.tenor.com/qrEyPG0mDVYAAAAd/aharen-san-anime-cry.gif",
         "https://media.tenor.com/Jphp6FfLOXoAAAAd/anime-sad.gif",
         "https://media.tenor.com/S4gNXB7I47UAAAAd/mikan-tsumiki-nurse.gif",
         "https://media.tenor.com/0SxceifWNeEAAAAd/shachiku-san-anime-cry.gif",
         "https://media.tenor.com/P2lo7-5YaswAAAAd/heroines-run-the-show-hiyori-suzumi.gif",
         "https://media.tenor.com/Mlgi6bkVkG8AAAAd/emotional-cry.gif",
         "https://media.tenor.com/9gfJKZaNYMUAAAAd/anime-anime-cry.gif",
         "https://media.tenor.com/zPGH1GeElyAAAAAd/anime-anime-panic.gif",
         "https://media.tenor.com/h2RyGfmdvXEAAAAd/mushoku-tensei-eris.gif",
         "https://media.tenor.com/AQ6i1yCewaIAAAAd/rem-galeu-anime.gif",
         "https://media.tenor.com/LJTunzp5_04AAAAd/sad-anime.gif",
         "https://media.tenor.com/UivHDaeJT_cAAAAd/cry-anime.gif",
         "https://media.tenor.com/IHVd7sXB66YAAAAd/anime-cry-hinagiku.gif",
         "https://media.tenor.com/6qJBThILOTcAAAAd/shikimoris-not-just-cute-shikimori.gif",
         "https://media.tenor.com/rh8AFirDdHAAAAAd/cry-anime.gif",
         "https://media.tenor.com/cLAH7cYN_KIAAAAd/tears-cry.gif",
         "https://media.tenor.com/cpDRqZxQvYQAAAAd/sorry-anime.gif",
         "https://media.tenor.com/6Y-9ozCs90IAAAAd/anime-cry-hinagiku.gif",
         "https://media.tenor.com/HkSh7KsAensAAAAd/anime-gintama.gif",
         "https://media.tenor.com/uGN5Gq3rvqwAAAAd/kobeni-yonomori-cry.gif",
         "https://media.tenor.com/5GdqY-CkQ0oAAAAd/kanon2006-anime.gif",
         "https://media.tenor.com/2CVVF82ctOwAAAAd/sad-cry.gif",
         "https://media.tenor.com/XQOkaj-j_9EAAAAd/cry-anime.gif",
         "https://media.tenor.com/WqpeTDoA1QUAAAAd/cry-anime.gif",
         "https://media.tenor.com/Xyt3vX8vmw4AAAAd/anime-crying.gif",
         "https://media.tenor.com/dFl9u1CqDW0AAAAd/vanitas-no-carte-chloe.gif",
         "https://media.tenor.com/oNs5LAb7KusAAAAd/rpg-fudousan-anime-cry.gif",
         "https://media.tenor.com/Kiad3jtA4RMAAAAd/akebi-chan-crying.gif",
         "https://media.tenor.com/jchX5Rs6kP4AAAAd/anime-sad.gif",
         "https://media.tenor.com/7NQtiB8dHXcAAAAd/cry-crying.gif"]

  reason = []
  embed = discord.Embed(color=discord.Color.blue())
  embed.set_author(name=f"{ctx.author.name} is crying...", icon_url=ctx.author.avatar)
  embed.set_image(url=random.choice(gif))
  await ctx.send(embed=embed)





@bot.command()
async def dance(ctx):
  gif = ["https://media.tenor.com/R-5D2xDNW7QAAAAd/anime.gif",
         "https://media.tenor.com/LNVNahJyrI0AAAAd/aharen-dance.gif",
         "https://media.tenor.com/xHdQRsnCSVYAAAAd/kakashi-dancing.gif",
         "https://media.tenor.com/OqOWJ0nsAlIAAAAd/dance-anime-dance.gif",
         "https://media.tenor.com/GOYRQva4UeoAAAAd/anime-dance.gif",
         "https://media.tenor.com/wFtRdoHX-ssAAAAd/dance-happy.gif",
         "https://media.tenor.com/y9wCPf0zWTgAAAAd/tobi-naruto.gif",
         "https://media.tenor.com/jWRFHjiNdkgAAAAd/anime-dance.gif",
         "https://media.tenor.com/9eu9F42NQuYAAAAd/dance-anime-cool.gif",
         "https://media.tenor.com/15NLF1281h8AAAAd/anime-dance.gif",
         "https://media.tenor.com/mKTS5nbF1zcAAAAd/cute-anime-dancing.gif",
         "https://media.tenor.com/f_47e8MKBpAAAAAd/dance-anime.gif",
         "https://media.tenor.com/P7QN5kqyiSQAAAAd/aharen-san-aharen-san-anime.gif",
         "https://media.tenor.com/xnh1TiP1RhwAAAAd/anime-dance.gif",
         "https://media.tenor.com/13M7DM7nbGQAAAAd/anime-dance.gif",
         "https://media.tenor.com/MrCVa-f_wOkAAAAd/dance-anime.gif",
         "https://media.tenor.com/3Mc4IqoPAxAAAAAd/anime-dance.gif",
         "https://media.tenor.com/5swdaNmQ8csAAAAd/anime-dance.gif",
         "https://media.tenor.com/NULSPE1mw2IAAAAd/dance-anime.gif",
         "https://media.tenor.com/o9c6lRvOpMkAAAAd/dazai-dazai-osamu.gif",
         "https://media.tenor.com/Kl1yqwiPimMAAAAd/durarara-dance.gif",
         "https://media.tenor.com/vebF_E3Vj8EAAAAd/anime-dance.gif",
         "https://media.tenor.com/DsQZ_Kjq9ckAAAAd/anime-dance.gif",
         "https://media.tenor.com/fim-ddZD7c8AAAAd/dance-anime.gif",
         "https://media.tenor.com/bVk3IxSzQDoAAAAd/pokemon-anime.gif",
         "https://media.tenor.com/_vskzHJCcWwAAAAd/anime-dance.gif",
         "https://media.tenor.com/Q6KUdmVHBLkAAAAd/sumi-dance.gif",
         "https://media.tenor.com/6Sz_9iSt7kAAAAAd/idoly-pride-anime-girl-dancing.gif",
         "https://media.tenor.com/v8oCXbTW3rcAAAAd/hayasaka-helltaker.gif",
         "https://media.tenor.com/uTJCHlbtWJUAAAAd/yay-anime.gif",
         "https://media.tenor.com/jBFLxy02xpIAAAAd/anime-dance.gif",
         "https://media.tenor.com/AfgPpd9ssc4AAAAd/anime-dance.gif",
         "https://media.tenor.com/8WUdf7R3GRQAAAAd/dance-girl.gif",
         "https://media.tenor.com/NOGjHRHDL_cAAAAd/naruto-uzumaki-naruto.gif",
         "https://media.tenor.com/S9BeEboyTk4AAAAd/anime-dance.gif",
         "https://media.tenor.com/cglS81TpHAIAAAAd/rainbow-anime.gif",
         "https://media.tenor.com/Mer7tKkY36MAAAAd/anime-cute.gif",
         "https://media.tenor.com/LkfM4yiDt-AAAAAd/anime-dance.gif",
         "https://media.tenor.com/tNulr7DcsZAAAAAd/yuru-yuri-kyoko.gif",
         "https://media.tenor.com/7Wr6XBENISQAAAAd/dance-anime.gif",
         "https://media.tenor.com/g6RJobIFsYIAAAAd/dance-dancing.gif",
         "https://media.tenor.com/wfFFtKqPhI8AAAAd/anime-dance.gif",
         "https://media.tenor.com/MW9JguyZjSoAAAAd/anime-dance.gif",
         "https://media.tenor.com/xCHi7-SH-KQAAAAd/dance-anime.gif",
         "https://media.tenor.com/7G1BH5cbHpMAAAAd/dance-anime.gif",
         "https://media.tenor.com/cWyUKWwy4PQAAAAd/anime-cute.gif",
         "https://media.tenor.com/ZRx1tEM2wZoAAAAd/star-glimmer-vtuber.gif",
         "https://media.tenor.com/9tQPi4npJJgAAAAd/vtuber-veibae.gif",
         "https://media.tenor.com/Quz7L5OCmWYAAAAd/cute-anime.gif",
         "https://media.tenor.com/llIEL86XtLYAAAAd/dance-durarara.gif",
         "https://media.tenor.com/nYcoGrUlZykAAAAd/anime.gif",
         "https://media.tenor.com/MGhl4dBxjpMAAAAd/dance-anime.gif",
         "https://media.tenor.com/H_nA0IZI0PgAAAAd/girl-anime.gif",
         "https://media.tenor.com/fvqR_g2Bl7oAAAAd/dance-anime.gif",
         "https://media.tenor.com/6YxzB6eZ8mAAAAAd/dance-anime-dance.gif",
         "https://media.tenor.com/mjTBpxxGig8AAAAd/sakurano-mimito-denonbu.gif",
         "https://media.tenor.com/r0IRrRJqMIwAAAAd/dance-anime.gif",
         "https://media.tenor.com/_KErjkObpu8AAAAd/hakui-koyori.gif",
         "https://media.tenor.com/mSWD-MGgfjMAAAAd/anime-love.gif"]

  reason = []
  embed = discord.Embed(color=discord.Color.blue())
  embed.set_author(name=f"{ctx.author.name} is dancing...", icon_url=ctx.author.avatar)
  embed.set_image(url=random.choice(gif))
  await ctx.send(embed=embed)




@bot.command()
async def lewd(ctx):
  gif = ["https://media.tenor.com/r4Tysm1NxMQAAAAd/futakana-lewd-anime.gif",
         "https://media.tenor.com/e3zBHVCytb0AAAAd/kampfer-anime.gif",
         "https://media.tenor.com/P_M4nYbob10AAAAd/anime-lewd.gif",
         "https://media.tenor.com/us337-VAyv0AAAAd/lewd-anime.gif",
         "https://media.tenor.com/LIkJArfAgQIAAAAd/holding-hands-lewd.gif",
         "https://media.tenor.com/CzI4QNcXQ3YAAAAd/waifu-anime.gif",
         "https://media.tenor.com/jy_uVu9bBD0AAAAd/anime-lewd.gif",
         "https://media.tenor.com/yYpsyTNE8MQAAAAd/hanime-anime.gif",
         "https://media.tenor.com/xXaAwWfnQCEAAAAd/matsuri-lewd-matsuri.gif",
         "https://media.tenor.com/x2OPO3hPl_gAAAAd/wew-arata.gif",
         "https://media.tenor.com/YchnxgjYHgIAAAAd/neko-lewd.gif",
         "https://media.tenor.com/ftDAZSm3nqQAAAAd/lewd-anime.gif",
         "https://media.tenor.com/z5_6_e-TdcYAAAAd/anime-lewd.gif",
         "https://media.tenor.com/513s3tmHbUYAAAAd/lewd-anime.gif",
         "https://media.tenor.com/Qy3tETXeEY8AAAAd/canaan-428the-animation.gif",
         "https://media.tenor.com/JCdB8nyDbRMAAAAd/arata-hxh.gif",
         "https://media.tenor.com/myMFimZi3IAAAAAd/anime-ecchi.gif",
         "https://media.tenor.com/GVj2JomB9tIAAAAd/lewd-anime-anime.gif",
         "https://media.tenor.com/FiZYwwU1WjwAAAAd/eromanga-sensei-lewd.gif",
         "https://media.tenor.com/j57AnA0HhDUAAAAd/chichan-arata.gif",
         "https://media.tenor.com/_tr0pZWhYlIAAAAd/anime-lewd.gif",
         "https://media.tenor.com/tuKh4QB7wt0AAAAd/code-geass.gif",
         "https://media.tenor.com/M6u35redDzYAAAAd/anime-lewd.gif",
         "https://media.tenor.com/T2UWEgyhOBsAAAAd/anime-lewd.gif",
         "https://media.tenor.com/yw-BEu8EKWMAAAAd/arata-lewd.gif",
         "https://media.tenor.com/CpsTO51-3j0AAAAd/ecchi.gif"]

  reason = []
  embed = discord.Embed(color=discord.Color.blue())
  embed.set_author(name=f"{ctx.author.name}! Cover your eyes! It's too lewd!", icon_url=ctx.author.avatar)
  embed.set_image(url=random.choice(gif))
  await ctx.send(embed=embed)




#Currently working on the music commands
music = DiscordUtils.Music()

#Currently working on this command
@bot.command()
async def join(ctx):
  voicetrue = ctx.author.voice
  if voicetrue is None:
    return await ctx.send("You are not currently in a voice channel")
  await ctx.author.voice.channel.connect()
  await ctx.send("Joined your voice channel")


#Currently working on this command
@bot.command()
async def leave(ctx):
  voicetrue = ctx.author.voice
  myvoicetrue = ctx.guild.me.voice
  if voicetrue is None:
    return await ctx.send("You are not currently in a voice channel")
  if myvoicetrue is None:
    return await ctx.send("I am not currently in a voice channel")
  await ctx.voice_client.disconnect()
  await ctx.send("Left your voice channel")


#I am currently working on this command
@bot.command()
async def play(ctx, *, url):
  player = music.get_player(guild_id=ctx.guild.id)
  if not player:
    player = music.create_player(ctx, ffmpeg_error_betterfix=True)
  if not ctx.voice_client.is_playing():
    await player.queue(url, search=True)
    song = await player.play()
    await ctx.send(f"I have started playing `{song.name}`")
  else:
    song = await player.queue(url, search=True)
    await ctx.send(f"`{song.name}` has been added to playlist")
                 
  
  












@bot.command()
@commands.has_permissions(administrator=True)
async def mute(ctx, member: discord.Member, *, reason=None): 
    mute_role = discord.utils.get(ctx.guild.roles, id="MODERATOR_ROLE_ID") # enter the moderator or administrator role id
    await member.add_roles(mute_role)
    embed = discord.Embed(color=discord.Color.blurple())
    embed.set_author(name = f"{member.name}#{discriminator} has been muted", icon_url=member.avatar)
    embed.timestamp = datetime.now()
    msg=await ctx.send(embed=embed)
    embed2 = discord.Embed(title ="🔇You have been muted from the server.",description=f"**Reason: `{reason}` \n\nTo contact the moderators, type message below ⬇️\n\nOur moderators will contact you shortly.**", color=discord.Color.red())
    embed2.timestamp = datetime.now()
    await member.send(embed=embed2)
    await asyncio.sleep(15)
    await msg.delete()

@bot.command()
@commands.has_permissions(administrator=True)
async def unmute(ctx, member: discord.Member):
    mute_role = discord.utils.get(ctx.guild.roles, id="YOUR_ROLE_ID") # Enter your role id    
    if mute_role in member.roles:
        await member.remove_roles(mute_role)
        embed=discord.Embed(color=discord.Color.green())
        embed.set_author(name=f"{member.name}#{member.discriminator} has been unmuted.", icon_url=member.avatar)
        embed.timestamp = datetime.now()
        msg=await ctx.send(embed=embed)
        embed2=discord.Embed(description="**🎙️You have been Unmuted from the server.**", color=discord.Color.green())
        await member.send(embed=embed2)
        await asyncio.sleep(10)
        await msg.delete()
    else:
        embed2=discord.Embed(color=discord.Color.dark_grey())
        embed2.set_author(name=f"{member.name}#{member.discriminator} is not currently muted.", icon_url=member.avatar)

        msg=await ctx.send(embed=embed2)
        await asyncio.sleep(10)
        await msg.delete()

@mute.error
@unmute.error
async def command_error(ctx, error):
    if isinstance(error, commands.MissingPermissions):
        embed=discord.Embed(description="You do not have the permission to use this command.", color=discord.Color.brand_red())
        msg=await ctx.send(embed=embed)
        await asyncio.sleep(10)
        await msg.delete()
    else:
        embed2=discord.Embed(description="❌❗An error occured while processing the command.", color=discord.Color.dark_red())
        msg2=await ctx.send(embed=embed2)
        await asyncio.sleep(10)
        await msg2.delete()



@bot.command()
@commands.has_permissions(administrator=True)
async def warn(ctx, user: discord.User, *, reason=None):
  embed = discord.Embed(title=f"💢{user.name}#{user.discriminator} has been warned!", description=f"Reason: `{reason}`", color=discord.Color.red())
  embed.set_author(icon_url=user.avatar)
  embed.timestamp = datetime.now()
  embed2 = discord.Embed(title="💢You have been warned!!", description=f"Reason: `{reason}`\n\n *You can contact the moderators by typing message down below⬇️\n Our moderators will contact you shortly.*", color=discord.Color.red())
  embed2.set_author(name=user.guild.name, icon_url=user.guild.icon)
  embed2.timestamp = datetime.now()
  await ctx.send(embed=embed)
  await user.send(embed=embed2)

@warn.error
async def command_error(ctx, error):
    if isinstance(error, commands.MissingPermissions):
        embed=discord.Embed(description="You do not have the permission to use this command.", color=discord.Color.brand_red())
        msg=await ctx.send(embed=embed)
        await asyncio.sleep(10)
        await msg.delete()
    else:
        embed2=discord.Embed(description="❌❗An error occured while processing the command.", color=discord.Color.dark_red())
        msg2=await ctx.send(embed=embed2)
        await asyncio.sleep(10)
        await msg2.delete()
  
    
  
  





      
#Enter your bot token below....
bot.run('YOUR_BOT_TOKEN') 

#embed styling:
'''embed.timestamp = datetime.datetime.utcnow()
   timestamp=ctx.message.created_at
   embed.set_footer(text='\u200b',icon_url="https://i.imgur.com/uZIlRnK.png")'''

#status setting:
'''# Setting `Playing ` status
await bot.change_presence(activity=discord.Game(name="a game"))

# Setting `Streaming ` status
await bot.change_presence(activity=discord.Streaming(name="My Stream", url=my_twitch_url))

# Setting `Listening ` status
await bot.change_presence(activity=discord.Activity(type=discord.ActivityType.listening, name="a song"))

# Setting `Watching ` status
await bot.change_presence(activity=discord.Activity(type=discord.ActivityType.watching, name="a movie"))'''
