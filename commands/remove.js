import isAdmin from '../lib/isAdmin.js';

export default {
  name: 'remove',
  description: '😱 Remove member from group',
  async execute(msg, { sock, args, settings }) {
    const from = msg.key.remoteJid;
    
    if (!msg.key.remoteJid.endsWith('@g.us')) {
      return await sock.sendMessage(from, {
        text: '❌ This is a group command only!'
      }, { quoted: msg });
    }

    try {
      const senderNumber = msg.key.participant || msg.key.remoteJid;
      const { isBotAdmin, isSenderAdmin } = await isAdmin(sock, from, senderNumber);

      if (!isSenderAdmin) {
        return await sock.sendMessage(from, {
          text: '❌ You are not an admin!'
        }, { quoted: msg });
      }

      if (!isBotAdmin) {
        return await sock.sendMessage(from, {
          text: '❌ I need admin rights to remove members!'
        }, { quoted: msg });
      }

      const groupMetadata = await sock.groupMetadata(from);
      const participants = groupMetadata.participants;

      // Check if replying to a message
      if (!msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
        return await sock.sendMessage(from, {
          text: '❌ Please reply to a user\'s message to remove them!\n\nUsage: Reply to message + ?remove'
        }, { quoted: msg });
      }

      const targetUser = msg.message.extendedTextMessage.contextInfo.participant;
      const targetAdmin = participants.find(p => p.id === targetUser)?.admin;

      if (targetAdmin) {
        return await sock.sendMessage(from, {
          text: '❌ Cannot remove admin members! Demote them first.'
        }, { quoted: msg });
      }

      await sock.groupParticipantsUpdate(from, [targetUser], "remove");

      await sock.sendMessage(from, {
        text: `@${targetUser.split('@')[0]} has been removed from the group.`,
        mentions: [targetUser]
      }, { quoted: msg });

    } catch (error) {
      await sock.sendMessage(from, {
        text: '❌ Error removing member!'
      }, { quoted: msg });
    }
  }
};
