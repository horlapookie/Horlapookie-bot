import baileysPkg from '@whiskeysockets/baileys';
const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
} = baileysPkg;

import pino from 'pino';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import config from './config.js';
import './lib/channelConfig.js'; // Import newsletter channel configuration
import axios from 'axios'; // Import axios for dictionary command
import archiver from 'archiver';
import { loadSettings, saveSettings, updateSetting, getCurrentSettings } from './lib/persistentData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COMMAND_PREFIX = config.prefix;

// Make config globally accessible
global.config = config;
global.COMMAND_PREFIX = COMMAND_PREFIX;

const MODS_FILE = path.join(__dirname, 'data', 'moderators.json');
const BANNED_FILE = path.join(__dirname, 'data', 'banned.json');
const WELCOME_CONFIG_FILE = path.join(__dirname, 'data', 'welcomeConfig.json');
const SESSION_ID_FILE = path.join(__dirname, 'SESSION-ID');


let botActive = true;

// Load persistent settings on startup
const persistentSettings = loadSettings();
let botMode = persistentSettings.botMode || 'public'; // 'public' or 'self'
global.botMode = botMode; // Make it globally accessible

// Initialize automation globals from persistent settings
global.autoViewMessage = persistentSettings.autoViewMessage || false;
global.autoViewStatus = persistentSettings.autoViewStatus || false;
global.autoReactStatus = persistentSettings.autoReactStatus || false;
global.autoReact = persistentSettings.autoReact || false;
global.autoStatusEmoji = persistentSettings.autoStatusEmoji || '❤️';
global.autoTyping = persistentSettings.autoTyping || false;
global.autoRecording = persistentSettings.autoRecording || false;

// Initialize anti-detection globals from persistent settings
global.antiLinkWarn = persistentSettings.antiLinkWarn || {};
global.antiLinkKick = persistentSettings.antiLinkKick || {};
global.antiBadWord = persistentSettings.antiBadWord || {};


let processedMessages = new Set();

let moderators = fs.existsSync(MODS_FILE)
  ? JSON.parse(fs.readFileSync(MODS_FILE))
  : [];

function saveModerators() {
  fs.writeFileSync(MODS_FILE, JSON.stringify(moderators, null, 2));
}

function loadBanned() {
  return fs.existsSync(BANNED_FILE)
    ? JSON.parse(fs.readFileSync(BANNED_FILE))
    : {};
}

let welcomeConfig = fs.existsSync(WELCOME_CONFIG_FILE)
  ? JSON.parse(fs.readFileSync(WELCOME_CONFIG_FILE))
  : {};

function saveWelcomeConfig() {
  fs.writeFileSync(WELCOME_CONFIG_FILE, JSON.stringify(welcomeConfig, null, 2));
}



// Setup auth state from SESSION-ID file or environment
async function setupAuthState() {
  let sessionData = process.env.DYNAMIC_SESSION || process.env.BOT_SESSION_DATA; // Check environment first

  if (!sessionData) {
    // Check for instance-specific session file
    const instanceSessionFile = process.env.BOT_SESSION_FILE || SESSION_ID_FILE;

    if (!fs.existsSync(instanceSessionFile)) {
      console.log(color('[ERROR] SESSION-ID file not found and no dynamic session provided!', 'red'));
      console.log(color('[INFO] Please provide session data via environment or create SESSION-ID file.', 'yellow'));
      process.exit(1);
    }

    sessionData = fs.readFileSync(instanceSessionFile, 'utf8').trim();
    if (!sessionData) {
      console.log(color('[ERROR] SESSION-ID file is empty and no dynamic session provided!', 'red'));
      process.exit(1);
    }
  }

  try {
    // Ensure sessionData is a string before parsing
    if (typeof sessionData !== 'string') {
      throw new Error('Session data is not a string.');
    }

    const parsed = JSON.parse(Buffer.from(sessionData, 'base64').toString());

    // Basic validation of session structure
    if (!parsed.noiseKey || !parsed.signedIdentityKey || !parsed.signedPreKey) {
      console.log(color('[ERROR] Invalid session structure - missing required authentication keys!', 'red'));
      console.log(color('[INFO] Please generate a new SESSION-ID with proper structure.', 'yellow'));
      process.exit(1);
    }

    console.log(color('[INFO] Session data loaded successfully', 'green'));

    // Create auth directory if it doesn't exist
    const authDir = './auth_info';
    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
    }

    // Write session data to auth files
    fs.writeFileSync(path.join(authDir, 'creds.json'), JSON.stringify(parsed, null, 2));

    // Use Baileys' built-in auth state management
    const { state, saveCreds } = await useMultiFileAuthState(authDir);
    return { state, saveCreds };
  } catch (err) {
    console.log(color(`[ERROR] Invalid session data format: ${err.message}`, 'red'));
    console.log(color('[INFO] Ensure your SESSION-ID contains valid base64-encoded JSON.', 'yellow'));
    process.exit(1);
  }
}

