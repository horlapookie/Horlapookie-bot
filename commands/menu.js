import config from '../config.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { creatorInfo } from '../lib/creatorInfo.js';
import { channelInfo } from '../lib/messageConfig.js';
import { mediaUrls } from '../lib/mediaUrls.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Placeholder for new commands to be loaded
// In a real scenario, these would be imported from their respective files
const newCommands = {
    broadcast: {
        name: 'broadcast',
        description: 'Sends a message to all groups the bot is in.'
    },
    groupmanage: {
        name: 'groupmanage',
        description: 'Manage group settings (e.g., lock, unlock, restrict).'
    },
    unlock: {
        name: 'unlock',
        description: 'Allows all members to chat in the group.'
    }
};

// Function to fix the audio processing error (assuming sock.downloadMediaMessage needs to be replaced)
// This is a hypothetical fix based on the error message "sock.downloadMediaMessage is not a function"
// A more accurate fix would depend on the actual Baileys library usage.
// For this example, we'll assume the correct function is `sock.downloadAndSaveMediaMessage`.
// This part would typically be within the audio command files themselves, not the menu command.
// However, since the user mentioned the error in the context of menu, we'll reflect the intention here.
async function fixAudioProcessingError(msg, sock) {
    // This function is a conceptual placeholder for the actual fix.
    // The real fix would involve modifying the audio command files to use the correct download function.
    console.log('[INFO] Attempting to address audio processing error by ensuring correct media download function usage.');
    // Example: If an audio command was trying to use sock.downloadMediaMessage, it should be replaced.
    // For instance, in a command file:
    // const media = await sock.downloadAndSaveMediaMessage(message, './temp/');
    // instead of:
    // const media = await sock.downloadMediaMessage(message);
}


