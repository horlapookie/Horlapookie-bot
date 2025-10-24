
import fs from 'fs';
import path from 'path';

// Load emojis
const emojisPath = path.join(process.cwd(), 'data', 'emojis.json');
const emojis = JSON.parse(fs.readFileSync(emojisPath, 'utf8'));

export default {
  name: 'pin',
  description: 'Pin or unpin the current chat',
  aliases: ['unpin'],
  category: 'WhatsApp',
  
  async execute(msg, { sock, args, settings }) {
    const from = msg.key.remoteJid;
    const command = msg.body?.toLowerCase().split(' ')[0].substring(settings.prefix.length);
    
    // Check if user is owner
    if (msg.key.participant !== settings.ownerNumber && msg.key.remoteJid !== settings.ownerNumber) {
      return await sock.sendMessage(from, {
        text: `${emojis.error || '❌'} This command is only available to the bot owner.`
      }, { quoted: msg });
    }

    try {
      await sock.sendMessage(from, {
        react: { text: emojis.processing || '⏳', key: msg.key }
      });

      const isPin = command === 'pin';
      
      // Add validation for group vs private chat
      if (!from) {
        throw new Error('Invalid chat ID');
      }
      
      await sock.chatModify({ pin: isPin }, from);
      
      const message = isPin 
        ? `${emojis.pin || '📌'} Chat has been pinned successfully!`
        : `${emojis.unpin || '📍'} Chat has been unpinned successfully!`;

      await sock.sendMessage(from, {
        text: message,
        contextInfo: {
          forwardingScore: 1,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: '120363420639943950@newsletter',
            newsletterName: 'Yøur★ Híghñéss 👑 coding Academy',
            serverMessageId: -1
          }
        }
      }, { quoted: msg });

      await sock.sendMessage(from, {
        react: { text: emojis.success || '✅', key: msg.key }
      });

    } catch (error) {
      console.error(`[${command.toUpperCase()}] Error:`, error);
      await sock.sendMessage(from, {
        react: { text: emojis.error || '❌', key: msg.key }
      });
      
      return await sock.sendMessage(from, {
        text: `${emojis.error || '❌'} Failed to ${command} the chat: ${error.message}`
      }, { quoted: msg });
    }
  }
};
