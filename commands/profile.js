export default {
  name: 'profile',
  description: 'Show profile picture and bio of the user or mentioned user',
  async execute(msg, { sock }) {
    try {
      const remoteJid = msg.key.remoteJid;
      const isGroup = remoteJid.endsWith('@g.us');
      let userJid;

      // If reply to message, get that user's jid, else sender's jid
      if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
        userJid = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
      } else if (msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
        userJid = msg.message.extendedTextMessage.contextInfo.participant;
      } else {
        userJid = msg.key.participant || msg.key.remoteJid;
      }

      // Get profile picture
      let profilePicUrl;
      try {
        profilePicUrl = await sock.profilePictureUrl(userJid, 'image');
      } catch {
        profilePicUrl = null;
      }

      // Get status (bio)
      let status = '';
      try {
        const statusObj = await sock.fetchStatus(userJid);
        status = statusObj?.status || 'No status set.';
      } catch {
        status = 'No status available.';
      }

      // Build message
      const text = `📋 *Profile Info*\n\n` +
        `👤 User: @${userJid.split('@')[0]}\n` +
        `📝 Bio: ${status}`;

      const message = {
        text,
        mentions: [userJid]
      };

      if (profilePicUrl) {
        // Send profile pic with caption
        await sock.sendMessage(remoteJid, {
          image: { url: profilePicUrl },
          caption: text,
          mentions: [userJid]
        });
      } else {
        // Send just text if no profile pic
        await sock.sendMessage(remoteJid, message);
      }
    } catch (error) {
      console.error('Error in profile command:', error);
      await sock.sendMessage(msg.key.remoteJid, { text: '❌ Failed to fetch profile info.' }, { quoted: msg });
    }
  }
};