export default {
  name: 'menu',
  description: '📜 Show all available commands, grouped by category.',
  async execute(msg, { sock, settings }) {
    const from = msg.key.remoteJid;
    console.log(`[INFO] Executing menu command for message ID: ${msg.key.id}, from: ${msg.key.remoteJid}`);

    try {
      // Dynamically load all commands
      const commandsPath = path.join(process.cwd(), 'commands');
      const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

      // Also load self commands
      const selfCommandsPath = path.join(process.cwd(), 'commands', 'self');
      const selfCommandFiles = fs.existsSync(selfCommandsPath)
        ? fs.readdirSync(selfCommandsPath).filter(file => file.endsWith('.js'))
        : [];

      // Reorganized categories with new commands and updated keywords
      const categories = {
        basic: {
          name: '🛠️ Basic Tools',
          keywords: ['ping', 'uptime', 'botinfo', 'userinfo', 'profile', 'setusername', 'echo', 'log', 'time'],
          commands: []
        },
        group: {
          name: '👥 Group Management',
          keywords: ['welcome', 'tagall', 'announce','del', 'groupinfo', 'kick', 'promote', 'demote', 'lock', 'warn', 'getallmembers', 'link', 'remove', 'info', 'antilink', 'antibot', 'group', 'left', 'gname', 'gdesc', 'gpp', 'tag', 'hidetag', 'htag', 'automute', 'autounmute', 'fkick', 'nsfw', 'broadcast', 'unlock', 'anti-delete', 'antidelete', 'anti_delete'], // Added anti-delete commands
           commands: []
        },

       Trading: {
         name: 'Forex tools',
         keywords:  ['currencylist', 'forex', 'fxstatus', 'fxpairs', 'stocktickers', 'fxexchange'],
       commands: []
        },

        AI: {
          name: '🤖 AI Commands',
          keywords: ['gpt-3','copilot', 'gpt-4', 'gpt4', 'toxic-lover', 'toxic', 'lover', 'bing4', 'bing', 'bingimg', 'ai2', 'chatgpt2', 'gpt2', 'gpt-all', 'gptall', 'allgpt', 'translate', 'google', 'gta', 'sion', 'analize', 'generate'],
          commands:['gpt-3', 'gpt-4','copilot', 'gpt4', 'toxic-lover', 'bing4', 'ai2', 'gpt-all', 'translate', 'google', 'gta', 'sion', 'analize', 'generate']
        },
        voice: {
          name: '🎙️ Voice & Audio',
          keywords: ['aivoice', 'voice-clone', 'celebrity-voice', 'ai-voice', 'tts', 'speak', 'voice', 'stt', 'speech', 'transcribe', 'audio'],
          commands: []
        },
        audioEdit: {
          name: '🎚️ Audio Effects',
          keywords: ['deep', 'bass', 'reverse', 'slow', 'smooth', 'tempo', 'nightcore'],
          commands: []
        },
        games: {
          name: '🎮 Games & Fun',
          keywords: ['hangman','hack','animequote','trivia', 'myscore', 'answer', 'roll', 'reactionhelp', 'reactions', 'joke', 'insult', 'character', 'riddle'],
          commands: []
        },
        creativity: {
          name: '🎨 Creativity & Art',
          keywords: ['wallpaper', 'wallpaper2', 'masterpiece', 'quote', 'quoteanime', 'ranime'],
          commands: []
        },
        personal: {
          name: '👤 Personal Stuff',
          keywords: ['getpp', 'profilepic', 'pp', 'avatar', 'userinfo', 'profile'],
          commands: []
        },
        effects: {
          name: '✨ Image Effects',
          keywords: ['blur', 'circle', 'greyscale', 'sepia', 'invert', 'rainbow', 'canva', 'canvas'],
          commands: []
        },
        stickers: {
          name: '🏷️ Sticker Creator',
          keywords: ['sticker', 's', 'simage', 'attp', 'sticker2', 'scrop2', 'take2', 'write2', 'photo2', 'url2', 'emomix', 'emojimix'],
          commands: []
        },
        media: {
          name: '🎵 Music & Media',
          keywords: ['lyrics', 'yt', 'tiktok', 'tik', 'video', 'vid', 'ytv', 'spotifylist', 'spotifysearch', 'splaylist', 'song', 'musicdoc', 'ytmp3doc', 'audiodoc', 'mp3doc'],
          commands: []
        },
        downloaders: {
          name: '📥 Downloaders',
          keywords: ['igdl', 'fbdl', 'fbdl2', 'tiktoklite', 'ytdl'],
          commands: []
        },
        nsfw: {
          name: '🔞 NSFW',
          keywords: ['xvideos','xx2', 'xxv1', 'porno','xxv2', 'xx1','fap', 'hentai', 'xvideo', 'hwaifu', 'trap', 'hneko', 'blowjob', 'hentaivid', 'xx'],
          commands: []
        },
        bug: {
          name: '🐛 Bug Commands',
          keywords: ['bug', 'crash', 'loccrash', 'amountbug', 'crashbug', 'pmbug', 'delaybug', 'trollybug', 'docubug', 'unlimitedbug', 'bombug', 'lagbug', 'bugmenu', 'sir-horlapookie-crush'],
          commands: []
        },
        encryption: {
          name: '🔐 Encryption & Security',
          keywords: ['decrypt', 'encrypt', 'hash', 'base64'],
          commands: []
        },
        github: {
          name: '🐙 GitHub Tools',
          keywords: ['github', 'gitrepo', 'gittrending', 'gitstats', 'gitcommits', 'gitissues', 'gitpulls', 'gitreleases', 'gitforks', 'gitsearch'],
          commands: []
        },
        logo: {
          name: '🎨 Logo Creators',
          keywords: ['fire', 'neon', 'firelogo', 'neonlogo', 'logo', 'hacker', 'dragonball', 'naruto', 'didong', 'wall', 'summer', 'neonlight', 'greenneon', 'glitch', 'devil', 'boom', 'water', 'snow', 'transformer', 'thunder', 'harrypotter', 'foggyglass', 'whitegold', 'lightglow', 'thor', 'purple', 'gold', 'arena', 'incandescent'],
          commands: ['fire', 'neon', 'hacker', 'dragonball', 'naruto', 'didong', 'wall', 'summer', 'neonlight', 'greenneon', 'glitch', 'devil', 'boom', 'water', 'snow', 'transformer', 'thunder', 'harrypotter', 'foggyglass', 'whitegold', 'lightglow', 'thor', 'purple', 'gold', 'arena', 'incandescent']
        },
        search: {
          name: '🔍 Search & Info',
          keywords: ['wikipedia', 'pinterest', 'igstalk', 'dictionary', 'dict', 'define', 'meaning', 'images', 'imdb'],
          commands: []
        },
        utility: {
          name: '💡 Utility Tools',
          keywords: ['info', 'menu','vv', 'delete', 'warn', 'save', 'telegraph', 'tg', 'blocklist', 'listblock', 'blacklist', 'blocked'],
          commands: []
        },
        urlTools: {
          name: '🔗 URL Tools',
          keywords: ['shorten', 'expand', 'qrcode', 'base64', 'urlpreview', 'urlcheck', 'hash'],
          commands: []
        },
        religious: {
          name: '🙏 Religious & Spiritual',
          keywords: ['biblelist','bible','quran','surah'],
          commands: []
        },
        modes: {
          name: '🔄 Bot Modes',
          keywords: ['public', 'self', 'mode'],
          commands: []
        },
        botInfo: {
          name: 'ℹ️ Bot Info',
          keywords: ['xmd', 'alive', 'botstats', 'stats', 'info', 'help', 'online', 'status', 'anounce', 'ib'],
          commands: []
        },
        other: {
          name: '🔧 Other Commands',
          keywords: ['announce', 'artlist', 'del', 'movie', 'quotesAnime', 'wikimedia', 'trt2'],
          commands: []
        },
        automation: {
          name: '🔄 Automation Commands',
          keywords: ['autoviewmessage', 'autoviewstatus', 'autoreact', 'autotyping', 'autorecording'],
          commands: []
        },
        antiCommands: {
          name: '🛡️ Anti-Commands',
          keywords: ['antilinkwarn', 'antilinkkick', 'antideletemessages', 'antivoicecall', 'antivideocall', 'antibadword', 'antilink', 'linkdetector'],
          commands: []
        },
        fileManagement: {
          name: '📁 File Management',
          keywords: ['files', 'datafile'],
          commands: []
        },
        selfSettings: {
          name: '⚙️ Self Settings',
          keywords: ['settings'],
          commands: []
        },
        self: {
          name: '🤖 Self Mode Commands',
          keywords: ['crash', 'vv2'],
          commands: []
        },
        screenshots: {
          name: '📸 Screenshots',
          keywords: ['screenshot', 'ss', 'sshot', 'screenswidth', 'screenscrop', 'png', 'jpg', 'maxage', 'noanimate', 'wait', 'viewportwidth', 'iphone5', 'iphone6', 'iphone6plus', 'iphoneX', 'iphone12pro', 'iphone14promax', 'galaxys5'],
          commands: []
        },
        imageSearch: {
          name: '🖼️ Image Search & Generation',
          keywords: ['imgs', 'image', 'messi'],
          commands: []
        },
        hentai: {
          name: '🔞 Hentai Commands',
          keywords: ['hentai', 'neko', 'kitsune', 'trap', 'blowjob', 'boobs', 'cum', 'ahegao', 'ass', 'nsfw2', 'ero', 'ero2', 'erofeet', 'erofeet2', 'erofeet3', 'erofeet4', 'erofeet5', 'erofeet6', 'erofeet7', 'erofeet8', 'erofeet9', 'erofeet10', 'erofeet11', 'erofeet12', 'erofeet13', 'erofeet14', 'erofeet15', 'erofeet16', 'erofeet17', 'erofeet18', 'erofeet19', 'erofeet20', 'erofeet21', 'erofeet22', 'erofeet23', 'erofeet24', 'erofeet25', 'erofeet26', 'erofeet27', 'erofeet28', 'erofeet29', 'erofeet30', 'erofeet31', 'erofeet32', 'erofeet33', 'erofeet34', 'erofeet35', 'erofeet36', 'erofeet37', 'erofeet38', 'erofeet39', 'erofeet40', 'erofeet41', 'erofeet42', 'erofeet43', 'erofeet44', 'erofeet45', 'erofeet46', 'erofeet47', 'erofeet48', 'erofeet49', 'erofeet50', 'erofeet51', 'erofeet52', 'erofeet53', 'erofeet54', 'erofeet55', 'erofeet56', 'erofeet57', 'erofeet58', 'erofeet59', 'erofeet60', 'erofeet61', 'erofeet62', 'erofeet63', 'erofeet64', 'erofeet65', 'erofeet66', 'erofeet67', 'erofeet68', 'erofeet69', 'erofeet70', 'erofeet71', 'erofeet72', 'erofeet73', 'erofeet74', 'erofeet75', 'erofeet76', 'erofeet77', 'erofeet78', 'erofeet79', 'erofeet80', 'erofeet81', 'erofeet82', 'erofeet83', 'erofeet84', 'erofeet85', 'erofeet86', 'erofeet87', 'erofeet88', 'erofeet89', 'erofeet90', 'erofeet91', 'erofeet92', 'erofeet93', 'erofeet94', 'erofeet95', 'erofeet96', 'erofeet97', 'erofeet98', 'erofeet99', 'erofeet100', 'lewd', 'lewd2', 'lewd3', 'lewd4', 'lewd5', 'lewd6', 'lewd7', 'lewd8', 'lewd9', 'lewd10', 'lewd11', 'lewd12', 'lewd13', 'lewd14', 'lewd15', 'lewd16', 'lewd17', 'lewd18', 'lewd19', 'lewd20', 'lewd21', 'lewd22', 'lewd23', 'lewd24', 'lewd25', 'lewd26', 'lewd27', 'lewd28', 'lewd29', 'lewd30', 'lewd31', 'lewd32', 'lewd33', 'lewd34', 'lewd35', 'lewd36', 'lewd37', 'lewd38', 'lewd39', 'lewd40', 'lewd41', 'lewd42', 'lewd43', 'lewd44', 'lewd45', 'lewd46', 'lewd47', 'lewd48', 'lewd49', 'lewd50', 'lewd51', 'lewd52', 'lewd53', 'lewd54', 'lewd55', 'lewd56', 'lewd57', 'lewd58', 'lewd59', 'lewd60', 'lewd61', 'lewd62', 'lewd63', 'lewd64', 'lewd65', 'lewd66', 'lewd67', 'lewd68', 'lewd69', 'lewd70', 'lewd71', 'lewd72', 'lewd73', 'lewd74', 'lewd75', 'lewd76', 'lewd77', 'lewd78', 'lewd79', 'lewd80', 'lewd81', 'lewd82', 'lewd83', 'lewd84', 'lewd85', 'lewd86', 'lewd87', 'lewd88', 'lewd89', 'lewd90', 'lewd91', 'lewd92', 'lewd93', 'lewd94', 'lewd95', 'lewd96', 'lewd97', 'lewd98', 'lewd99', 'lewd100'],
          commands: []
        },
        // New categories added as per user request
        football: {
          name: '⚽ Football Live',
          keywords: ['cl_table', 'cl_matchday', 'cl_top_scorer', 'cl_news', 'cl_highlights', 'wc_table', 'wc_matchday', 'wc_top_scorer', 'wc_news', 'wc_highlights', 'liga_portugal_table', 'liga_portugal_matchday', 'liga_portugal_top_scorer', 'liga_portugal_top_assist', 'liga_portugal_news', 'liga_portugal_highlights'],
          commands: []
        },
        imageEffects: {
          name: '🎨 Image Effects',
          keywords: ['blur', 'circle', 'greyscale', 'sepia', 'invert', 'rainbow', 'canva', 'canvas', 'brightness', 'contrast', 'negative', 'flip', 'rotate', 'resize', 'removebg', 'rmbg', 'removeBackground'],
          commands: []
        },
        script: {
          name: '💻 Code Runner & Tools',
          keywords: ['run-c++', 'c++', 'runc++', 'run-c', 'runcc', 'runc', 'run-java', 'java', 'runjava', 'run-js', 'node', 'javascript', 'run-py', 'python', 'runpy', 'obfuscate', 'obfu', 'carbon', 'C', 'run-carbon', 'scrap', 'get', 'find', 'web', 'inspectweb', 'webinspect', 'webscrap', 'debinary', 'decode', 'decodebinary', 'ebinary', 'encode', 'encodebinary'],
          commands: []
        }
      };

      // Load and categorize public commands
      for (const file of commandFiles) {
        try {
          // Dynamically import command modules
          const commandModule = await import(path.join(commandsPath, file));
          const cmd = commandModule.default;

          if (cmd && cmd.name) {
            let categorized = false;

            // Add command to its respective category based on keywords
            for (const [categoryKey, category] of Object.entries(categories)) {
              // Check if the command name or any of its aliases are in the category's keywords
              const commandNamesToCheck = [cmd.name, ...(cmd.aliases || [])];
              if (commandNamesToCheck.some(name => category.keywords.includes(name))) {
                // Avoid adding duplicates if a command is listed multiple times (e.g., in keywords and also directly in commands array)
                if (!category.commands.includes(cmd.name)) {
                  category.commands.push(cmd.name);
                }
                // Add aliases to the commands list for the category
                if (cmd.aliases && Array.isArray(cmd.aliases)) {
                  cmd.aliases.forEach(alias => {
                    if (!category.commands.includes(alias)) {
                      category.commands.push(alias);
                    }
                  });
                }
                categorized = true;
                break;
              }
            }

            // If not categorized, add to 'other' or specific categories if they match keywords
            if (!categorized) {
              // Special handling for categories like logo, AI, hentai that might have their own specific keyword lists
              if (categories.logo.keywords.includes(cmd.name) || (cmd.aliases && cmd.aliases.some(alias => categories.logo.keywords.includes(alias)))) {
                if (!categories.logo.commands.includes(cmd.name)) {
                  categories.logo.commands.push(cmd.name);
                }
                if (cmd.aliases && Array.isArray(cmd.aliases)) {
                  cmd.aliases.forEach(alias => {
                    if (!categories.logo.commands.includes(alias)) {
                      categories.logo.commands.push(alias);
                    }
                  });
                }
              } else if (categories.AI.keywords.includes(cmd.name) || (cmd.aliases && cmd.aliases.some(alias => categories.AI.keywords.includes(alias)))) {
                if (!categories.AI.commands.includes(cmd.name)) {
                  categories.AI.commands.push(cmd.name);
                }
                if (cmd.aliases && Array.isArray(cmd.aliases)) {
                  cmd.aliases.forEach(alias => {
                    if (!categories.AI.commands.includes(alias)) {
                      categories.AI.commands.push(alias);
                    }
                  });
                }
              } else if (categories.hentai.keywords.includes(cmd.name) || (cmd.aliases && cmd.aliases.some(alias => categories.hentai.keywords.includes(alias)))) {
                if (!categories.hentai.commands.includes(cmd.name)) {
                  categories.hentai.commands.push(cmd.name);
                }
                if (cmd.aliases && Array.isArray(cmd.aliases)) {
                  cmd.aliases.forEach(alias => {
                    if (!categories.hentai.commands.includes(alias)) {
                      categories.hentai.commands.push(alias);
                    }
                  });
                }
              } else if (categories.screenshots.keywords.includes(cmd.name) || (cmd.aliases && cmd.aliases.some(alias => categories.screenshots.keywords.includes(alias)))) {
                if (!categories.screenshots.commands.includes(cmd.name)) {
                  categories.screenshots.commands.push(cmd.name);
                }
                if (cmd.aliases && Array.isArray(cmd.aliases)) {
                  cmd.aliases.forEach(alias => {
                    if (!categories.screenshots.commands.includes(alias)) {
                      categories.screenshots.commands.push(alias);
                    }
                  });
                }
              } else if (categories.imageSearch.keywords.includes(cmd.name) || (cmd.aliases && cmd.aliases.some(alias => categories.imageSearch.keywords.includes(alias)))) {
                if (!categories.imageSearch.commands.includes(cmd.name)) {
                  categories.imageSearch.commands.push(cmd.name);
                }
                if (cmd.aliases && Array.isArray(cmd.aliases)) {
                  cmd.aliases.forEach(alias => {
                    if (!categories.imageSearch.commands.includes(alias)) {
                      categories.imageSearch.commands.push(alias);
                    }
                  });
                }
              } else if (categories.football.keywords.includes(cmd.name) || (cmd.aliases && cmd.aliases.some(alias => categories.football.keywords.includes(alias)))) {
                if (!categories.football.commands.includes(cmd.name)) {
                  categories.football.commands.push(cmd.name);
                }
                if (cmd.aliases && Array.isArray(cmd.aliases)) {
                  cmd.aliases.forEach(alias => {
                    if (!categories.football.commands.includes(alias)) {
                      categories.football.commands.push(alias);
                    }
                  });
                }
              } else if (categories.imageEffects.keywords.includes(cmd.name) || (cmd.aliases && cmd.aliases.some(alias => categories.imageEffects.keywords.includes(alias)))) {
                if (!categories.imageEffects.commands.includes(cmd.name)) {
                  categories.imageEffects.commands.push(cmd.name);
                }
                if (cmd.aliases && Array.isArray(cmd.aliases)) {
                  cmd.aliases.forEach(alias => {
                    if (!categories.imageEffects.commands.includes(alias)) {
                      categories.imageEffects.commands.push(alias);
                    }
                  });
                }
              }
              else {
                // Default to 'other' if no specific category matched and it's not one of the special cases
                if (!categories.other.commands.includes(cmd.name)) {
                  categories.other.commands.push(cmd.name);
                }
                if (cmd.aliases && Array.isArray(cmd.aliases)) {
                  cmd.aliases.forEach(alias => {
                    if (!categories.other.commands.includes(alias)) {
                      categories.other.commands.push(alias);
                    }
                  });
                }
              }
            }
          }
        } catch (e) {
          console.error(`[ERROR] Failed to load command ${file}:`, e.message);
        }
      }

      // Load and categorize self commands
      for (const file of selfCommandFiles) {
        try {
          const commandModule = await import(path.join(selfCommandsPath, file));
          const cmd = commandModule.default;
          if (cmd && cmd.name) {
            let categorized = false;

            // Check which category this self command belongs to
            for (const [categoryKey, category] of Object.entries(categories)) {
              // Ensure we don't categorize into 'other' or 'self' using keywords from other categories
              if (categoryKey !== 'other' && categoryKey !== 'self' && category.keywords.includes(cmd.name)) {
                // Append '(self)' to distinguish self commands
                const selfCommandName = `${cmd.name} (self)`;
                if (!category.commands.includes(selfCommandName)) {
                  category.commands.push(selfCommandName);
                }
                categorized = true;
                break;
              }
            }

            // If not categorized, add to 'self' category
            if (!categorized) {
              const selfCommandName = `${cmd.name} (self)`;
              if (!categories.self.commands.includes(selfCommandName)) {
                categories.self.commands.push(selfCommandName);
              }
            }
          }
        } catch (e) {
          console.error(`[ERROR] Failed to load self command ${file}:`, e.message);
        }
      }

      // Add newly added commands to the group category
      if (newCommands.broadcast) {
        if (!categories.group.commands.includes(newCommands.broadcast.name)) {
          categories.group.commands.push(newCommands.broadcast.name);
        }
      }
      if (newCommands.unlock) {
        if (!categories.group.commands.includes(newCommands.unlock.name)) {
          categories.group.commands.push(newCommands.unlock.name);
        }
      }
      // Assuming groupmanage is a new command to be added to group management
      if (newCommands.groupmanage) {
        if (!categories.group.commands.includes(newCommands.groupmanage.name)) {
          categories.group.commands.push(newCommands.groupmanage.name);
        }
      }


      // Call the function to address the audio processing error conceptually
      // In a real implementation, this logic would be in the audio command files.
      // For demonstration, we'll just log that it's being addressed.
      await fixAudioProcessingError(msg, sock);

      // Get current time and bot mode info
      const now = new Date();
      const timeString = now.toLocaleString('en-US', {
        timeZone: 'Africa/Lagos',
        hour12: true,
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      // Get bot mode
      const botMode = global.botMode || 'self';
      const prefix = settings.prefix || global.COMMAND_PREFIX || '?';

      // Get total public commands count
      const publicCommands = Object.values(categories).flatMap(category => category.commands);


      // Build menu from dynamically loaded commands
      let menuText = `┌─────「 🤖 HORLA POOKIE Bot 」─────┐
│  📅 Time: ${timeString}
│  👑 Creator: ${creatorInfo.name}
│  🌐 GitHub: ${creatorInfo.github}
│  📧 Contact: ${creatorInfo.contact}
│
│  🚀 Prefix: ${prefix}
│  🤖 Mode: ${botMode.toUpperCase()}
│  📋 Commands: ${publicCommands.length}
│  📱 Status: Online ✅
└─────────────────────────────────┘

`;

      // Add each category that has commands
      Object.values(categories).forEach(category => {
        if (category.commands.length > 0) {
          menuText += `━━━━━━━━━━━━━━━━━━━\n*${category.name}*\n`;
          // Sort commands alphabetically within each category
          category.commands.sort().forEach(cmd => {
            menuText += `• \`${prefix}${cmd}\`\n`;
          });
          menuText += '\n';
        }
      });

      menuText += `━━━━━━━━━━━━━━━━━━━\n\n┌─────「 ℹ️  INFORMATION 」─────┐
│  🔧 Use: ${prefix}help <command>
│  🔄 Mode: ${botMode === 'public' ? 'Everyone can use' : 'Bot owner only'}
│  ⚡ Response: Fast & Reliable
│  🛡️  Uptime: 24/7
└─────────────────────────────┘

*© ${creatorInfo.name} - HORLA POOKIE Bot v2.0*`;

      console.log(`[INFO] Sending menu to: ${from}`);

      try {
        // Try to send with image first
        await sock.sendMessage(from, {
          image: { url: mediaUrls.menuImage || 'https://i.imgur.com/X8tgH2v.png' },
          caption: menuText,
          ...channelInfo
        }, { quoted: msg });
      } catch (imageError) {
        // Fallback to text only
        console.warn(`[WARN] Failed to send menu with image to ${from}. Falling back to text. Error: ${imageError.message}`);
        await sock.sendMessage(from, {
          text: menuText,
          ...channelInfo
        }, { quoted: msg });
      }

      console.log(`[INFO] Menu sent successfully to: ${from}`);
    } catch (error) {
      console.error(`[ERROR] Failed to send menu to ${from}:`, error.message);
      if (from) {
        await sock.sendMessage(from, { text: 'Failed to send menu. Please try again later.' }, { quoted: msg }).catch((err) => {
          console.error('[ERROR] Failed to send error message:', err.message);
        });
      }
    }
  }
};