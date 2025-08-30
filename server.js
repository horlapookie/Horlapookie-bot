
// Import required modules
import express from 'express';
import http, { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import fsSync from 'fs'; // Import synchronous fs module
import { v4 as uuidv4 } from 'uuid';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import pairRouter from './api/pair.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
const PORT = 5000;

// Middleware
app.use(express.json({ limit: '10mb' }));
// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/pair', pairRouter);

// Add error handling middleware for pairing
app.use('/api/pair', (error, req, res, next) => {
  console.error('Pairing API Error:', error);
  res.status(500).json({ 
    code: 'Service temporarily unavailable',
    error: 'Please try again in a few moments' 
  });
});

// Store active bot instances and terminal sessions
const activeBots = new Map();
const terminalSessions = new Map(); // Store user sessions by bot ID
const commandHistory = new Map(); // Store command history per bot ID

// Bot instance class
class BotInstance {
  constructor(config) {
    this.id = uuidv4();
    this.config = config;
    this.process = null;
    this.status = 'stopped';
    this.startTime = null;
    this.authDir = path.join(__dirname, 'instances', this.id);
    this.sessionFile = path.join(this.authDir, 'SESSION-ID');
    this.configFile = path.join(this.authDir, 'config.js');
    this.historyFile = path.join(this.authDir, 'history.json');
  }

  async initialize() {
    // Create instance directory
    if (!fsSync.existsSync(this.authDir)) {
      fsSync.mkdirSync(this.authDir, { recursive: true });
    }

    // Create session file
    fsSync.writeFileSync(this.sessionFile, this.config.sessionId);

    // Initialize command history
    if (!commandHistory.has(this.id)) {
      commandHistory.set(this.id, []);
    }

    // Load existing history
    try {
      if (fsSync.existsSync(this.historyFile)) {
        const historyData = JSON.parse(fsSync.readFileSync(this.historyFile, 'utf8'));
        commandHistory.set(this.id, historyData);
      }
    } catch (error) {
      console.error(`Error loading history for bot ${this.id}:`, error);
    }

    // Create custom config file
    const configContent = `export default {
  // Bot configuration
  prefix: '${this.config.prefix}',
  ownerNumber: '${this.config.ownerNumber}',
  botName: '${this.config.botName || 'WhatsApp Bot'}',
  ownerName: '${this.config.ownerName || 'Bot Owner'}',
  sessionId: 'instance-${this.id}',
  instanceId: '${this.id}',
  BOOM_MESSAGE_LIMIT: 50,

  // OpenAI API configuration
  openaiApiKey: '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',

  // Giphy API configuration
  giphyApiKey: 'qnl7ssQChTdPjsKta2Ax2LMaGXz303tq',

  // Gemini API configuration
  geminiApiKey: 'AIzaSyAkxSdt7V5rEn6rQ_UyAVMANNgYvI75H2g',

  // Imgur API configuration
  imgurClientId: '546c25a59c58ad7',

  // Copilot API configuration
  copilotApiKey: '2751bab7e73e43e7b89fce12e05d8c19.9375722d01448b74',
  FOOTBALL_API_KEY: '7b6507c792f74a2b9db41cfc8fd8cf05',
};`;

    fsSync.writeFileSync(this.configFile, configContent);
  }

  // Add command to history
  addCommandToHistory(command, response, sender) {
    const historyEntry = {
      command: command,
      response: response,
      timestamp: new Date().toISOString(),
      sender: sender,
      id: Date.now()
    };

    let history = commandHistory.get(this.id) || [];
    history.unshift(historyEntry); // Add to beginning

    // Keep only last 100 commands
    if (history.length > 100) {
      history = history.slice(0, 100);
    }

    commandHistory.set(this.id, history);

    // Save to file
    try {
      fsSync.writeFileSync(this.historyFile, JSON.stringify(history, null, 2));
    } catch (error) {
      console.error(`Error saving history for bot ${this.id}:`, error);
    }
  }

  // Get command history
  getCommandHistory() {
    return commandHistory.get(this.id) || [];
  }

  async start() {
    if (this.process) {
      this.stop();
    }

    try {
      // Set environment variables for the bot instance
      const env = {
        ...process.env,
        BOT_INSTANCE_ID: this.id,
        BOT_AUTH_DIR: this.authDir,
        BOT_SESSION_FILE: this.sessionFile,
        BOT_CONFIG_FILE: this.configFile,
        BOT_PREFIX: this.config.prefix,
        BOT_OWNER: this.config.ownerNumber,
        BOT_NAME: this.config.botName || 'WhatsApp Bot'
      };

      this.process = spawn('node', ['index.js'], {
        env,
        cwd: __dirname,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      this.status = 'starting';
      this.startTime = new Date();

      // Handle process events
      this.process.on('spawn', () => {
        console.log(`Bot ${this.id} started successfully`);
        this.status = 'online';
      });

      this.process.on('error', (error) => {
        console.error(`Bot ${this.id} error:`, error);
        this.status = 'error';
      });

      this.process.on('exit', (code) => {
        console.log(`Bot ${this.id} exited with code ${code}`);
        this.status = 'stopped';
        this.process = null;
      });

      // Log bot output and emit to WebSocket clients
      this.process.stdout.on('data', (data) => {
        const logMessage = data.toString();
        console.log(`[Bot ${this.id}] ${logMessage}`);
        this.emitToTerminalSessions('stdout', logMessage);
        
        // Parse command history from logs
        this.parseCommandFromLog(logMessage);
      });

      this.process.stderr.on('data', (data) => {
        const logMessage = data.toString();
        console.error(`[Bot ${this.id} ERROR] ${logMessage}`);
        this.emitToTerminalSessions('stderr', logMessage);
      });

      return true;
    } catch (error) {
      console.error(`Failed to start bot ${this.id}:`, error);
      this.status = 'error';
      return false;
    }
  }

  // Parse commands from bot logs
  parseCommandFromLog(logMessage) {
    try {
      // Parse different log formats for commands
      const patterns = [
        /\[DM\]\s+(\d+):\s*>\s*(.+)/,           // Direct message pattern
        /\[GROUP\]\s+(.+?):\s+(\d+)\s*>\s*(.+)/, // Group message pattern
        /\[COMMAND\]\s+(.+?)\s*->\s*(.+)/,       // Command pattern
        /\[SENT\]\s+To\s+(\d+):\s*(.+)/         // Response pattern
      ];

      for (const pattern of patterns) {
        const match = logMessage.match(pattern);
        if (match) {
          let command, response, sender;
          
          if (pattern.source.includes('DM')) {
            sender = match[1];
            command = match[2];
            response = 'Processing...';
          } else if (pattern.source.includes('GROUP')) {
            sender = match[2];
            command = match[3];
            response = 'Processing...';
          } else if (pattern.source.includes('COMMAND')) {
            command = match[1];
            response = match[2];
            sender = 'User';
          } else if (pattern.source.includes('SENT')) {
            response = match[2];
            command = 'Previous command';
            sender = match[1];
          }

          if (command && command.trim().startsWith(this.config.prefix)) {
            this.addCommandToHistory(command.trim(), response, sender);
            break;
          }
        }
      }
    } catch (error) {
      // Ignore parsing errors
    }
  }

  stop() {
    if (this.process) {
      this.process.kill('SIGTERM');
      this.process = null;
      this.status = 'stopped';
      return true;
    }
    return false;
  }

  restart() {
    this.stop();
    setTimeout(() => {
      this.start();
    }, 2000);
  }

  getUptime() {
    if (!this.startTime || this.status !== 'online') return '0 seconds';

    const uptimeMs = Date.now() - this.startTime.getTime();
    const hours = Math.floor(uptimeMs / (1000 * 60 * 60));
    const minutes = Math.floor((uptimeMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((uptimeMs % (1000 * 60)) / 1000);

    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds} seconds`;
  }

  // Emit log messages to connected terminal sessions for this bot
  emitToTerminalSessions(type, message) {
    const sessions = terminalSessions.get(this.id);
    if (sessions) {
      sessions.forEach(socket => {
        socket.emit('terminal-output', {
          type: type,
          message: message,
          timestamp: new Date().toISOString(),
          botId: this.id
        });
      });
    }
  }

  getStatus() {
    return {
      id: this.id,
      status: this.status,
      uptime: this.getUptime(),
      startTime: this.startTime,
      lastActivity: this.lastActivity || this.startTime,
      config: {
        prefix: this.config.prefix,
        ownerNumber: this.config.ownerNumber,
        botName: this.config.botName || 'WhatsApp Bot',
        ownerName: this.config.ownerName || 'Bot Owner'
      }
    };
  }

  updateActivity() {
    this.lastActivity = new Date();
  }

  isInactive() {
    if (!this.lastActivity && !this.startTime) return true;

    const lastActiveTime = this.lastActivity || this.startTime;
    const weekInMs = 7 * 24 * 60 * 60 * 1000; // 7 days

    return (Date.now() - lastActiveTime.getTime()) > weekInMs;
  }

  cleanup() {
    try {
      // Stop the bot process
      this.stop();

      // Remove auth directory and files
      if (fsSync.existsSync(this.authDir)) {
        fsSync.rmSync(this.authDir, { recursive: true, force: true });
        console.log(`Cleaned up inactive bot ${this.id}`);
      }

      // Clear command history
      commandHistory.delete(this.id);

      return true;
    } catch (error) {
      console.error(`Error cleaning up bot ${this.id}:`, error);
      return false;
    }
  }
}

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/pair.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pair.html'));
});

// Deploy a new bot
app.post('/api/deploy', async (req, res) => {
  try {
    const { sessionId, ownerNumber, prefix, botName, ownerName } = req.body;

    // Validation
    if (!sessionId || !ownerNumber || !prefix) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate session ID format (basic base64 check)
    try {
      const decoded = Buffer.from(sessionId, 'base64').toString();
      JSON.parse(decoded); // Just check if it's valid JSON
    } catch (error) {
      return res.status(400).json({ error: 'Invalid session ID format - must be valid base64 encoded JSON' });
    }

    // Validate phone number
    if (!/^\d{10,15}$/.test(ownerNumber.replace(/\s/g, ''))) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }

    // Create new bot instance
    const bot = new BotInstance({
      sessionId,
      ownerNumber,
      prefix,
      botName,
      ownerName
    });

    await bot.initialize();
    const started = await bot.start();

    if (started) {
      activeBots.set(bot.id, bot);

      // Update main SESSION-ID file with the new session
      fsSync.writeFileSync(path.join(__dirname, 'SESSION-ID'), sessionId);

      res.json({ 
        success: true, 
        botId: bot.id,
        redirectUrl: `/dashboard/${bot.id}`,
        message: 'Bot deployed successfully'
      });
    } else {
      res.status(500).json({ error: 'Failed to start bot' });
    }
  } catch (error) {
    console.error('Deploy error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get bot status
app.get('/api/bot/:botId/status', (req, res) => {
  const { botId } = req.params;
  const bot = activeBots.get(botId);

  if (!bot) {
    return res.status(404).json({ error: 'Bot not found' });
  }

  res.json(bot.getStatus());
});

// Stop bot
app.post('/api/bot/:botId/stop', (req, res) => {
  const { botId } = req.params;
  const bot = activeBots.get(botId);

  if (!bot) {
    return res.status(404).json({ error: 'Bot not found' });
  }

  const stopped = bot.stop();
  res.json({ success: stopped });
});

// Restart bot
app.post('/api/bot/:botId/restart', (req, res) => {
  const { botId } = req.params;
  const bot = activeBots.get(botId);

  if (!bot) {
    return res.status(404).json({ error: 'Bot not found' });
  }

  bot.restart();
  res.json({ success: true });
});

// Verify bot owner
app.post('/api/bot/:botId/verify-owner', (req, res) => {
  const { botId } = req.params;
  const { ownerNumber } = req.body;

  const bot = activeBots.get(botId);

  if (!bot) {
    return res.status(404).json({ error: 'Bot not found' });
  }

  // Verify owner number matches
  if (bot.config.ownerNumber !== ownerNumber) {
    return res.status(403).json({ error: 'Access denied. Invalid owner number.' });
  }

  // Update activity
  bot.updateActivity();

  res.json({ success: true, message: 'Owner verified' });
});

// List all bots
app.get('/api/bots', (req, res) => {
  const bots = Array.from(activeBots.values()).map(bot => bot.getStatus());
  res.json(bots);
});

// Get bot command history
app.get('/api/bot/:botId/history', (req, res) => {
  const { botId } = req.params;
  const bot = activeBots.get(botId);

  if (!bot) {
    return res.status(404).json({ error: 'Bot not found' });
  }

  const history = bot.getCommandHistory();
  res.json({ history });
});

// Send bot IDs to existing users
app.post('/api/notify-existing-users', async (req, res) => {
  try {
    await notifyExistingUsers();
    res.json({ success: true, message: 'Bot ID notifications prepared for existing users' });
  } catch (error) {
    console.error('Error notifying existing users:', error);
    res.status(500).json({ error: 'Failed to prepare notifications' });
  }
});

// Serve dashboard page
app.get('/dashboard/:botId', (req, res) => {
  const { botId } = req.params;
  const bot = activeBots.get(botId);

  if (!bot) {
    return res.status(404).send(`
      <h1>Bot Not Found</h1>
      <p>Bot ID ${botId} was not found or has been stopped.</p>
      <a href="/">← Go back to deploy a new bot</a>
    `);
  }

  res.sendFile(path.join(__dirname, 'public', 'bot-manager.html'));
});

// Serve terminal page
app.get('/terminal', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'terminal.html'));
});

// Serve terminal page with bot ID
app.get('/terminal/:botId', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'terminal.html'));
});

// Serve menu page
app.get('/menu', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'menu.html'));
});

// Serve menu page with bot ID
app.get('/menu/:botId', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'menu.html'));
});

// Serve music player page
app.get('/music-player', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'music-player.html'));
});

// Get bot commands
app.get('/api/bot/:botId/commands', (req, res) => {
  const { botId } = req.params;
  const bot = activeBots.get(botId);

  if (!bot) {
    return res.status(404).json({ error: 'Bot not found' });
  }

  // Return comprehensive command list
  const commands = {
    "🛠️ Basic Tools": ["ping", "uptime", "botinfo", "userinfo", "profile", "setusername", "echo", "log", "time"],
    "👥 Group Management": ["welcome", "tagall", "announce", "del", "groupinfo", "kick", "promote", "demote", "lock", "warn", "getallmembers", "link", "remove", "info", "antilink", "antibot", "group", "left", "gname", "gdesc", "gpp", "tag", "hidetag", "htag", "automute", "autounmute", "fkick", "nsfw", "broadcast", "unlock", "anti-delete", "antidelete", "anti_delete"],
    "🏦 Trading": ["currencylist", "forex", "fxstatus", "fxpairs", "stocktickers", "fxexchange"],
    "🤖 AI Commands": ["gpt-3", "copilot", "gpt-4", "gpt4", "toxic-lover", "toxic", "lover", "bing4", "bing", "bingimg", "ai2", "chatgpt2", "gpt2", "gpt-all", "gptall", "allgpt", "translate", "google", "gta", "sion", "analize", "generate"],
    "🎙️ Voice & Audio": ["aivoice", "voice-clone", "celebrity-voice", "ai-voice", "tts", "speak", "voice", "stt", "speech", "transcribe", "audio"],
    "🎚️ Audio Effects": ["deep", "bass", "reverse", "slow", "smooth", "tempo", "nightcore"],
    "🎮 Games & Fun": ["hangman", "hack", "animequote", "trivia", "myscore", "answer", "roll", "reactionhelp", "reactions", "joke", "insult", "character", "riddle"],
    "🎨 Creativity & Art": ["wallpaper", "wallpaper2", "masterpiece", "quote", "quoteanime", "ranime"],
    "👤 Personal Stuff": ["getpp", "profilepic", "pp", "avatar", "userinfo", "profile"],
    "✨ Image Effects": ["blur", "circle", "greyscale", "sepia", "invert", "rainbow", "canva", "canvas"],
    "🏷️ Sticker Creator": ["sticker", "s", "simage", "attp", "sticker2", "scrop2", "take2", "write2", "photo2", "url2", "emomix", "emojimix"],
    "🎵 Music & Media": ["play", "lyrics", "yt", "tiktok", "tik", "video", "vid", "ytv", "spotifylist", "spotifysearch", "splaylist", "song", "musicdoc", "ytmp3doc", "audiodoc", "mp3doc", "shazam"],
    "📥 Downloaders": ["igdl", "fbdl", "fbdl2", "tiktoklite", "ytdl"],
    "🔞 NSFW": ["xvideos", "xx2", "xxv1", "porno", "xxv2", "xx1", "fap", "hentai", "xvideo", "hwaifu", "trap", "hneko", "blowjob", "hentaivid", "xx"],
    "🐛 Bug Commands": ["bug", "crash", "loccrash", "amountbug", "crashbug", "pmbug", "delaybug", "trollybug", "docubug", "unlimitedbug", "bombug", "lagbug", "bugmenu", "sir-horlapookie-crush"],
    "🔐 Encryption & Security": ["decrypt", "encrypt", "hash", "base64"],
    "🐙 GitHub Tools": ["github", "gitrepo", "gittrending", "gitstats", "gitcommits", "gitissues", "gitpulls", "gitreleases", "gitforks", "gitsearch"],
    "🎨 Logo Creators": ["fire", "neon", "firelogo", "neonlogo", "logo", "hacker", "dragonball", "naruto", "didong", "wall", "summer", "neonlight", "greenneon", "glitch", "devil", "boom", "water", "snow", "transformer", "thunder", "harrypotter", "foggyglass", "whitegold", "lightglow", "thor", "purple", "gold", "arena", "incandescent"],
    "🔍 Search & Info": ["wikipedia", "pinterest", "igstalk", "dictionary", "dict", "define", "meaning", "images", "shazam", "imdb"],
    "💡 Utility Tools": ["info", "menu", "vv", "delete", "warn", "save", "telegraph", "tg", "blocklist", "listblock", "blacklist", "blocked"],
    "🔗 URL Tools": ["shorten", "expand", "qrcode", "base64", "urlpreview", "urlcheck", "hash"],
    "🙏 Religious & Spiritual": ["biblelist", "bible", "quran", "surah"],
    "🔄 Bot Modes": ["public", "self", "mode"],
    "ℹ️ Bot Info": ["xmd", "alive", "botstats", "stats", "info", "help", "online", "status", "anounce", "ib"],
    "🔧 Other Commands": ["announce", "artlist", "del", "movie", "quotesAnime", "wikimedia", "trt2"],
    "🔄 Automation Commands": ["autoviewmessage", "autoviewstatus", "autoreact", "autotyping", "autorecording"],
    "🛡️ Anti-Commands": ["antilinkwarn", "antilinkkick", "antideletemessages", "antivoicecall", "antivideocall", "antibadword", "antilink", "linkdetector"],
    "📁 File Management": ["files", "datafile"],
    "⚙️ Self Settings": ["settings"],
    "🤖 Self Mode Commands": ["crash", "vv2", "block", "unblock", "fullpp", "updatepp", "ppfull"],
    "📸 Screenshots": ["screenshot", "ss", "sshot", "screenswidth", "screenscrop", "png", "jpg", "maxage", "noanimate", "wait", "viewportwidth", "iphone5", "iphone6", "iphone6plus", "iphoneX", "iphone12pro", "iphone14promax", "galaxys5"],
    "🖼️ Image Search & Generation": ["imgs", "image", "messi"],
    "🔞 Hentai Commands": ["hentai", "neko", "kitsune", "trap", "blowjob", "boobs", "cum", "ahegao", "ass", "nsfw2", "ero"],
    "⚽ Football Live": ["cl_table", "cl_matchday", "cl_top_scorer", "cl_news", "cl_highlights", "wc_table", "wc_matchday", "wc_top_scorer", "wc_news", "wc_highlights", "liga_portugal_table", "liga_portugal_matchday", "liga_portugal_top_scorer", "liga_portugal_top_assist", "liga_portugal_news", "liga_portugal_highlights"],
    "🎨 Image Effects": ["blur", "circle", "greyscale", "sepia", "invert", "rainbow", "canva", "canvas", "brightness", "contrast", "negative", "flip", "rotate", "resize", "removebg", "rmbg", "removeBackground"],
    "💻 Code Runner & Tools": ["run-c++", "c++", "runc++", "run-c", "runcc", "runc", "run-java", "java", "runjava", "run-js", "node", "javascript", "run-py", "python", "runpy", "obfuscate", "obfu", "carbon", "C", "run-carbon", "scrap", "get", "find", "web", "inspectweb", "webinspect", "webscrap", "debinary", "decode", "decodebinary", "ebinary", "encode", "encodebinary"]
  };

  res.json({ commands });
});

// Search API for music/video
app.post('/api/search', async (req, res) => {
  const { query, type } = req.body;

  if (!query || !type) {
    return res.status(400).json({ error: 'Missing query or type' });
  }

  try {
    // For demonstration purposes, return sample results
    // In production, this would integrate with actual music/video APIs
    const results = type === 'music' ? [
      {
        title: `${query} - Song Result 1`,
        duration: '3:45',
        url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        thumbnail: 'https://via.placeholder.com/120x90?text=Music'
      },
      {
        title: `${query} - Song Result 2`,
        duration: '4:12',
        url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
        thumbnail: 'https://via.placeholder.com/120x90?text=Music'
      }
    ] : [
      {
        title: `${query} - Video Result 1`,
        duration: '5:30',
        url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
        thumbnail: 'https://via.placeholder.com/120x90?text=Video'
      },
      {
        title: `${query} - Video Result 2`,
        duration: '3:20',
        url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4',
        thumbnail: 'https://via.placeholder.com/120x90?text=Video'
      }
    ];

    res.json({ results });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Cleanup inactive bots function
function cleanupInactiveBots() {
  console.log('🧹 Checking for inactive bots...');

  const inactiveBots = [];

  activeBots.forEach((bot, botId) => {
    if (bot.isInactive()) {
      inactiveBots.push(botId);
    }
  });

  inactiveBots.forEach(botId => {
    const bot = activeBots.get(botId);
    if (bot && bot.cleanup()) {
      activeBots.delete(botId);
      console.log(`🗑️ Removed inactive bot: ${botId}`);
    }
  });

  if (inactiveBots.length === 0) {
    console.log('✅ No inactive bots found');
  }
}

// Function to send bot IDs to existing users
async function notifyExistingUsers() {
  const instancesDir = path.join(__dirname, 'instances');
  if (!fsSync.existsSync(instancesDir)) return;

  const existingInstances = fsSync.readdirSync(instancesDir).filter(dir => {
    const dirPath = path.join(instancesDir, dir);
    return fsSync.statSync(dirPath).isDirectory();
  });

  console.log(`🔍 Found ${existingInstances.length} existing bot instances`);

  for (const instanceId of existingInstances) {
    try {
      const configPath = path.join(instancesDir, instanceId, 'config.js');
      if (fsSync.existsSync(configPath)) {
        // Read config file to get owner number
        const configContent = fsSync.readFileSync(configPath, 'utf8');
        const ownerMatch = configContent.match(/ownerNumber:\s*['"](\d+)['"]/);
        const prefixMatch = configContent.match(/prefix:\s*['"](.+?)['"]/);
        const botNameMatch = configContent.match(/botName:\s*['"](.+?)['"]/);

        if (ownerMatch) {
          const ownerNumber = ownerMatch[1];
          const prefix = prefixMatch ? prefixMatch[1] : '?';
          const botName = botNameMatch ? botNameMatch[1] : 'WhatsApp Bot';

          // Create a notification message
          const notificationMessage = `🆔 *YOUR BOT ID NOTIFICATION*\n\n` +
            `Hi! Your ${botName} is active with the following details:\n\n` +
            `🆔 *Bot ID:* ${instanceId}\n` +
            `📱 *Owner Number:* ${ownerNumber}\n` +
            `🚀 *Command Prefix:* ${prefix}\n\n` +
            `🔐 *To monitor your bot:*\n` +
            `1. Visit the web interface\n` +
            `2. Use Bot ID: ${instanceId}\n` +
            `3. Use your number: ${ownerNumber}\n\n` +
            `✅ Save this Bot ID for future logins!`;

          console.log(`\n📤 Bot ID notification prepared for ${ownerNumber}: ${instanceId}`);

          // Store the notification (to be sent when bot connects)
          if (!global.pendingNotifications) global.pendingNotifications = new Map();
          global.pendingNotifications.set(ownerNumber, {
            instanceId,
            message: notificationMessage,
            timestamp: Date.now()
          });
        }
      }
    } catch (error) {
      console.error(`❌ Error processing instance ${instanceId}:`, error.message);
    }
  }
}

// Reconnect existing bot instances on startup
async function reconnectExistingBots() {
  console.log('🔄 Reconnecting existing bot instances...');

  const instancesDir = path.join(__dirname, 'instances');
  if (!fsSync.existsSync(instancesDir)) {
    console.log('📁 No instances directory found');
    return;
  }

  const instanceDirs = fsSync.readdirSync(instancesDir).filter(dir => {
    const dirPath = path.join(instancesDir, dir);
    return fsSync.statSync(dirPath).isDirectory();
  });

  for (const instanceId of instanceDirs) {
    try {
      const configPath = path.join(instancesDir, instanceId, 'config.js');
      const sessionPath = path.join(instancesDir, instanceId, 'SESSION-ID');

      if (fsSync.existsSync(configPath) && fsSync.existsSync(sessionPath)) {
        const configContent = fsSync.readFileSync(configPath, 'utf8');
        const sessionId = fsSync.readFileSync(sessionPath, 'utf8').trim();

        const ownerMatch = configContent.match(/ownerNumber:\s*['"]([^'"]+)['"]/);
        const prefixMatch = configContent.match(/prefix:\s*['"]([^'"]+)['"]/);
        const botNameMatch = configContent.match(/botName:\s*['"]([^'"]+)['"]/);
        const ownerNameMatch = configContent.match(/ownerName:\s*['"]([^'"]+)['"]/);

        if (ownerMatch && sessionId) {
          const bot = new BotInstance({
            sessionId,
            ownerNumber: ownerMatch[1],
            prefix: prefixMatch ? prefixMatch[1] : '?',
            botName: botNameMatch ? botNameMatch[1] : 'WhatsApp Bot',
            ownerName: ownerNameMatch ? ownerNameMatch[1] : 'Bot Owner'
          });

          bot.id = instanceId; // Use existing instance ID
          bot.authDir = path.join(instancesDir, instanceId);
          bot.sessionFile = sessionPath;
          bot.configFile = configPath;
          bot.historyFile = path.join(instancesDir, instanceId, 'history.json');

          // Load existing command history
          try {
            if (fsSync.existsSync(bot.historyFile)) {
              const historyData = JSON.parse(fsSync.readFileSync(bot.historyFile, 'utf8'));
              commandHistory.set(instanceId, historyData);
            }
          } catch (error) {
            console.error(`Error loading history for bot ${instanceId}:`, error);
            commandHistory.set(instanceId, []);
          }

          const started = await bot.start();
          if (started) {
            activeBots.set(instanceId, bot);
            console.log(`✅ Reconnected bot instance: ${instanceId} for ${ownerMatch[1]}`);
          } else {
            console.log(`❌ Failed to reconnect bot instance: ${instanceId}`);
          }
        }
      }
    } catch (error) {
      console.error(`❌ Error reconnecting instance ${instanceId}:`, error.message);
    }
  }

  console.log(`🎉 Reconnection complete. Active bots: ${activeBots.size}`);
}

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('User connected to terminal:', socket.id);

  // Handle terminal authentication
  socket.on('authenticate-terminal', (data) => {
    const { botId, phoneNumber } = data;

    // Find the bot instance by ID
    let targetBotInstance = null;
    for (const [instanceId, bot] of activeBots) {
      if (instanceId === botId || bot.id === botId) {
        targetBotInstance = bot;
        break;
      }
    }

    if (targetBotInstance && targetBotInstance.config.ownerNumber === phoneNumber) {
      // Authenticate user and add to terminal sessions
      if (!terminalSessions.has(targetBotInstance.id)) {
        terminalSessions.set(targetBotInstance.id, new Set());
      }
      terminalSessions.get(targetBotInstance.id).add(socket);

      socket.botId = targetBotInstance.id;
      socket.emit('terminal-authenticated', { 
        success: true, 
        botId: targetBotInstance.id,
        botName: targetBotInstance.config.botName 
      });

      console.log(`Terminal authenticated for bot ${targetBotInstance.id}`);
    } else {
      socket.emit('terminal-authenticated', { 
        success: false, 
        error: 'Invalid credentials or bot not found' 
      });
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    if (socket.botId) {
      const sessions = terminalSessions.get(socket.botId);
      if (sessions) {
        sessions.delete(socket);
        if (sessions.size === 0) {
          terminalSessions.delete(socket.botId);
        }
      }
    }
    console.log('User disconnected from terminal:', socket.id);
  });
});

// Start server
server.listen(PORT, '0.0.0.0', async () => {
  console.log(`🌐 Web interface running on http://0.0.0.0:${PORT}`);

  // Reconnect existing bots after server starts
  await reconnectExistingBots();

  console.log(`📱 Bot deployment service is ready!`);

  // Create instances directory
  const instancesDir = path.join(__dirname, 'instances');
  if (!fsSync.existsSync(instancesDir)) {
    fsSync.mkdirSync(instancesDir, { recursive: true });
  }

  // Notify existing users about their bot IDs
  setTimeout(notifyExistingUsers, 5000);

  // Run cleanup every 24 hours
  setInterval(() => {
    cleanupInactiveBots();
  }, 60 * 60 * 1000); // 1 hour

  // Run initial cleanup after 1 minute
  setTimeout(cleanupInactiveBots, 60000);

  // Send bot IDs to existing connected sessions
  setTimeout(() => {
    sendBotIdsToExistingSessions();
  }, 5000); // Wait 5 seconds after server start
});

// Function to send bot IDs to existing connected sessions
async function sendBotIdsToExistingSessions() {
  try {
    const instancesDir = path.join(__dirname, 'instances');
    if (!fsSync.existsSync(instancesDir)) return;

    const instanceDirs = fsSync.readdirSync(instancesDir);
    console.log(`[INFO] Found ${instanceDirs.length} existing instances`);

    for (const instanceId of instanceDirs) {
      const configPath = path.join(instancesDir, instanceId, 'config.js');
      if (fsSync.existsSync(configPath)) {
        try {
          // Read config to get owner number
          const configContent = fsSync.readFileSync(configPath, 'utf8');
          const ownerMatch = configContent.match(/ownerNumber:\s*'([^']+)'/);

          if (ownerMatch && ownerMatch[1]) {
            const ownerNumber = ownerMatch[1];
            const botId = `BOT-${instanceId}-${Date.now()}`;

            console.log(`[INFO] Generated Bot ID for existing session ${instanceId}: ${botId}`);
            console.log(`[INFO] Owner number: ${ownerNumber}`);
            console.log(`[INFO] Please use these credentials to login to the web interface:`);
            console.log(`[INFO] Number: ${ownerNumber}`);
            console.log(`[INFO] Bot ID: ${botId}`);

            // Store the bot ID in a way that can be accessed later
            global.botInstances = global.botInstances || {};
            global.botInstances[instanceId] = {
              botId: botId,
              ownerNumber: ownerNumber,
              instanceId: instanceId
            };
          }
        } catch (error) {
          console.error(`[ERROR] Failed to process instance ${instanceId}:`, error);
        }
      }
    }
  } catch (error) {
    console.error('[ERROR] Failed to send bot IDs to existing sessions:', error);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');

  // Stop all active bots
  activeBots.forEach(bot => {
    console.log(`Stopping bot ${bot.id}...`);
    bot.stop();
  });

  process.exit(0);
});
