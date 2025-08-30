export default {
  name: 'kick',
  description: 'Kick a user from the group. Use by replying to the user or tagging them: $kick',
  async execute(msg, { sock, args }) {
    const remoteJid = msg.key.remoteJid;
    if (!remoteJid.endsWith('@g.us')) {
      return sock.sendMessage(remoteJid, { text: '❌ This command can only be used in groups.' }, { quoted: msg });
    }

    const sender = msg.key.participant || msg.key.remoteJid;
    const allowedNumbers = ['2349122222622'];
    const botNumber = sock.user.id.split(':')[0];

    const metadata = await sock.groupMetadata(remoteJid);
    const participants = metadata.participants;

    const isSenderAdmin = participants.some(p => p.id === sender && (p.admin === 'admin' || p.admin === 'superadmin'));
    if (!allowedNumbers.includes(sender.split('@')[0]) && !isSenderAdmin) {
      return sock.sendMessage(remoteJid, { text: '❌ You must be an admin or allowed user to kick members.' }, { quoted: msg });
    }

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

    if (userToKick.split('@')[0] === botNumber) {
      return sock.sendMessage(remoteJid, { text: '❌ I cannot kick myself!' }, { quoted: msg });
    }

    if (metadata.owner === userToKick) {
      return sock.sendMessage(remoteJid, { text: '❌ Cannot kick the group owner!' }, { quoted: msg });
    }

    const botIsAdmin = participants.some(p => p.id === `${botNumber}@s.whatsapp.net` && (p.admin === 'admin' || p.admin === 'superadmin'));
    if (!botIsAdmin) {
      return sock.sendMessage(remoteJid, { text: '❌ I need to be an admin to kick users.' }, { quoted: msg });
    }

    try {
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
