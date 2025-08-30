
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
import axios from 'axios';
import { loadSettings, saveSettings, updateSetting, getCurrentSettings } from './lib/persistentData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get instance configuration from environment
const INSTANCE_ID = process.env.BOT_INSTANCE_ID;
const AUTH_DIR = process.env.BOT_AUTH_DIR;
const SESSION_FILE = process.env.BOT_SESSION_FILE;
const CONFIG_FILE = process.env.BOT_CONFIG_FILE;

if (!INSTANCE_ID || !AUTH_DIR || !SESSION_FILE || !CONFIG_FILE) {
  console.error('[ERROR] Missing instance configuration');
  process.exit(1);
}

// Load instance-specific config
let config;
try {
  const configModule = await import(`file://${CONFIG_FILE}`);
  config = configModule.default;
} catch (error) {
  console.error('[ERROR] Failed to load instance config:', error);
  process.exit(1);
}

const COMMAND_PREFIX = config.prefix;

// Make config globally accessible
global.config = config;
global.COMMAND_PREFIX = COMMAND_PREFIX;

// Instance-specific data directories
const DATA_DIR = path.join(AUTH_DIR, 'data');
const MODS_FILE = path.join(DATA_DIR, 'moderators.json');
const BANNED_FILE = path.join(DATA_DIR, 'banned.json');
const WELCOME_CONFIG_FILE = path.join(DATA_DIR, 'welcomeConfig.json');

// Create data directory
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let botActive = true;

// Load persistent settings on startup
const persistentSettings = loadSettings();
let botMode = persistentSettings.botMode || 'public';
global.botMode = botMode;

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

// Setup auth state from instance SESSION-ID file
async function setupAuthState() {
  if (!fs.existsSync(SESSION_FILE)) {
    console.log(color('[ERROR] SESSION-ID file not found!', 'red'));
    process.exit(1);
  }

  const sessionData = fs.readFileSync(SESSION_FILE, 'utf8').trim();
  if (!sessionData) {
    console.log(color('[ERROR] SESSION-ID file is empty!', 'red'));
    process.exit(1);
  }

  try {
    const parsed = JSON.parse(Buffer.from(sessionData, 'base64').toString());

    if (!parsed.noiseKey || !parsed.signedIdentityKey || !parsed.signedPreKey) {
      console.log(color('[ERROR] Invalid session structure!', 'red'));
      process.exit(1);
    }

    console.log(color(`[INFO] Instance ${INSTANCE_ID} session data loaded successfully`, 'green'));

    // Create instance auth directory
    const authInfoDir = path.join(AUTH_DIR, 'auth_info');
    if (!fs.existsSync(authInfoDir)) {
      fs.mkdirSync(authInfoDir, { recursive: true });
    }

    fs.writeFileSync(path.join(authInfoDir, 'creds.json'), JSON.stringify(parsed, null, 2));

    const { state, saveCreds } = await useMultiFileAuthState(authInfoDir);
    return { state, saveCreds };
  } catch (err) {
    console.log(color(`[ERROR] Invalid session data format: ${err.message}`, 'red'));
    process.exit(1);
  }
}

// Normalize JID to phone number
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

