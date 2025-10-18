
import fs from 'fs';
import path from 'path';

// Load emojis
const emojisPath = path.join(process.cwd(), 'data', 'emojis.json');
const emojis = JSON.parse(fs.readFileSync(emojisPath, 'utf8'));

export default {
  name: 'onwa',
  description: 'Check if a WhatsApp number exists',
  aliases: ['checkid', 'checkno', 'wacheck'],
  category: 'WhatsApp',
  
  async execute(msg, { sock, args, settings }) {
    const from = msg.key.remoteJid;
    
    const rawNumber = args[0];
    if (!rawNumber) {
      return await sock.sendMessage(from, {
        text: `${emojis.warning || '⚠️'} Please provide a valid number.\n\n*Example:* \`${settings.prefix}onwa +1234567890\``
      }, { quoted: msg });
    }

    const number = rawNumber.replace(/[^\d]/g, '');
    if (number.length < 10) {
      return await sock.sendMessage(from, {
        text: `${emojis.error || '❌'} Please provide a valid phone number with country code.\n\n*Example:* \`${settings.prefix}onwa +1234567890\``
      }, { quoted: msg });
    }

    const waJid = `${number}@s.whatsapp.net`;

    try {
      await sock.sendMessage(from, {
        react: { text: emojis.processing || '⏳', key: msg.key }
      });

      const [result] = await sock.onWhatsApp(waJid);
      
      const exists = result?.exists;
      const response = exists
        ? `${emojis.success || '✅'} *WhatsApp Status Check*\n\n📱 *Number:* ${rawNumber}\n✅ *Status:* Exists on WhatsApp\n🟢 *Available:* Yes`
        : `${emojis.error || '❌'} *WhatsApp Status Check*\n\n📱 *Number:* ${rawNumber}\n❌ *Status:* Does not exist on WhatsApp\n🔴 *Available:* No`;

      await sock.sendMessage(from, {
        text: response,
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
        react: { text: exists ? (emojis.success || '✅') : (emojis.error || '❌'), key: msg.key }
      });

    } catch (error) {
      console.error('[ONWA] Error:', error);
      await sock.sendMessage(from, {
        react: { text: emojis.error || '❌', key: msg.key }
      });
      
      return await sock.sendMessage(from, {
        text: `${emojis.error || '❌'} An error occurred while checking the number: ${error.message}`
      }, { quoted: msg });
    }
  }
};
