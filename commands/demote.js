import fs from 'fs';
import path from 'path';

// Load emojis
const emojisPath = path.join(process.cwd(), 'data', 'emojis.json');
const emojis = JSON.parse(fs.readFileSync(emojisPath, 'utf8'));

export default {
  name: 'demote',
  description: '👨🏿‍💼 Demote admin to member',
  async execute(msg, { sock, args }) {
    const from = msg.key.remoteJid;

    if (!from.endsWith('@g.us')) {
      return await sock.sendMessage(from, {
        text: '❌ This command only works in groups!'
      }, { quoted: msg });
    }

    try {
      const groupMetadata = await sock.groupMetadata(from);
      const participants = groupMetadata.participants;
      const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
      const senderNumber = msg.key.participant;

      const senderAdmin = participants.find(p => p.id === senderNumber)?.admin;
      const botAdmin = participants.find(p => p.id === botNumber)?.admin;

      if (!senderAdmin) {
        return await sock.sendMessage(from, {
          text: '❌ You are not an admin!'
        }, { quoted: msg });
      }

      if (!botAdmin) {
        return await sock.sendMessage(from, {
          text: '❌ I need admin rights to demote members!'
        }, { quoted: msg });
      }

      // Determine target user
      let targetUser = null;

      // Reply
      if (msg.message?.extendedTextMessage?.contextInfo?.participant) {
        targetUser = msg.message.extendedTextMessage.contextInfo.participant;
      }
      // Mention
      else if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
        targetUser = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
      }
      // Argument
      else if (args.length > 0) {
        targetUser = args[0].includes('@') ? args[0] : `${args[0]}@s.whatsapp.net`;
      } else {
        return await sock.sendMessage(from, {
          text: '❌ Please reply to a user message, mention a user, or provide their number to demote.'
        }, { quoted: msg });
      }

      // Check if target is actually admin
      const targetAdmin = participants.find(p => p.id === targetUser)?.admin;
      if (!targetAdmin) {
        return await sock.sendMessage(from, {
          text: '❌ This member is not an admin!'
        }, { quoted: msg });
      }

      // Demote
      await sock.groupParticipantsUpdate(from, [targetUser], 'demote');

      await sock.sendMessage(from, {
        text: `✅ @${targetUser.split('@')[0]} has been demoted from admin.`,
        mentions: [targetUser]
      }, { quoted: msg });

      // Optional: react success
      await sock.sendMessage(from, {
        react: { text: emojis.success, key: msg.key }
      });

    } catch (error) {
      console.error('Demote error:', error);
      await sock.sendMessage(from, {
        text: `❌ Error demoting member: ${error.message}`
      }, { quoted: msg });
    }
  }
};