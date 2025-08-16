export default {
  name: 'demote',
  description: 'Demote an admin to member (group admins only)',
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
      await sock.sendMessage(from, { text: 'You do not have permission to demote.' }, { quoted: msg });
      return;
    }

    let userToDemote = null;

    if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
      userToDemote = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
    } else if (msg.message?.extendedTextMessage?.contextInfo?.participant) {
      userToDemote = msg.message.extendedTextMessage.contextInfo.participant;
    } else if (args.length > 0) {
      const jid = args[0].includes('@') ? args[0] : `${args[0]}@s.whatsapp.net`;
      userToDemote = jid;
    } else {
      await sock.sendMessage(from, { text: 'Please tag or specify the user to demote.' }, { quoted: msg });
      return;
    }

    try {
      await sock.groupParticipantsUpdate(from, [userToDemote], 'demote');
      await sock.sendMessage(from, { text: `✅ Demoted successfully: @${userToDemote.split('@')[0]}` }, { quoted: msg, mentions: [userToDemote] });
    } catch (error) {
      await sock.sendMessage(from, { text: `❌ Failed to demote: ${error.message}` }, { quoted: msg });
    }
  }
}