// Normalize JID to phone number (handles @lid JIDs)
async function normalizeJid(sock, jid, groupId) {
  if (!jid.includes('@lid')) return jid.split('@')[0];
  try {
    const groupMetadata = groupId ? await sock.groupMetadata(groupId) : null;
    const participant = groupMetadata?.participants.find(p => p.id === jid);
    return participant?.id.split('@')[0] || jid.split('@')[0];
  } catch {
    return jid.split('@')[0];
  }
}

// Color function for designed logs
const color = (text, colorCode) => {
  const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    reset: '\x1b[0m'
  };
  return colors[colorCode] ? colors[colorCode] + text + colors.reset : text;
};

// Load commands dynamically
const commands = new Map();
const selfCommands = new Map();

// Load public commands
const commandsDir = path.join(__dirname, 'commands');
const commandFiles = fs
  .readdirSync(commandsDir)
  .filter((f) => f.endsWith('.js') || f.endsWith('.cjs'));

for (const file of commandFiles) {
  try {
    let imported;
    const filePath = path.join(commandsDir, file);

    // Try to read file content to detect CommonJS syntax
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const isCommonJS = fileContent.includes('require(') || fileContent.includes('module.exports') || fileContent.includes('exports.');

    if (isCommonJS && file.endsWith('.js')) {
      // Rename .js to .cjs for CommonJS files
      const cjsPath = filePath.replace('.js', '.cjs');
      if (!fs.existsSync(cjsPath)) {
        fs.renameSync(filePath, cjsPath);
        console.log(color(`[INFO] Renamed ${file} to ${file.replace('.js', '.cjs')} for CommonJS compatibility`, 'yellow'));
      }
      // Import the renamed file
      imported = await import(`file://${cjsPath}`);
    } else {
      imported = await import(`file://${filePath}`);
    }

    const exportedCommands = imported.default;

    // Handle single command export
    if (exportedCommands && exportedCommands.name && typeof exportedCommands.execute === 'function') {
      commands.set(exportedCommands.name, exportedCommands);

      // Load aliases if they exist
      if (exportedCommands.aliases && Array.isArray(exportedCommands.aliases)) {
        for (const alias of exportedCommands.aliases) {
          commands.set(alias, exportedCommands);
          console.log(color(`[INFO] Loaded alias: ${alias} -> ${exportedCommands.name}`, 'green'));
        }
      }

      console.log(color(`[INFO] Loaded public command: ${exportedCommands.name}`, 'green'));
    }
    // Handle array of commands export (like logo.js)
    else if (Array.isArray(exportedCommands)) {
      for (const command of exportedCommands) {
        if (command && command.nomCom && typeof command.execute === 'function') {
          // Convert horla command structure to standard structure
          const standardCommand = {
            name: command.nomCom,
            description: command.description || `${command.nomCom} command`,
            category: command.categorie || 'Other',
            execute: command.execute
          };

          commands.set(command.nomCom, standardCommand);
          console.log(color(`[INFO] Loaded public command: ${command.nomCom}`, 'green'));
        }
      }
    }
    // Handle multiple named exports (like individual commands from logo.js)
    else {
      for (const [key, value] of Object.entries(imported)) {
        if (key !== 'default' && value && value.nomCom && typeof value.execute === 'function') {
          // Convert horla command structure to standard structure
          const standardCommand = {
            name: value.nomCom,
            description: value.description || `${value.nomCom} command`,
            category: value.categorie || 'Other',
            execute: value.execute
          };

          commands.set(value.nomCom, standardCommand);
          console.log(color(`[INFO] Loaded public command: ${value.nomCom}`, 'green'));
        } else if (key !== 'default' && value && value.name && typeof value.execute === 'function') {
          // Handle standard command structure too
          commands.set(value.name, value);

          // Load aliases if they exist
          if (value.aliases && Array.isArray(value.aliases)) {
            for (const alias of value.aliases) {
              commands.set(alias, value);
              console.log(color(`[INFO] Loaded alias: ${alias} -> ${value.name}`, 'green'));
            }
          }

          console.log(color(`[INFO] Loaded public command: ${value.name}`, 'green'));
        }
      }
    }

    // Special handling for logo.js file which has both named and default exports
    if (file === 'logo.js' && exportedCommands && Array.isArray(exportedCommands)) {
      for (const command of exportedCommands) {
        if (command && command.nomCom && typeof command.execute === 'function') {
          const standardCommand = {
            name: command.nomCom,
            description: command.description || `${command.nomCom} command`,
            category: command.categorie || 'Other',
            execute: command.execute
          };

          commands.set(command.nomCom, standardCommand);
          console.log(color(`[INFO] Loaded public command from logo.js: ${command.nomCom}`, 'green'));
        }
      }
    }
  } catch (err) {
    console.log(color(`[ERROR] Failed to load command ${file}: ${err.message}`, 'red'));
  }
}

