export default {
  name: 'del',
  aliases: ['delete'],
  description: 'Delete a message by replying with $del or $delete',
  async execute(msg, { sock }) {
    const remoteJid = msg.key.remoteJid;

    if (!msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
      await sock.sendMessage(remoteJid, { text: 'Please reply to the message you want to delete with $del or $delete.' }, { quoted: msg });
      return;
    }

    const quotedMsgKey = msg.message.extendedTextMessage.contextInfo.stanzaId
      ? {
        remoteJid,
        id: msg.message.extendedTextMessage.contextInfo.stanzaId,
        fromMe: false,
        participant: msg.message.extendedTextMessage.contextInfo.participant || remoteJid
      }
      : null;

    if (!quotedMsgKey) {
      await sock.sendMessage(remoteJid, { text: 'Unable to find the quoted message to delete.' }, { quoted: msg });
      return;
    }

    try {
      await sock.sendMessage(remoteJid, { delete: quotedMsgKey });
    } catch (error) {
      await sock.sendMessage(remoteJid, { text: 'Failed to delete message. Maybe I do not have permission?' }, { quoted: msg });
    }
  }
};
