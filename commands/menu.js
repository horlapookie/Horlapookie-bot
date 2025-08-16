import config from '../config.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { creatorInfo } from '../lib/creatorInfo.js';
import { channelInfo } from '../lib/messageConfig.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

      // Reorganized categories
      const categories = {
        basic: {
          name: '🛠️ Basic Tools',
          keywords: ['ping', 'uptime', 'botinfo', 'userinfo', 'profile', 'setusername', 'echo', 'log', 'time'],
          commands: []
        },
        group: {
          name: '👥 Group Management', 
          keywords: ['welcome', 'tagall', 'anounce', 'groupinfo', 'kick', 'promote', 'demote', 'lock'],
          commands: []
        },
        AI: {
          name: '🤖 AI Commands',
          keywords: ['gpt-3', 'gpt-4', 'gpt4', 'translate', 'google', 'gta', 'sion', 'analize', 'generate'],
          commands:['gpt-3', 'gpt-4', 'gpt4', 'translate', 'google', 'gta', 'sion', 'analize', 'generate']
        },
        voice: {
          name: '🎙️ Voice & Audio',
          keywords: ['aivoice', 'voice-clone', 'celebrity-voice', 'ai-voice', 'tts', 'speak', 'voice', 'stt', 'speech', 'transcribe', 'audio'],
          commands: []
        },
        games: {
          name: '🎮 Games & Fun',
          keywords: ['hangman', 'trivia', 'myscore', 'answer', 'roll', 'reactionhelp', 'reactions', 'joke', 'insult', 'character'],
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
          keywords: ['lyrics', 'yt', 'tiktok', 'tik', 'video', 'vid', 'ytv'],
          commands: []
        },
        downloaders: {
          name: '📥 Downloaders',
          keywords: ['igdl', 'fbdl', 'fbdl2', 'tiktoklite', 'ytdl'],
          commands: []
        },
        nsfw: {
          name: '🔞 NSFW',
          keywords: ['xvideos', 'xget', 'porno','xvideos-search', 'fap', 'hentai', 'xvideo'],
          commands: []
        },
        github: {
          name: '🐙 GitHub Tools',
          keywords: ['github', 'gitrepo', 'gittrending', 'gitstats', 'gitcommits'],
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
          keywords: ['info', 'menu','vv', 'delete', 'warn', 'save', 'telegraph', 'tg'],
          commands: []
        },
        urlTools: {
          name: '🔗 URL Tools',
          keywords: ['shorten', 'expand', 'qrcode', 'base64', 'urlpreview', 'urlcheck', 'hash'],
          commands: []
        },
        religious: {
          name: '🙏 Religious & Spiritual',
          keywords: ['biblelist', 'bible-list', 'holybooks'],
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
          keywords: ['autoviewmessage', 'autoviewstatus', 'autoreactstatus', 'autoreact', 'autostatusemoji', 'autotyping', 'autorecording'],
          commands: []
        },
        antiCommands: {
          name: '🛡️ Anti-Commands',
          keywords: ['antilinkwarn', 'antilinkkick', 'antideletemessages', 'antivoicecall', 'antivideocall', 'antibadword'],
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
        }
      };

      // Load and categorize public commands
      for (const file of commandFiles) {
        try {
          const command = await import(path.join(commandsPath, file));
          const cmd = command.default;
          if (cmd && cmd.name) {
            let categorized = false;

            // Check which category this command belongs to
            for (const [categoryKey, category] of Object.entries(categories)) {
              if (categoryKey !== 'other' && categoryKey !== 'logo' && categoryKey !== 'AI' && category.keywords.includes(cmd.name)) {
                category.commands.push(cmd.name);

                // Add aliases to the same category
                if (cmd.aliases && Array.isArray(cmd.aliases)) {
                  category.commands.push(...cmd.aliases);
                }
                categorized = true;
                break;
              }
            }

            // If not categorized, add to 'other'
            if (!categorized && !categories.logo.keywords.includes(cmd.name) && !categories.AI.keywords.includes(cmd.name)) {
              categories.other.commands.push(cmd.name);
              // Add aliases to 'other' category too
              if (cmd.aliases && Array.isArray(cmd.aliases)) {
                categories.other.commands.push(...cmd.aliases);
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
          const command = await import(path.join(selfCommandsPath, file));
          const cmd = command.default;
          if (cmd && cmd.name) {
            let categorized = false;

            // Check which category this self command belongs to
            for (const [categoryKey, category] of Object.entries(categories)) {
              if (categoryKey !== 'other' && categoryKey !== 'self' && category.keywords.includes(cmd.name)) {
                category.commands.push(`${cmd.name} (self)`);
                categorized = true;
                break;
              }
            }

            // If not categorized, add to 'self' category
            if (!categorized) {
              categories.self.commands.push(cmd.name);
            }
          }
        } catch (e) {
          console.error(`[ERROR] Failed to load self command ${file}:`, e.message);
        }
      }

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
      const botMode = global.botMode || 'public';
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
      await sock.sendMessage(from, {
        text: menuText,
        ...channelInfo
      }, { quoted: msg });
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