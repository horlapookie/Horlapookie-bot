
import fs from 'fs';
import path from 'path';

// Load emojis
const emojisPath = path.join(process.cwd(), 'data', 'emojis.json');
const emojis = JSON.parse(fs.readFileSync(emojisPath, 'utf8'));

export default {
  name: 'privacy',
  description: 'Display your current WhatsApp privacy settings',
  aliases: ['privacysettings'],
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

      const {
        readreceipts,
        profile,
        status,
        online,
        last,
        groupadd,
        calladd
      } = await sock.fetchPrivacySettings(true);

      const name = sock.user?.name || "User";
      const caption = `${emojis.shield || '🛡️'} *Privacy Settings*\n\n` +
        `*Name:* ${name}\n` +
        `*Online:* ${online}\n` +
        `*Profile:* ${profile}\n` +
        `*Last Seen:* ${last}\n` +
        `*Read Receipts:* ${readreceipts}\n` +
        `*Status:* ${status}\n` +
        `*Group Add:* ${groupadd}\n` +
        `*Call Add:* ${calladd}`;

      let avatar;
      try {
        avatar = await sock.profilePictureUrl(sock.user.id, 'image');
      } catch {
        avatar = 'https://telegra.ph/file/b34645ca1e3a34f1b3978.jpg';
      }

      await sock.sendMessage(from, {
        image: { url: avatar },
        caption,
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
      console.error('[PRIVACY] Error:', error);
      await sock.sendMessage(from, {
        react: { text: emojis.error || '❌', key: msg.key }
      });
      
      return await sock.sendMessage(from, {
        text: `${emojis.error || '❌'} Failed to fetch privacy settings: ${error.message}`
      }, { quoted: msg });
    }
  }
};