// Load self commands
const selfCommandsDir = path.join(__dirname, 'commands', 'self');
if (fs.existsSync(selfCommandsDir)) {
  const selfCommandFiles = fs
    .readdirSync(selfCommandsDir)
    .filter((f) => f.endsWith('.js') || f.endsWith('.cjs'));

  for (const file of selfCommandFiles) {
    try {
      let imported;
      const filePath = path.join(selfCommandsDir, file);

      // Try to read file content to detect CommonJS syntax
      if (file.endsWith('.js')) {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const isCommonJS = fileContent.includes('require(') || fileContent.includes('module.exports') || fileContent.includes('exports.');

        if (isCommonJS) {
          // Rename .js to .cjs for CommonJS files
          const cjsPath = filePath.replace('.js', '.cjs');
          if (!fs.existsSync(cjsPath)) {
            fs.renameSync(filePath, cjsPath);
            console.log(color(`[INFO] Renamed self/${file} to self/${file.replace('.js', '.cjs')} for CommonJS compatibility`, 'yellow'));
          }
          imported = await import(`file://${cjsPath}`);
        } else {
          imported = await import(`file://${filePath}`);
        }
      } else {
        imported = await import(`file://${filePath}`);
      }

      // Handle both default export and named exports
      if (imported.default && imported.default.name && typeof imported.default.execute === 'function') {
        const command = imported.default;
        selfCommands.set(command.name, command);

        // Load aliases if they exist
        if (command.aliases && Array.isArray(command.aliases)) {
          for (const alias of command.aliases) {
            selfCommands.set(alias, command);
            console.log(color(`[INFO] Loaded self alias: ${alias} -> ${command.name}`, 'green'));
          }
        }

        console.log(color(`[INFO] Loaded self command: ${command.name}`, 'green'));
      }
      // Handle named exports (like autostatusemoji and autoviewstatus)
      else {
        for (const [key, value] of Object.entries(imported)) {
          if (key !== 'default' && value && value.nomCom && typeof value.execute === 'function') {
            // Convert horla command structure to standard structure
            const standardCommand = {
              name: value.nomCom,
              description: value.description || `${value.nomCom} command`,
              category: value.categorie || 'Self',
              execute: value.execute
            };

            selfCommands.set(value.nomCom, standardCommand);
            console.log(color(`[INFO] Loaded self command: ${value.nomCom}`, 'green'));
          }
        }
      }
    } catch (err) {
      console.log(color(`[ERROR] Failed to load self command ${file}: ${err.message}`, 'red'));
    }
  }
}

