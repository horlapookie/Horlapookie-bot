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