// Color function for logs
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
    
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const isCommonJS = fileContent.includes('require(') || fileContent.includes('module.exports') || fileContent.includes('exports.');
    
    if (isCommonJS && file.endsWith('.js')) {
      const cjsPath = filePath.replace('.js', '.cjs');
      if (!fs.existsSync(cjsPath)) {
        fs.renameSync(filePath, cjsPath);
      }
      imported = await import(`file://${cjsPath}`);
    } else {
      imported = await import(`file://${filePath}`);
    }
    
    const exportedCommands = imported.default;

    if (exportedCommands && exportedCommands.name && typeof exportedCommands.execute === 'function') {
      commands.set(exportedCommands.name, exportedCommands);

      if (exportedCommands.aliases && Array.isArray(exportedCommands.aliases)) {
        for (const alias of exportedCommands.aliases) {
          commands.set(alias, exportedCommands);
        }
      }
    }
    else if (Array.isArray(exportedCommands)) {
      for (const command of exportedCommands) {
        if (command && command.nomCom && typeof command.execute === 'function') {
          const standardCommand = {
            name: command.nomCom,
            description: command.description || `${command.nomCom} command`,
            category: command.categorie || 'Other',
            execute: command.execute
          };

          commands.set(command.nomCom, standardCommand);
        }
      }
    }
    else {
      for (const [key, value] of Object.entries(imported)) {
        if (key !== 'default' && value && value.nomCom && typeof value.execute === 'function') {
          const standardCommand = {
            name: value.nomCom,
            description: value.description || `${value.nomCom} command`,
            category: value.categorie || 'Other',
            execute: value.execute
          };

          commands.set(value.nomCom, standardCommand);
        } else if (key !== 'default' && value && value.name && typeof value.execute === 'function') {
          commands.set(value.name, value);

          if (value.aliases && Array.isArray(value.aliases)) {
            for (const alias of value.aliases) {
              commands.set(alias, value);
            }
          }
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
      
      if (file.endsWith('.js')) {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const isCommonJS = fileContent.includes('require(') || fileContent.includes('module.exports') || fileContent.includes('exports.');
        
        if (isCommonJS) {
          const cjsPath = filePath.replace('.js', '.cjs');
          if (!fs.existsSync(cjsPath)) {
            fs.renameSync(filePath, cjsPath);
          }
          imported = await import(`file://${cjsPath}`);
        } else {
          imported = await import(`file://${filePath}`);
        }
      } else {
        imported = await import(`file://${filePath}`);
      }

      if (imported.default && imported.default.name && typeof imported.default.execute === 'function') {
        const command = imported.default;
        selfCommands.set(command.name, command);

        if (command.aliases && Array.isArray(command.aliases)) {
          for (const alias of command.aliases) {
            selfCommands.set(alias, command);
          }
        }
      }
      else {
        for (const [key, value] of Object.entries(imported)) {
          if (key !== 'default' && value && value.nomCom && typeof value.execute === 'function') {
            const standardCommand = {
              name: value.nomCom,
              description: value.description || `${value.nomCom} command`,
              category: value.categorie || 'Self',
              execute: value.execute
            };

            selfCommands.set(value.nomCom, standardCommand);
          }
        }
      }
    } catch (err) {
      console.log(color(`[ERROR] Failed to load self command ${file}: ${err.message}`, 'red'));
    }
  }
}

