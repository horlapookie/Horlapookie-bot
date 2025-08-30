import config from '../config.js';

const commandInfos = {
  hangman: `🎮 Hangman Game

🔹 ?hangman start : Start a new game
🔹 Guess letters by typing single alphabets
🔹 ?hangman data : Check your wins and losses
⚠️ Limited guesses before you're hanged!`,

  ban: `🚫 Ban Command

🔹 ?ban @user or reply to ban them
🔹 Only bot owner or admins can use this
🔒 Banned users can't use bot commands`,

  unban: `✅ Unban Command

🔹 ?unban @user or reply to unban them
🔹 Only bot owner or admins can use this`,

  help: `📜 Help Command

🔹 ?menu : Lists all available commands
🔹 ?info <command> : Get info about a command`,

  kick: `👢 Kick Command

🔹 ?kick @user or reply to remove from group
🔹 Admins or bot owner only`,

  announce: `📢 Announce Command

🔹 ?announce <msg> : Tag all with your announcement
🔹 Admins and bot owner only`,

  tagall: `👥 Tagall Command

🔹 ?tagall : Tags all group members`,

  uptime: `⏱️ Uptime Command

🔹 ?uptime : Shows how long the bot has been running`,

  warn: `⚠️ Warn Command

🔹 ?warn @user or reply to warn
🔹 3 warnings may result in ban`,

  warnlist: `📋 Warnlist Command

🔹 ?warnlist : Shows all warned users`,

  banlist: `📵 Banlist Command

🔹 ?banlist : Shows all banned users`,

  insult: `😈 Insult Command

🔹 ?insult @user : Sends a humorous insult`,

  lyrics: `🎵 Lyrics Command

🔹 ?lyrics <artist> <song> : Fetches lyrics from Genius`,

  profile: `👤 Profile Command

🔹 ?profile : View your profile saved in bot`,

  joke: `😂 Joke Command

🔹 ?joke : Sends a random joke`,

  promote: `⭐ Promote Command

🔹 ?promote @user : Promote user to admin`,

  demote: `🔻 Demote Command

🔹 ?demote @user : Demote an admin`,

  translate: `🌐 Translate Command

🔹 ?translate <lang_code> <text> : Translate to specified language`,

  xvideos: `📹 Xvideos Command

🔹 ?xvideos <query> : Search and download videos
🔹 Choose quality before downloading`,

  sticker: `🎨 Sticker Command

🔹 ?sticker : Turn image/video into sticker`,

  viewonce: `👁️ View Once Command

🔹 ?vv : View once media as normal`,

  "gpt-3": `🤖 GPT-3 Command

🔹 ?gpt-3 <question> : Ask AI-powered question using GPT`,

  answer: `📝 Answer Command

🔹 ?answer <text> : Answer active trivia`,

  myscore: `🏅 My Score Command

🔹 ?myscore : Shows your trivia stats`,

  trivia: `🧠 Trivia Command

🔹 ?trivia : Starts a trivia game`,

  ping: `🏓 Ping Command

🔹 ?ping : Bot response test`,

  time: `⏰ Time Command

🔹 ?time : Shows current server time`,

  welcome: `👋 Welcome Command

🔹 ?welcome on/off : Toggle welcome messages`,

  lock: `🔒 Lock Command

🔹 ?lock : Lock group for non-admins`,

  unlock: `🔓 Unlock Command

🔹 ?unlock : Unlock group for everyone`,

  roll: `🎲 Roll Command

🔹 ?roll : Random dice roll`,

  screenshot: `📸 Screenshot Command

🔹 ?screenshot <url> : Capture website screenshot`,

  quote: `💬 Quote Command

🔹 ?quote : Sends an inspirational quote`,

  delete: `🗑️ Delete Command

🔹 ?delete : Delete replied message (bot only)`,

  log: `📑 Log Command

🔹 ?log : Shows recent logs`,

  yt: `📺 YouTube Command

🔹 ?yt <url or search> : Download video/audio from YouTube`,

  reactionhelp: `😄 Reaction Help Command

🔹 ?reactionhelp : Lists all available reaction keywords with emojis`,

  reactions: `🤖 Reactions Toggle Command

🔹 ?reactions : Enables or disables automatic group reactions`,

  setusername: `✏️ Set Username Command

🔹 ?setusername <name> : Sets your display name in the bot`,

  userinfo: `ℹ️ User Info Command

🔹 ?userinfo : Shows your info like username, ID, warnings`,

  echo: `🔁 Echo Command

🔹 ?echo <text> : Bot repeats what you say`,

  fap: `🔞 Fap Command

🔹 ?fap : Sends NSFW content (if enabled)`,

  porno: `🔞 Porno Command

🔹 ?porno : Fetch short random TikPornTok video (under 5 mins)`,

  pinterest: `📌 Pinterest Command

🔹 ?pinterest <query> : Fetch random images from Pinterest`,

  tiktok: `🎵 TikTok Command

🔹 ?tiktok audio|video <name or link> : Download TikTok video or audio`,

  tik: `🎵 Tik Command (Alias)

🔹 ?tik audio|video <name or link> : Download TikTok content`,

  xget: `📥 Xget Command

🔹 ?xget <link> [quality] : Download Xvideos video
🔹 If no quality provided, options will be shown`,

  quoteanime: `✨ Anime Quote Command

🔹 ?quoteanime : Sends a random anime quote`,

  mod: `🛡️ Moderator List

🔹 ?mod : Show current mods`,

  addmod: `➕ Add Moderator

🔹 ?addmod @user : Grant mod access`,

  rmmod: `➖ Remove Moderator

🔹 ?rmmod @user : Remove mod access`,

  ib: `✨ About Bot Command

🔹 ?ib : Shows the bot origin and creator info`,

  modhelp: `🛠️ Moderator Help

🔹 ?modhelp : Show all mod-only commands`,

  masterpiece: `🖼️ Masterpiece Command

🔹 ?masterpiece <prompt> : Generate artwork from text`,

  wallpaper: `🖼️ Wallpaper Command

🔹 ?wallpaper <query> : Get a random wallpaper`,

  dictionary: `📖 Dictionary Command

🔹 ?dictionary <word> : Get meaning, pronunciation and examples
🔹 ?dict <word> : Alias for dictionary
🔹 ?define <word> : Alias for dictionary
🔹 ?meaning <word> : Alias for dictionary`,

  save: `💾 Save Command

🔹 ?save : Save replied status message
🔹 Works with text, image, and video statuses
🔹 Saves to current chat`,

  shorten: `🔗 URL Shortener

🔹 ?shorten <url> : Shorten any URL using TinyURL
🔹 Shows character savings and creation time`,

  expand: `🔍 URL Expander

🔹 ?expand <shortened_url> : Expand shortened URLs
🔹 Shows original destination and status`,

  qrcode: `📱 QR Code Generator

🔹 ?qrcode <text or url> : Generate QR code
🔹 Creates 500x500px QR code image`,

  base64: `🔐 Base64 Encoder/Decoder

🔹 ?base64 encode <text> : Encode text to base64
🔹 ?base64 decode <base64> : Decode base64 to text`,

  github: `🐙 GitHub User Info

🔹 ?github <username> : Get GitHub user information
🔹 Shows profile stats and repositories`,

  gitrepo: `📁 GitHub Repository

🔹 ?gitrepo <github_url> : Get repository info and download zip
🔹 Downloads repository as zip file`,

  gittrending: `🔥 GitHub Trending

🔹 ?gittrending : Shows trending repositories
🔹 Popular repos from GitHub trending page`,

  gitstats: `📊 GitHub User Stats

🔹 ?gitstats <username> : Get detailed user statistics
🔹 Shows contributions and activity`,

  gitcommits: `💾 GitHub Commits

🔹 ?gitcommits <username/repo> : Get recent commits
🔹 Shows latest repository commits`,

  urlpreview: `🌐 URL Preview

🔹 ?urlpreview <url> : Get website preview with title and description
🔹 Shows site information and thumbnail if available`,

  urlcheck: `🔍 URL Safety Check

🔹 ?urlcheck <url> : Check if URL is safe and accessible
🔹 Shows response time, status, and safety information`,

  hash: `🔐 Hash Generator

🔹 ?hash <algorithm> <text> : Generate hash from text
🔹 Supported: md5, sha1, sha256, sha512`,

  telegraph: `📤 Telegraph Uploader

🔹 ?telegraph : Upload media to Telegraph (reply to image/video/document)
🔹 ?tg : Alias for telegraph command
🔹 Creates permanent links for your media files
🔹 Supports images, videos, documents, and audio files`,

  tg: `📤 Telegraph Uploader (Alias)

🔹 ?tg : Upload media to Telegraph (reply to image/video/document)
🔹 ?telegraph : Full command name
🔹 Creates permanent links for your media files
🔹 Supports images, videos, documents, and audio files`,

  fire: `🔥 Fire Logo Creator

🔹 ?fire <text> : Create fire text effect logo
🔹 ?firelogo <text> : Alias for fire command
🔹 Transform your text into flaming logo effects
🔹 Example: ?fire YAMAL`,

  firelogo: `🔥 Fire Logo Creator (Alias)

🔹 ?firelogo <text> : Create fire text effect logo
🔹 ?fire <text> : Main command
🔹 Transform your text into flaming logo effects
🔹 Example: ?firelogo YAMAL`,

  neon: `✨ Neon Logo Creator

🔹 ?neon <text> : Create neon light text effect logo
🔹 ?neonlogo <text> : Alias for neon command
🔹 Transform your text into glowing neon effects
🔹 Example: ?neon YAMAL`,

  neonlogo: `✨ Neon Logo Creator (Alias)

🔹 ?neonlogo <text> : Create neon light text effect logo
🔹 ?neon <text> : Main command
🔹 Transform your text into glowing neon effects
🔹 Example: ?neonlogo YAMAL`,

  attp: `🎨 ATTP Text to Sticker

🔹 ?attp <text> : Convert text to sticker format
🔹 Creates animated text stickers from your input
🔹 Perfect for custom sticker creation
🔹 Example: ?attp Hello World`,

  biblelist: `📖 Bible Books List

🔹 ${config.prefix}biblelist : Display complete list of Holy Bible books
🔹 ${config.prefix}bible-list : Alias for biblelist command
🔹 ${config.prefix}holybooks : Alias for biblelist command
🔹 Shows all Old Testament and New Testament books with numbers
🔹 Perfect reference for Bible study and verse lookup`,

  "bible-list": `📖 Bible Books List (Alias)

🔹 ${config.prefix}bible-list : Display complete list of Holy Bible books
🔹 ${config.prefix}biblelist : Main command
🔹 Shows all Old Testament and New Testament books with numbers
🔹 Perfect reference for Bible study and verse lookup`,

  holybooks: `📖 Holy Books List (Alias)

🔹 ${config.prefix}holybooks : Display complete list of Holy Bible books
🔹 ${config.prefix}biblelist : Main command
🔹 Shows all Old Testament and New Testament books with numbers
🔹 Perfect reference for Bible study and verse lookup`,

  character: `🔮 Character Analysis

🔹 ${config.prefix}character : Analyze mentioned user's character
🔹 Reply to someone's message or mention them
🔹 Generates random personality traits and percentages
🔹 Fun command - not to be taken seriously!`,

  crash: `☠️ Crash Command (Self Mode Only)

🔹 ${config.prefix}crash <number> : Send crash message to target
🔹 Only available in SELF mode
🔹 Owner only command
🔹 Example: ${config.prefix}crash 234xxx
⚠️ Use responsibly - This is a destructive command!`,

  vv2: `👁️ View Once Revealer V2 (Self Mode Only)

🔹 ?vv2 : Reveal view once messages
🔹 ?viewonce2 : Alias command
🔹 ?reveal2 : Alias command
🔹 Reply to a view once message to reveal it
🔹 Supports images, videos, and audio
🔹 Only available in SELF mode`,

  gta: `🛰️ GTA Image Generator

🔹 ?gta <image_url> : Convert image to GTA style
🔹 Requires a valid image URL
🔹 Creates GTA-style artwork from your image
🔹 Example: ?gta https://example.com/image.jpg`,

  wallpaper2: `🖼️ Enhanced Wallpaper Command

🔹 ?wallpaper2 <search_term> : Get HD wallpapers
🔹 ?wallpaper2 : Random wallpaper if no search term
🔹 Sources from Unsplash for high quality
🔹 1080x1920 resolution optimized for mobile
🔹 Example: ?wallpaper2 nature landscape`,

  canva: `🎨 Canvacord Image Effects

🔹 ?canva <effect> : Apply image effects
🔹 Available effects: shit, wasted, wanted, trigger, trash, rip, sepia, rainbow, hitler, invert, jail, affect, beautiful, blur, circle, facepalm, greyscale, joke
🔹 Can also use effects directly: ?<effect>
🔹 Reply to an image for best results
🔹 Example: ?canva wasted or ?blur`,

  public: `🌐 Public Mode

🔹 ?public : Switch bot to public mode
🔹 Moderator only command
🔹 Everyone can use bot commands in this mode`,

  self: `🤖 Self Mode

🔹 ?self : Switch bot to self mode
🔹 Moderator only command
🔹 Only bot's own messages are processed in this mode
🔹 Enables access to self commands like crash`,

  hacker: `👨‍💻 Hacker Logo Creator

🔹 ?hacker <text> : Create anonymous hacker style logo
🔹 Example: ?hacker YAMAL
🔹 Creates cyan neon hacker-style text effect`,

  dragonball: `🐉 Dragon Ball Logo Creator

🔹 ?dragonball <text> : Create Dragon Ball style text effect
🔹 Example: ?dragonball YAMAL
🔹 Transform your text into Dragon Ball Z style`,

  naruto: `⛩ Naruto Logo Creator

🔹 ?naruto <text> : Create Naruto Shippuden style logo
🔹 Example: ?naruto YAMAL
🔹 Transform your text into Naruto style`,

  didong: `📱 Didong Logo Creator

🔹 ?didong <text> : Create phone-style logo effect
🔹 Example: ?didong YAMAL
🔹 Create Vietnamese-style phone logo`,

  wall: `🧱 Wall Logo Creator

🔹 ?wall <text> : Create break wall text effect
🔹 Example: ?wall YAMAL
🔹 Make your text appear broken through a wall`,

  summer: `🌞 Summer Logo Creator

🔹 ?summer <text> : Create sunset light text effect
🔹 Example: ?summer YAMAL
🔹 Transform your text with summer vibes`,

  neonlight: `💡 Neon Light Logo Creator

🔹 ?neonlight <text> : Create glowing neon light effect
🔹 Example: ?neonlight YAMAL
🔹 Make your text glow with neon lights`,

  greenneon: `🟢 Green Neon Logo Creator

🔹 ?greenneon <text> : Create green neon text effect
🔹 Example: ?greenneon YAMAL
🔹 Transform your text into green neon`,

  glitch: `🎛️ Glitch Logo Creator

🔹 ?glitch <text> : Create impressive glitch text effect
🔹 Example: ?glitch YAMAL
🔹 Make your text look glitched and distorted`,

  devil: `😈 Devil Logo Creator

🔹 ?devil <text> : Create neon devil wings text effect
🔹 Example: ?devil YAMAL
🔹 Transform your text with devil wings`,

  boom: `💥 Boom Logo Creator

🔹 ?boom <text> : Create comic-style boom text effect
🔹 Example: ?boom YAMAL
🔹 Make your text explode with comic style`,

  water: `💦 Water Logo Creator

🔹 ?water <text> : Create water effect text
🔹 Example: ?water YAMAL
🔹 Transform your text with water effects`,

  snow: `❄️ Snow Logo Creator

🔹 ?snow <text> : Create beautiful 3D snow text effect
🔹 Example: ?snow YAMAL
🔹 Transform your text with snow effects`,

  transformer: `🤖 Transformer Logo Creator

🔹 ?transformer <text> : Create transformer text effect
🔹 Example: ?transformer YAMAL
🔹 Transform your text like Transformers`,

  thunder: `⚡ Thunder Logo Creator

🔹 ?thunder <text> : Create thunder text effect
🔹 Example: ?thunder YAMAL
🔹 Make your text strike like lightning`,

  harrypotter: `🧙‍♂️ Harry Potter Logo Creator

🔹 ?harrypotter <text> : Create Harry Potter text effect
🔹 Example: ?harrypotter YAMAL
🔹 Transform your text with magical Harry Potter style`,

  foggyglass: `🪟 Foggy Glass Logo Creator

🔹 ?foggyglass <text> : Write text on foggy window
🔹 Example: ?foggyglass YAMAL
🔹 Make your text appear on a foggy glass`,

  whitegold: `💫 White Gold Logo Creator

🔹 ?whitegold <text> : Create elegant white gold 3D text
🔹 Example: ?whitegold YAMAL
🔹 Transform your text into elegant white gold style`,

  lightglow: `🌟 Light Glow Logo Creator

🔹 ?lightglow <text> : Create light glow sliced text effect
🔹 Example: ?lightglow YAMAL
🔹 Make your text glow with light effects`,

  thor: `🔨 Thor Logo Creator

🔹 ?thor <text> : Create Thor logo style text effect
🔹 Example: ?thor YAMAL
🔹 Transform your text like Thor's hammer`,

  purple: `🧳 Purple Logo Creator

🔹 ?purple <text> : Create purple text effect
🔹 Example: ?purple YAMAL
🔹 Transform your text with purple colors`,

  gold: `🧚🏿‍♀️ Gold Logo Creator

🔹 ?gold <text> : Create modern gold text effect
🔹 Example: ?gold YAMAL
🔹 Transform your text into gold`,

  arena: `🥵 Arena Logo Creator

🔹 ?arena <text> : Create Arena of Valor cover style
🔹 Example: ?arena YAMAL
🔹 Transform your text for gaming`,

  incandescent: `😋 Incandescent Logo Creator

🔹 ?incandescent <text> : Create incandescent bulbs text effect
🔹 Example: ?incandescent YAMAL
🔹 Make your text glow like light bulbs`,

  sion: `🔍 Sion AI Image Analyzer

🔹 ?sion <instruction> : Analyze images with AI
🔹 ?analize <instruction> : Alias for sion
🔹 ?generate <instruction> : Alias for sion
🔹 Reply to an image with your instruction
🔹 Example: Reply to image with "?sion describe this image"
🔹 Uses Google Gemini AI for image analysis`
};

export default {
  name: 'info',
  description: 'Show detailed info about a command',
  async execute(msg, { sock, args }) {
    if (!args.length) {
      await sock.sendMessage(msg.key.remoteJid, { 
        text: '❓ Please provide a command name. Example: ?info ban' 
      }, { quoted: msg });
      return;
    }

    const cmdName = args[0].toLowerCase();

    if (!commandInfos[cmdName]) {
      await sock.sendMessage(
        msg.key.remoteJid,
        {
          text: `❌ No info found for command "${cmdName}". Use ?menu to see all commands.`,
        },
        { quoted: msg }
      );
      return;
    }

    await sock.sendMessage(
      msg.key.remoteJid,
      { text: commandInfos[cmdName] },
      { quoted: msg }
    );
  },
};