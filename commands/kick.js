export default {
  name: 'kick',
  description: 'Kick a user from the group. Use by replying to the user or tagging them: $kick',
  adminOnly: true,
  async execute(msg, { sock, args }) {
    const remoteJid = msg.key.remoteJid;
    if (!remoteJid.endsWith('@g.us')) {
      return sock.sendMessage(remoteJid, { text: '❌ This command can only be used in groups.' }, { quoted: msg });
    }

    try {
      // Get group metadata for participant info
      const metadata = await sock.groupMetadata(remoteJid);

      // Get target from reply or tag
      let userToKick = null;
      const contextInfo = msg.message?.extendedTextMessage?.contextInfo;

      if (contextInfo?.mentionedJid?.length) {
        userToKick = contextInfo.mentionedJid[0];
      } else if (contextInfo?.participant) {
        userToKick = contextInfo.participant;
      }

      if (!userToKick) {
        return sock.sendMessage(remoteJid, { text: '❌ Please reply to or tag the user you want to kick.' }, { quoted: msg });
      }

      const botNumber = sock.user.id.split(':')[0];
      if (userToKick.split('@')[0] === botNumber) {
        return sock.sendMessage(remoteJid, { text: '❌ I cannot kick myself!' }, { quoted: msg });
      }

      if (metadata.owner === userToKick) {
        return sock.sendMessage(remoteJid, { text: '❌ Cannot kick the group owner!' }, { quoted: msg });
      }

      await sock.groupParticipantsUpdate(remoteJid, [userToKick], 'remove');
      await sock.sendMessage(remoteJid, {
        text: `✅ Successfully kicked @${userToKick.split('@')[0]}`,
        mentions: [userToKick]
      }, { quoted: msg });
    } catch (error) {
      await sock.sendMessage(remoteJid, { text: `❌ Failed to kick user: ${error.message}` }, { quoted: msg });
    }
  }
};