// Add dictionary command
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

      const phonetic = dice.phonetic || dice.phonetics?.[0]?.text || 'N/A';
      const definition = dice.meanings[0].definitions[0].definition;
      const example = dice.meanings[0].definitions[0].example || 'No example available';
      const partOfSpeech = dice.meanings[0].partOfSpeech || 'N/A';

      await sock.sendMessage(from, {
        text: `📖 *Dictionary*\n\n*Word*: ${dice.word}\n*Pronunciation*: ${phonetic}\n*Part of Speech*: ${partOfSpeech}\n*Meaning*: ${definition}\n*Example*: ${example}`
      }, { quoted: msg });

    } catch (err) {
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
      console.log(color(`[INFO] Instance ${INSTANCE_ID}: Using WA v${version.join('.')}, isLatest: ${isLatest}`, 'cyan'));
    } catch (err) {
      version = [2, 3000, 1014670938];
      console.log(color(`[INFO] Instance ${INSTANCE_ID}: Using fallback version: ${version.join('.')}`, 'yellow'));
    }

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

    // Wrapper for sendMessage
    const originalSendMessage = sock.sendMessage.bind(sock);
    sock.sendMessage = (jid, content, options = {}) => {
      const messageWithContext = {
        ...content,
        ...channelInfo
      };

      if (content.text) {
        console.log(color(`[INSTANCE ${INSTANCE_ID}] [SENT] To ${jid}: ${content.text}`, 'magenta'));
      }
      return originalSendMessage(jid, messageWithContext, options);
    };

    sock.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
      if (connection === 'close') {
        const code = lastDisconnect?.error?.output?.statusCode;
        const reason = lastDisconnect?.error?.output?.payload?.error || 'Unknown';
        console.log(color(`\n❌ Instance ${INSTANCE_ID}: Connection closed: ${reason} (Code: ${code || 'unknown'})`, 'red'));

        if (code === DisconnectReason.loggedOut || code === 401 || code === DisconnectReason.badSession) {
          console.log(color(`[ERROR] Instance ${INSTANCE_ID}: Session expired/invalid!`, 'red'));
          process.exit(1);
        } else if (code === DisconnectReason.restartRequired) {
          console.log(color(`[INFO] Instance ${INSTANCE_ID}: Restart required. Restarting...`, 'yellow'));
          setTimeout(startBot, 3000);
        } else if (code === 408) {
          console.log(color(`[ERROR] Instance ${INSTANCE_ID}: Connection timeout. Retrying in 30 seconds...`, 'blue'));
          setTimeout(startBot, 30000);
        } else if (code !== DisconnectReason.connectionLost) {
          console.log(color(`[INFO] Instance ${INSTANCE_ID}: Attempting to reconnect in 20 seconds...`, 'yellow'));
          setTimeout(startBot, 20000);
        }
      } else if (connection === 'connecting') {
        console.log(color(`[INFO] Instance ${INSTANCE_ID}: Connecting to WhatsApp...`, 'blue'));
      } else if (connection === 'open') {
        console.log(color(`\n🎉 INSTANCE ${INSTANCE_ID} IS NOW ONLINE!`, 'green'));
        console.log('═'.repeat(50));
        console.log(color(`📱 Connected as: ${sock.user?.name || 'Bot'}`, 'cyan'));
        console.log(color(`📞 Number: ${sock.user?.id?.split(':')[0] || 'Unknown'}`, 'cyan'));
        console.log(color(`🚀 Command prefix: ${COMMAND_PREFIX}`, 'cyan'));
        console.log(color(`👤 Owner: ${config.ownerNumber}`, 'cyan'));
        console.log(color(`🤖 Mode: ${botMode.toUpperCase()}`, 'cyan'));
        console.log('═'.repeat(50));
        processedMessages.clear();
      }
    });

    // Handle status updates for automation
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type === 'notify') {
        for (const msg of messages) {
          if (msg.key && msg.key.remoteJid === 'status@broadcast') {
            try {
              if (global.autoViewStatus) {
                await sock.readMessages([msg.key]);
              }

              if (global.autoReactStatus) {
                const emoji = global.autoStatusEmoji || '❤️';
                await sock.sendMessage(msg.key.remoteJid, {
                  react: {
                    text: emoji,
                    key: msg.key
                  }
                });
              }
            } catch (e) {
              console.log(color(`[WARN] Instance ${INSTANCE_ID}: Status automation failed: ${e.message}`, 'yellow'));
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
            console.log(`[WARN] Instance ${INSTANCE_ID}: Failed to process participant: ${err.message}`);
          }
        }
      } catch (err) {
        console.log(`[WARN] Instance ${INSTANCE_ID}: Group update error: ${err.message}`);
      }
    });

    sock.ev.on('messages.upsert', async ({ messages }) => {
      for (const msg of messages) {
        try {
          if (!msg.message) continue;

          const isFromMe = msg.key.fromMe;
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
              console.log(`[WARN] Instance ${INSTANCE_ID}: Auto react failed:`, e.message);
            }
          }

          if (!isFromMe && global.autoViewMessage && msg.message.viewOnceMessage) {
            try {
              await sock.readMessages([msg.key]);
            } catch (e) {
              console.log(`[WARN] Instance ${INSTANCE_ID}: Auto view message failed:`, e.message);
            }
          }

          if (!isFromMe && global.autoTyping) {
            try {
              await sock.sendPresenceUpdate('composing', msg.key.remoteJid);
              setTimeout(() => {
                sock.sendPresenceUpdate('paused', msg.key.remoteJid);
              }, 2000);
            } catch (e) {
              console.log(`[WARN] Instance ${INSTANCE_ID}: Auto typing failed:`, e.message);
            }
          }

          if (!isFromMe && global.autoRecording) {
            try {
              await sock.sendPresenceUpdate('recording', msg.key.remoteJid);
              setTimeout(() => {
                sock.sendPresenceUpdate('paused', msg.key.remoteJid);
              }, 3000);
            } catch (e) {
              console.log(`[WARN] Instance ${INSTANCE_ID}: Auto recording failed:`, e.message);
            }
          }

          const remoteJid = msg.key.remoteJid;
          if (!remoteJid) return;
          const isGroup = remoteJid.endsWith('@g.us');
          const senderJid = isGroup ? msg.key.participant : remoteJid;
          if (!senderJid) return;
          const senderNumber = await normalizeJid(sock, senderJid, isGroup ? remoteJid : null);

          // Check if message is from owner
          const isFromOwner = senderNumber === config.ownerNumber || isFromMe;

          let body = '';
          const messageType = Object.keys(msg.message)[0];
          if (messageType === 'protocolMessage') {
            return;
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
              return;
          }
          if (!body || typeof body !== 'string') return;

          console.log(color(`[INSTANCE ${INSTANCE_ID}] [${isGroup ? 'GROUP' : 'DM'}] ${senderNumber}: ${body}`, isFromOwner ? 'magenta' : 'white'));

          // Anti-link detection for groups
          if (isGroup && !isFromOwner && (global.antiLinkWarn[remoteJid] || global.antiLinkKick[remoteJid])) {
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
                console.log(`[WARN] Instance ${INSTANCE_ID}: Anti-link failed:`, e.message);
              }
            }
          }

          // Anti-badword detection for groups
          if (isGroup && !isFromOwner && global.antiBadWord[remoteJid]) {
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
                console.log(`[WARN] Instance ${INSTANCE_ID}: Anti-badword failed:`, e.message);
              }
            }
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

          // Bot on/off commands are available to the owner only
          if (commandName === 'off' && isFromOwner) {
            botActive = false;
            await sock.sendMessage(remoteJid, { text: '❌ Bot deactivated.' }, { quoted: msg });
            return;
          }
          if (commandName === 'on' && isFromOwner) {
            botActive = true;
            await sock.sendMessage(remoteJid, { text: '✅ Bot activated.' }, { quoted: msg });
            return;
          }

          // Mode switching commands (owner only)
          if (commandName === 'public' && isFromOwner) {
            botMode = 'public';
            updateSetting('botMode', 'public');
            await sock.sendMessage(remoteJid, { text: '🌐 Bot switched to PUBLIC mode. Everyone can use public commands.' }, { quoted: msg });
            return;
          }
          if (commandName === 'self' && isFromOwner) {
            botMode = 'self';
            updateSetting('botMode', 'self');
            await sock.sendMessage(remoteJid, { text: '🤖 Bot switched to SELF mode. Only owner can use commands.' }, { quoted: msg });
            return;
          }
          if (!botActive) {
            if (isFromOwner) {
              await sock.sendMessage(remoteJid, {
                text: '❌ Bot is currently offline.',
              }, { quoted: msg });
            }
            return;
          }

          // Check bot mode and message origin
          if (botMode === 'self' && !isFromOwner) {
            return;
          }

          let command;

          if (botMode === 'self') {
            command = commands.get(commandName) || selfCommands.get(commandName);
            if (!command) {
              await sock.sendMessage(remoteJid, {
                text: `❓ Unknown command: *${commandName}*\nTry \`${COMMAND_PREFIX}menu\` for available commands.`,
              }, { quoted: msg });
              return;
            }
          } else {
            if (selfCommands.get(commandName)) {
              if (isFromOwner) {
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
              isOwner: isFromOwner,
              settings: { prefix: COMMAND_PREFIX },
            });
          } catch (cmdErr) {
            console.log(color(`[ERROR] Instance ${INSTANCE_ID}: Command failed (${commandName}): ${cmdErr.message}`, 'red'));
            await sock.sendMessage(remoteJid, {
              text: `❌ Command error: ${commandName}\nTry again later.`,
            }, { quoted: msg });
          }
        } catch (error) {
          console.error(`[Instance ${INSTANCE_ID}] Error processing message:`, error);
        }
      }
    });

    process.on('SIGTERM', async () => {
      console.log(color(`\n[INFO] Instance ${INSTANCE_ID}: Shutting down gracefully...`, 'yellow'));
      try {
        if (sock?.end) await sock.end();
      } catch (err) {
        console.log(color(`[WARN] Instance ${INSTANCE_ID}: Shutdown error: ${err.message}`, 'yellow'));
      }
      process.exit(0);
    });
  } catch (err) {
    console.log(color(`[ERROR] Instance ${INSTANCE_ID}: Bot startup failed: ${err.message}`, 'red'));
    console.log(color(`[INFO] Instance ${INSTANCE_ID}: Retrying in 15 seconds...`, 'yellow'));
    setTimeout(startBot, 15000);
  }
}

console.log(color(`🤖 WhatsApp Bot Instance ${INSTANCE_ID} Starting...`, 'blue'));
console.log('═'.repeat(50));
startBot().catch(err => {
  console.log(color(`[FATAL] Instance ${INSTANCE_ID}: Critical startup error: ${err.message}`, 'red'));
  process.exit(1);
});
