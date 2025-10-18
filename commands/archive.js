
import fs from 'fs';
import path from 'path';

// Load emojis
const emojisPath = path.join(process.cwd(), 'data', 'emojis.json');
const emojis = JSON.parse(fs.readFileSync(emojisPath, 'utf8'));

export default {
  name: 'archive',
  description: 'Archive the current chat',
  aliases: ['archivechat'],
  category: 'WhatsApp',
  
  async execute(msg, { sock, args, settings }) {
    const from = msg.key.remoteJid;
    
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

      const lastMsgInChat = msg;
      await sock.chatModify({ archive: true, lastMessages: [lastMsgInChat] }, from);
      
      await sock.sendMessage(from, {
        text: `${emojis.success || '✅'} Chat has been archived successfully!\n\n📁 This chat is now moved to your archived chats.`,
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
      console.error('[ARCHIVE] Error:', error);
      await sock.sendMessage(from, {
        react: { text: emojis.error || '❌', key: msg.key }
      });
      
      return await sock.sendMessage(from, {
        text: `${emojis.error || '❌'} There was an error while archiving the chat: ${error.message}\n\nPlease try again later.`
      }, { quoted: msg });
    }
  }
};
