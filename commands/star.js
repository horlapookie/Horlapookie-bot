
import fs from 'fs';
import path from 'path';

// Load emojis
const emojisPath = path.join(process.cwd(), 'data', 'emojis.json');
const emojis = JSON.parse(fs.readFileSync(emojisPath, 'utf8'));

export default {
  name: 'star',
  description: 'Star or unstar a quoted message',
  aliases: ['unstar'],
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

    // Get quoted message info more reliably
    const quotedInfo = msg.message?.extendedTextMessage?.contextInfo || msg.message?.imageMessage?.contextInfo || msg.message?.videoMessage?.contextInfo;
    const quoted = quotedInfo?.stanzaId;
    const fromMe = quotedInfo?.participant === sock.user.id?.replace(/:\d+@s\.whatsapp\.net/, '@s.whatsapp.net') || quotedInfo?.fromMe;

    if (!quoted) {
      return await sock.sendMessage(from, {
        text: `${emojis.warning || '⚠️'} Please reply to the message you want to ${command}.\n\n💡 Make sure you are replying to a valid message.`
      }, { quoted: msg });
    }

    try {
      await sock.sendMessage(from, {
        react: { text: emojis.processing || '⏳', key: msg.key }
      });

      const isStar = command === 'star';
      
      // Validate the message exists before trying to star
      if (!quoted) {
        throw new Error('Invalid message ID');
      }

      await sock.chatModify({
        star: {
          messages: [{ id: quoted, fromMe: Boolean(fromMe) }],
          star: isStar
        }
      }, from);

      const message = isStar 
        ? `${emojis.star || '⭐'} Message has been starred successfully!`
        : `${emojis.star || '⭐'} Message has been unstarred successfully!`;

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
        text: `${emojis.error || '❌'} Failed to ${command} the message: ${error.message}`
      }, { quoted: msg });
    }
  }
};