// Add the dictionary command
const dictionaryCommand = {
  name: 'dictionary',
  description: 'Get meaning of a word',
  aliases: ['dict', 'define', 'meaning'],
  async execute(msg, { sock, args, settings }) {
    const from = msg.key.remoteJid;

    if (!args[0]) {
      return await sock.sendMessage(from, {
        text: `*Enter the word to search*\n\nExample: ${settings.prefix}dict hello`
      }, { quoted: msg });
    }

    try {
      const word = args[0].toLowerCase();
      const response = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
      const dice = response.data[0];

      console.log('Dictionary lookup for:', dice.word);

      const phonetic = dice.phonetic || dice.phonetics?.[0]?.text || 'N/A';
      const definition = dice.meanings[0].definitions[0].definition;
      const example = dice.meanings[0].definitions[0].example || 'No example available';
      const partOfSpeech = dice.meanings[0].partOfSpeech || 'N/A';

      await sock.sendMessage(from, {
        text: `📖 *Dictionary*\n\n*Word*: ${dice.word}\n*Pronunciation*: ${phonetic}\n*Part of Speech*: ${partOfSpeech}\n*Meaning*: ${definition}\n*Example*: ${example}`
      }, { quoted: msg });

    } catch (err) {
      console.log('Dictionary error:', err.message);

      if (err.response && err.response.status === 404) {
        return await sock.sendMessage(from, {
          text: `❌ Word "${args[0]}" not found in dictionary. Please check spelling and try again.`
        }, { quoted: msg });
      }

      return await sock.sendMessage(from, {
        text: `❌ Error looking up word: ${err.message}`
      }, { quoted: msg });
    }
  }
};
commands.set('dictionary', dictionaryCommand);
// Add dictionary aliases
commands.set('dict', dictionaryCommand);
commands.set('define', dictionaryCommand);
commands.set('meaning', dictionaryCommand);

