import fs from 'fs';
import path from 'path';

// Load emojis
const emojisPath = path.join(process.cwd(), 'data', 'emojis.json');
const emojis = JSON.parse(fs.readFileSync(emojisPath, 'utf8'));

export default {
  name: 'promote',
  description: '💐 Promote a member to admin',
  adminOnly: true,
  async execute(msg, { sock, args }) {
    const from = msg.key.remoteJid;

    if (!from.endsWith('@g.us')) {
      return await sock.sendMessage(from, {
        text: '❌ This command only works in groups!'
      }, { quoted: msg });
    }

    try {
      // Get group metadata for participant info
      const metadata = await sock.groupMetadata(from);
      const participants = metadata.participants;

      // Determine target user
      let targetUser = null;
      if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
        targetUser = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
      } else if (msg.message?.extendedTextMessage?.contextInfo?.participant) {
        targetUser = msg.message.extendedTextMessage.contextInfo.participant;
      } else if (args.length > 0) {
        targetUser = args[0].includes('@') ? args[0] : `${args[0]}@s.whatsapp.net`;
      } else {
        return await sock.sendMessage(from, {
          text: '❌ Please reply to a user message or tag a user to promote.'
        }, { quoted: msg });
      }

      // Check if already admin
      const targetAdmin = participants.find(p => p.id === targetUser)?.admin;
      if (targetAdmin) {
        return await sock.sendMessage(from, {
          text: '❌ This member is already an admin!'
        }, { quoted: msg });
      }

      // Promote
      await sock.groupParticipantsUpdate(from, [targetUser], 'promote');

      await sock.sendMessage(from, {
        text: `🎊 @${targetUser.split('@')[0]} has been promoted to admin!`,
        mentions: [targetUser]
      }, { quoted: msg });

      // Optional: React with success emoji
      await sock.sendMessage(from, {
        react: { text: emojis.success, key: msg.key }
      });

    } catch (error) {
      console.error(error);
      await sock.sendMessage(from, {
        text: `❌ Error promoting member: ${error.message}`
      }, { quoted: msg });
    }
  }
};