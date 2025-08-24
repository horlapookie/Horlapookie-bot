export default {
  name: 'promote',
  description: 'Promote a user to admin (group admins only)',
  async execute(msg, { sock, args }) {
    const from = msg.key.remoteJid;
    if (!from.endsWith('@g.us')) {
      await sock.sendMessage(from, { text: 'This command only works in groups.' }, { quoted: msg });
      return;
    }

    // Only allow allowed numbers or group admins
    const isAllowed = ['2349122222622'].includes(msg.key.participant?.split('@')[0]) || 
      (await sock.groupMetadata(from)).participants.find(p => p.admin === 'admin' && p.id === msg.key.participant);
    if (!isAllowed) {
      await sock.sendMessage(from, { text: 'You do not have permission to promote.' }, { quoted: msg });
      return;
    }

    let userToPromote = null;

    // If replying to a message, promote that user
    if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
      userToPromote = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
    } else if (msg.message?.extendedTextMessage?.contextInfo?.participant) {
      userToPromote = msg.message.extendedTextMessage.contextInfo.participant;
    } else if (args.length > 0) {
      const jid = args[0].includes('@') ? args[0] : `${args[0]}@s.whatsapp.net`;
      userToPromote = jid;
    } else {
      await sock.sendMessage(from, { text: 'Please tag or specify the user to promote.' }, { quoted: msg });
      return;
    }

    try {
      await sock.groupParticipantsUpdate(from, [userToPromote], 'promote');
      await sock.sendMessage(from, { text: `✅ Promoted successfully: @${userToPromote.split('@')[0]}` }, { quoted: msg, mentions: [userToPromote] });
    } catch (error) {
      await sock.sendMessage(from, { text: `❌ Failed to promote: ${error.message}` }, { quoted: msg });
    }
  }
}
export default {
  name: 'promote',
  description: '💐 Promote member to admin',
  async execute(msg, { sock, args, settings }) {
    const from = msg.key.remoteJid;
    
    if (!msg.key.remoteJid.endsWith('@g.us')) {
      return await sock.sendMessage(from, {
        text: '❌ This is a group command only!'
      }, { quoted: msg });
    }

    try {
      const groupMetadata = await sock.groupMetadata(from);
      const participants = groupMetadata.participants;
      const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
      const senderNumber = msg.key.participant || msg.key.remoteJid;
      
      const botAdmin = participants.find(p => p.id === botNumber)?.admin;
      const senderAdmin = participants.find(p => p.id === senderNumber)?.admin;

      if (!senderAdmin) {
        return await sock.sendMessage(from, {
          text: '❌ You are not an admin!'
        }, { quoted: msg });
      }

      if (!botAdmin) {
        return await sock.sendMessage(from, {
          text: '❌ I need admin rights to promote members!'
        }, { quoted: msg });
      }

      // Check if replying to a message
      if (!msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
        return await sock.sendMessage(from, {
          text: '❌ Please reply to a user\'s message to promote them!\n\nUsage: Reply to message + ?promote'
        }, { quoted: msg });
      }

      const targetUser = msg.message.extendedTextMessage.contextInfo.participant;
      const targetAdmin = participants.find(p => p.id === targetUser)?.admin;

      if (targetAdmin) {
        return await sock.sendMessage(from, {
          text: '❌ This member is already an admin!'
        }, { quoted: msg });
      }

      await sock.groupParticipantsUpdate(from, [targetUser], "promote");

      await sock.sendMessage(from, {
        text: `🎊🎊🎊 @${targetUser.split('@')[0]} has been promoted to admin!\n\nCongratulations! 🎉`,
        mentions: [targetUser]
      }, { quoted: msg });

    } catch (error) {
      await sock.sendMessage(from, {
        text: '❌ Error promoting member!'
      }, { quoted: msg });
    }
  }
};