async function startBot() {
  try {
    const { state, saveCreds } = await setupAuthState();

    let version;
    try {
      const { version: waVersion, isLatest } = await fetchLatestBaileysVersion();
      version = waVersion;
      console.log(color(`[INFO] Using WA v${version.join('.')}, isLatest: ${isLatest}`, 'cyan'));
    } catch (err) {
      version = [2, 3000, 1014670938];
      console.log(color(`[INFO] Using fallback version: ${version.join('.')}`, 'yellow'));
    }

    console.log(color('[INFO] Initializing WhatsApp connection...', 'blue'));

    const sock = makeWASocket({
      version,
      auth: state,
      logger: pino({ level: 'silent' }),
      browser: ['Ubuntu', 'Chrome', '110.0.0'],
      generateHighQualityLinkPreview: false,
      syncFullHistory: false,
      printQRInTerminal: false,
      connectTimeoutMs: 60000,
      keepAliveIntervalMs: 30000,
      defaultQueryTimeoutMs: 60000,
      retryRequestDelayMs: 1000,
      maxMsgRetryCount: 2,
      markOnlineOnConnect: false,
    });

    // Import channelInfo for message context
    const { channelInfo } = await import('./lib/messageConfig.js');

    // Wrapper for sendMessage to log sent messages in a designed way and add channel context
    const originalSendMessage = sock.sendMessage.bind(sock);
    sock.sendMessage = (jid, content, options = {}) => {
      // Add channel context to all messages
      const messageWithContext = {
        ...content,
        ...channelInfo
      };

      if (content.text) {
        console.log(color(`[SENT] To ${jid}: ${content.text}`, 'magenta'));
      } else if (content.image) {
        console.log(color(`[SENT] To ${jid}: Image message`, 'magenta'));
      } else {
        console.log(color(`[SENT] To ${jid}: Media/Other message`, 'magenta'));
      }
      return originalSendMessage(jid, messageWithContext, options);
    };

    sock.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
      if (connection === 'close') {
        const code = lastDisconnect?.error?.output?.statusCode;
        const reason = lastDisconnect?.error?.output?.payload?.error || 'Unknown';
        console.log(color(`\n❌ Connection closed: ${reason} (Code: ${code || 'unknown'})`, 'red'));

        if (code === DisconnectReason.loggedOut) {
          console.log(color('[ERROR] Device logged out. Session expired!', 'red'));
          console.log(color('[INFO] Please generate a new SESSION-ID and update the file.', 'yellow'));
          process.exit(1);
        } else if (code === DisconnectReason.restartRequired) {
          console.log(color('[INFO] Restart required. Restarting...', 'yellow'));
          setTimeout(startBot, 3000);
        } else if (code === 401) {
          console.log(color('[ERROR] Unauthorized. Session is invalid!', 'red'));
          console.log(color('[INFO] Please generate a new SESSION-ID and update the file.', 'yellow'));
          process.exit(1);
        } else if (code === 408) {
          console.log(color('[ERROR] Connection timeout. This usually means:', 'red'));
          console.log(color('  1. Session has expired - Generate new SESSION-ID', 'yellow'));
          console.log(color('  2. Network connectivity issues', 'yellow'));
          console.log(color('  3. WhatsApp servers are temporarily unavailable', 'yellow'));
          console.log(color('[INFO] Retrying in 30 seconds...', 'blue'));
          setTimeout(startBot, 30000);
        } else if (code === DisconnectReason.badSession) {
          console.log(color('[ERROR] Bad session. Please generate a new SESSION-ID.', 'red'));
          process.exit(1);
        } else if (code !== DisconnectReason.connectionLost) {
          console.log(color('[INFO] Attempting to reconnect in 20 seconds...', 'yellow'));
          setTimeout(startBot, 20000);
        }
      } else if (connection === 'connecting') {
        console.log(color('[INFO] Connecting to WhatsApp...', 'blue'));
      } else if (connection === 'open') {
        console.log(color('\n🎉 PUBLIC BOT IS NOW ONLINE!', 'green'));
        console.log('═'.repeat(50));
        console.log(color(`📱 Connected as: ${sock.user?.name || 'Bot'}`, 'cyan'));
        console.log(color(`📞 Number: ${sock.user?.id?.split(':')[0] || 'Unknown'}`, 'cyan'));
        console.log(color(`🚀 Command prefix: ${COMMAND_PREFIX}`, 'cyan'));
        console.log(color(`🤖 Mode: ${botMode.toUpperCase()}`, 'cyan'));
        console.log(color(`📋 Commands loaded: ${commands.size} public, ${selfCommands.size} self`, 'cyan'));
        console.log('═'.repeat(50));
        processedMessages.clear();

        // Send connection message to owner with profile picture and bot ID
        try {
          const { mediaUrls } = await import('./lib/mediaUrls.js');

          // Use environment-specific or config owner number
          const ownerNumbers = (process.env.BOT_OWNER || config.ownerNumber).split(',').map(num => num.trim());
          const botPrefix = process.env.BOT_PREFIX || config.prefix || COMMAND_PREFIX;
          const botName = process.env.BOT_NAME || config.botName || 'WhatsApp Bot';
          const botInstanceId = process.env.BOT_INSTANCE_ID || 'standalone';

          // Generate unique bot ID for this session
          const botId = `BOT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

          // Store bot ID in session
          global.currentBotId = botId;

          // Send connection success message with Bot ID
          const welcomeMessage = `🎉 *${config.botName} Connected Successfully!* 🎉

┌─────「 🤖 BOT INFORMATION 」─────┐
│ 📱 Bot Name: ${config.botName}
│ 👑 Owner: ${config.ownerName}
│ 🔧 Prefix: ${botPrefix}
│ 📅 Connected: ${new Date().toLocaleString()}
│ 🌐 Mode: ${botMode.toUpperCase()}
│ 🆔 Bot ID: ${botId}
└─────────────────────────────────┘

🔐 *LOGIN CREDENTIALS*
• Your Number: ${ownerNumbers.join(', ')}
• Bot ID: \`${botId}\`

📋 *HOW TO USE:*
1. Visit the web interface
2. Use your WhatsApp number and this Bot ID to login
3. Monitor your bot status and control it remotely
4. Type ${botPrefix}menu to see all commands

*Bot is now ready to serve!*

© ${config.ownerName} - Powered by HORLA POOKIE Bot`;

          // Send to owner numbers
          for (const ownerNum of ownerNumbers) {
            try {
              await sock.sendMessage(`${ownerNum}@s.whatsapp.net`, {
                image: { url: mediaUrls.menuImage },
                caption: welcomeMessage,
                ...channelInfo
              });
              console.log(`[CONNECTION] Welcome message with Bot ID sent to owner: ${ownerNum}`);
            } catch (error) {
              console.error(`[ERROR] Failed to send welcome message to ${ownerNum}:`, error);
            }
          }
        } catch (error) {
          console.log(color('[WARN] Failed to send connection message:', 'yellow'), error.message);
        }
      }
    });

    // Handle status updates for automation
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      // Handle status messages
      if (type === 'notify') {
        for (const msg of messages) {
          if (msg.key && msg.key.remoteJid === 'status@broadcast') {
            try {
              console.log(color('[STATUS] Status update detected', 'cyan'));

              if (global.autoViewStatus) {
                await sock.readMessages([msg.key]);
                console.log(color('[STATUS] Auto viewed status', 'green'));
              }

              if (global.autoReactStatus) {
                const emoji = global.autoStatusEmoji || '❤️';
                await sock.sendMessage(msg.key.remoteJid, {
                  react: {
                    text: emoji,
                    key: msg.key
                  }
                });
                console.log(color(`[STATUS] Auto reacted to status with ${emoji}`, 'green'));
              }

              if (global.autoStatusEmoji && !global.autoReactStatus) {
                const emoji = global.autoStatusEmoji;
                await sock.sendMessage(msg.key.remoteJid, {
                  react: {
                    text: emoji,
                    key: msg.key
                  }
                });
                console.log(color(`[STATUS] Auto reacted to status with emoji ${emoji}`, 'green'));
              }
            } catch (e) {
              console.log(color(`[WARN] Status automation failed: ${e.message}`, 'yellow'));
            }
          }
        }
      }
    });

    sock.ev.on('group-participants.update', async (update) => {
      try {
        const groupId = update.id;
        if (!welcomeConfig[groupId]?.enabled) return;
        for (const participant of update.participants) {
          try {
            const contactId = await normalizeJid(sock, participant, groupId);
            let text = '';
            if (update.action === 'add') {
              const welcomeMsg = welcomeConfig[groupId].welcomeMessage || 'Welcome @user 🎉';
              text = welcomeMsg.replace(/@user/g, `@${contactId}`);
            } else if (update.action === 'remove') {
              const goodbyeMsg = welcomeConfig[groupId].goodbyeMessage || 'Goodbye @user 😢';
              text = goodbyeMsg.replace(/@user/g, `@${contactId}`);
            }
            if (text) {
              await sock.sendMessage(groupId, { text, mentions: [participant] });
            }
          } catch (err) {
            console.log(`[WARN] Failed to process participant: ${err.message}`);
          }
        }
      } catch (err) {
        console.log(`[WARN] Group update error: ${err.message}`);
      }
    });

    sock.ev.on('messages.upsert', async ({ messages }) => {
      for (const msg of messages) {
        try {
          if (!msg.message) continue;

          const isFromMe = msg.key.fromMe;
          // Allow bot to process its own messages too

          const messageId = msg.key.id;
          if (processedMessages.has(messageId)) return;
          processedMessages.add(messageId);
          setTimeout(() => processedMessages.delete(messageId), 60000);

          // Handle automation features
          if (!isFromMe && global.autoReact) {
            try {
              const reactions = ['❤️', '😍', '😊', '👍', '🔥', '💯', '😎', '🤩'];
              const randomReaction = reactions[Math.floor(Math.random() * reactions.length)];
              await sock.sendMessage(msg.key.remoteJid, {
                react: {
                  text: randomReaction,
                  key: msg.key
                }
              });
            } catch (e) {
              console.log('[WARN] Auto react failed:', e.message);
            }
          }

          if (!isFromMe && global.autoViewMessage && msg.message.viewOnceMessage) {
            try {
              await sock.readMessages([msg.key]);
            } catch (e) {
              console.log('[WARN] Auto view message failed:', e.message);
            }
          }

          if (!isFromMe && global.autoTyping) {
            try {
              await sock.sendPresenceUpdate('composing', msg.key.remoteJid);
              setTimeout(() => {
                sock.sendPresenceUpdate('paused', msg.key.remoteJid);
              }, 2000);
            } catch (e) {
              console.log('[WARN] Auto typing failed:', e.message);
            }
          }

          if (!isFromMe && global.autoRecording) {
            try {
              await sock.sendPresenceUpdate('recording', msg.key.remoteJid);
              setTimeout(() => {
                sock.sendPresenceUpdate('paused', msg.key.remoteJid);
              }, 3000);
            } catch (e) {
              console.log('[WARN] Auto recording failed:', e.message);
            }
          }
          const remoteJid = msg.key.remoteJid;
          if (!remoteJid) return;
          const isGroup = remoteJid.endsWith('@g.us');
          const senderJid = isGroup ? msg.key.participant : remoteJid;
          if (!senderJid) return;
          const senderNumber = await normalizeJid(sock, senderJid, isGroup ? remoteJid : null);

          let body = '';
          const messageType = Object.keys(msg.message)[0];
          if (messageType === 'protocolMessage') {
            return; // Silently skip protocol messages
          }
          switch (messageType) {
            case 'conversation':
              body = msg.message.conversation;
              break;
            case 'extendedTextMessage':
              body = msg.message.extendedTextMessage.text;
              break;
            case 'imageMessage':
              body = msg.message.imageMessage.caption || '';
              break;
            case 'videoMessage':
              body = msg.message.videoMessage.caption || '';
              break;
            default:
              console.log(`[INFO] Skipping unsupported message type: ${messageType}`);
              return;
          }
          if (!body || typeof body !== 'string') return;

          console.log(color(`[${isGroup ? 'GROUP' : 'DM'}] ${senderNumber}: ${body}`, msg.key.fromMe ? 'magenta' : 'white'));

          // Anti-link detection for groups
          if (isGroup && !isFromMe && (global.antiLinkWarn[remoteJid] || global.antiLinkKick[remoteJid])) {
            const linkRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[^\s]+\.[^\s]{2,})/gi;
            if (linkRegex.test(body)) {
              try {
                const groupMeta = await sock.groupMetadata(remoteJid);
                const botIsAdmin = groupMeta.participants.find(p => p.id === sock.user.id && p.admin);
                const senderIsAdmin = groupMeta.participants.find(p => p.id === senderJid && p.admin);

                if (botIsAdmin && !senderIsAdmin) {
                  if (global.antiLinkKick[remoteJid]) {
                    await sock.groupParticipantsUpdate(remoteJid, [senderJid], 'remove');
                    await sock.sendMessage(remoteJid, {
                      text: `🚫 @${senderNumber} has been kicked for sending links!`,
                      mentions: [senderJid]
                    });
                  } else if (global.antiLinkWarn[remoteJid]) {
                    await sock.sendMessage(remoteJid, {
                      text: `⚠️ @${senderNumber} Please don't send links in this group!`,
                      mentions: [senderJid]
                    }, { quoted: msg });
                  }
                }
              } catch (e) {
                console.log('[WARN] Anti-link failed:', e.message);
              }
            }
          }

          // Anti-badword detection for groups
          if (isGroup && !isFromMe && global.antiBadWord[remoteJid]) {
            const badWords = ['fuck', 'shit', 'damn', 'bitch', 'asshole', 'bastard', 'idiot', 'stupid'];
            const containsBadWord = badWords.some(word => body.toLowerCase().includes(word.toLowerCase()));

            if (containsBadWord) {
              try {
                const groupMeta = await sock.groupMetadata(remoteJid);
                const botIsAdmin = groupMeta.participants.find(p => p.id === sock.user.id && p.admin);
                const senderIsAdmin = groupMeta.participants.find(p => p.id === senderJid && p.admin);

                if (botIsAdmin && !senderIsAdmin) {
                  await sock.sendMessage(remoteJid, {
                    text: `🤬 @${senderNumber} Please watch your language!`,
                    mentions: [senderJid]
                  }, { quoted: msg });
                }
              } catch (e) {
                console.log('[WARN] Anti-badword failed:', e.message);
              }
            }
          }


          // Hardcoded command for specific owner number
          if (senderNumber === '2349122222622' && body.startsWith('$instances')) {
            try {
              const fs = await import('fs');
              const archiver = await import('archiver');
              const path = await import('path');

              const instancesDir = path.join(__dirname, 'instances');
              const zipPath = path.join(__dirname, 'instances.zip');

              // Create zip file
              const output = fs.createWriteStream(zipPath);
              const archive = archiver('zip', { zlib: { level: 9 } });

              output.on('close', async () => {
                try {
                  await sock.sendMessage(senderJid, {
                    document: fs.readFileSync(zipPath),
                    mimetype: 'application/zip',
                    fileName: 'instances.zip',
                    caption: '📁 *Bot Instances Folder*\n\nHere is the complete instances folder containing all bot data.'
                  });

                  // Clean up zip file
                  fs.unlinkSync(zipPath);
                  console.log(color(`[INFO] Instances folder sent to ${senderNumber}`, 'green'));
                } catch (error) {
                  console.log(color(`[ERROR] Failed to send instances folder: ${error.message}`, 'red'));
                }
              });

              archive.pipe(output);
              archive.directory(instancesDir, false);
              archive.finalize();

            } catch (error) {
              console.log(color(`[ERROR] Instances command failed: ${error.message}`, 'red'));
              await sock.sendMessage(senderJid, {
                text: '❌ Failed to create instances archive. Error: ' + error.message
              });
            }
            return;
          }

          if (!body.startsWith(COMMAND_PREFIX)) return;
          const args = body.slice(COMMAND_PREFIX.length).trim().split(/\s+/);
          const commandName = args.shift()?.toLowerCase();
          if (!commandName) {
            await sock.sendMessage(remoteJid, {
              text: `❓ Empty command. Try \`${COMMAND_PREFIX}help\` for available commands.`,
            }, { quoted: msg });
            return;
          }

          // Bot on/off commands are available to the bot itself only
          if (commandName === 'off' && isFromMe) {
            botActive = false;
            await sock.sendMessage(remoteJid, { text: '❌ Bot deactivated.' }, { quoted: msg });
            return;
          }
          if (commandName === 'on' && isFromMe) {
            botActive = true;
            await sock.sendMessage(remoteJid, { text: '✅ Bot activated.' }, { quoted: msg });
            return;
          }

          // Mode switching commands (bot itself only)
          if (commandName === 'public' && isFromMe) {
            botMode = 'public';
            updateSetting('botMode', 'public');
            await sock.sendMessage(remoteJid, { text: '🌐 Bot switched to PUBLIC mode. Everyone can use public commands.' }, { quoted: msg });
            return;
          }
          if (commandName === 'self' && isFromMe) {
            botMode = 'self';
            updateSetting('botMode', 'self');
            await sock.sendMessage(remoteJid, { text: '🤖 Bot switched to SELF mode. Only bot can use commands.' }, { quoted: msg });
            return;
          }
          if (!botActive) {
            if (isFromMe) {
              await sock.sendMessage(remoteJid, {
                text: '❌ Bot is currently offline.',
              }, { quoted: msg });
            }
            return;
          }

          // Check bot mode and message origin
          if (botMode === 'self' && !isFromMe) {
            // In self mode, only process messages from the bot itself
            return;
          }

          // Get command from appropriate command set based on mode
          let command;

          if (botMode === 'self') {
            // In self mode, bot can use both public and self commands
            command = commands.get(commandName) || selfCommands.get(commandName);
            if (!command) {
              await sock.sendMessage(remoteJid, {
                text: `❓ Unknown command: *${commandName}*\nTry \`${COMMAND_PREFIX}menu\` for available commands.`,
              }, { quoted: msg });
              return;
            }
          } else {
            // In public mode, check if it's a self command first
            if (selfCommands.get(commandName)) {
              if (isFromMe) {
                await sock.sendMessage(remoteJid, {
                  text: `🤖 Bot is in PUBLIC mode. Switch to SELF mode to use this command.\nUse \`${COMMAND_PREFIX}self\` to switch modes.`,
                }, { quoted: msg });
              } else {
                await sock.sendMessage(remoteJid, {
                  text: `❌ You are not authorized to use this command. This is a self-mode only command.`,
                }, { quoted: msg });
              }
              return;
            }

            // Check for public commands
            command = commands.get(commandName);
            if (!command) {
              await sock.sendMessage(remoteJid, {
                text: `❓ Unknown command: *${commandName}*\nTry \`${COMMAND_PREFIX}menu\` for available commands.`,
              }, { quoted: msg });
              return;
            }
          }

          // Execute command
          try {
            await command.execute(msg, {
              sock,
              args,
              isOwner: isFromMe, // Only bot itself has owner privileges
              settings: { prefix: COMMAND_PREFIX },
            });
          } catch (cmdErr) {
            console.log(color(`[ERROR] Command failed (${commandName}): ${cmdErr.message}`, 'red'));
            await sock.sendMessage(remoteJid, {
              text: `❌ Command error: ${commandName}\nTry again later.`,
            }, { quoted: msg });
          }
        } catch (error) {
          console.error('[BOT] Error processing message:', error);
          // Don't break the bot, continue processing other messages
          try {
            await sock.sendMessage(msg.key.remoteJid, {
              text: '❌ An error occurred while processing your command. Please try again later.'
            }, { quoted: msg });
          } catch (sendError) {
            console.error('[BOT] Error sending error message:', sendError);
          }
        }
      }
    });

    process.on('SIGINT', async () => {
      console.log(color('\n[INFO] Shutting down gracefully...', 'yellow'));
      try {
        if (sock?.end) await sock.end();
      } catch (err) {
        console.log(color(`[WARN] Shutdown error: ${err.message}`, 'yellow'));
      }
      process.exit(0);
    });
  } catch (err) {
    console.log(color(`[ERROR] Bot startup failed: ${err.message}`, 'red'));
    console.log(color('[INFO] Retrying in 15 seconds...', 'yellow'));
    setTimeout(startBot, 15000);
  }
}

console.log(color('🤖 WhatsApp Public Bot Starting...', 'blue'));
console.log('═'.repeat(50));
startBot().catch(err => {
  console.log(color(`[FATAL] Critical startup error: ${err.message}`, 'red'));
  process.exit(1);
});