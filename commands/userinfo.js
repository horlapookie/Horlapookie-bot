import fs from 'fs';
import path from 'path';

export default {
  name: 'userinfo',
  description: 'Get info about a user by replying or tagging',
  async execute(msg, { sock, moderators, isOwner }) {
    try {
      const bannedPath = path.join(process.cwd(), 'banned.json');
      const banned = fs.existsSync(bannedPath) ? JSON.parse(fs.readFileSync(bannedPath)) : {};

      // Get target user from reply or mention
      let targetJid = msg.message?.extendedTextMessage?.contextInfo?.participant ||
                      (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]) ||
                      msg.key.participant || msg.key.remoteJid;

      const targetNumber = targetJid.split('@')[0];

      // Check if banned
      const banInfo = banned[targetNumber];

      // Check if mod or owner
      const isMod = moderators.includes(targetNumber);
      const isBotOwner = isOwner && targetNumber === isOwner;

      // Try to get contact info from WA
      const contact = await sock.onWhatsApp(targetJid);
      const contactName = (contact && contact[0]?.notify) || 'Unknown';

      let infoText = `ℹ️ *User Info*\n\n`;
      infoText += `👤 Number: wa.me/${targetNumber}\n`;
      infoText += `📛 Name: ${contactName}\n`;
      infoText += `⭐ Role: ${isBotOwner ? 'Owner' : isMod ? 'Moderator' : 'Member'}\n`;

      if (banInfo) {
        infoText += `🚫 *Banned*\nReason: ${banInfo.reason}\nBy: @${banInfo.by}\nOn: ${banInfo.time}\n`;
      } else {
        infoText += `✅ Not banned\n`;
      }

      await sock.sendMessage(msg.key.remoteJid, {
        text: infoText,
        mentions: banInfo ? [ `${banInfo.by}@s.whatsapp.net` ] : [],
      }, { quoted: msg });

    } catch (err) {
      await sock.sendMessage(msg.key.remoteJid, {
        text: `❌ Failed to fetch user info: ${err.message}`,
      }, { quoted: msg });
    }
  },
};
