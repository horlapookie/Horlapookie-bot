import { horla } from '../lib/horla.js';

export default horla({
  nomCom: 'announce',
  categorie: "Group",
  reaction: "📢"
}, async (msg, { sock, args, isGroup, isOwner }) => {
    const remoteJid = msg.key.remoteJid;
    if (!remoteJid.endsWith('@g.us')) {
      await sock.sendMessage(remoteJid, { text: 'This command works only in groups!' }, { quoted: msg });
      return;
    }

    const senderId = msg.key.participant.split('@')[0];
    const allowedNumbers = ['2349122222622']; // your owner number(s)

    // Check if sender is owner or admin
    const metadata = await sock.groupMetadata(remoteJid);
    const participants = metadata.participants;
    const sender = participants.find(p => p.id.split('@')[0] === senderId);
    if (!sender || (!sender.admin && !allowedNumbers.includes(senderId))) {
      await sock.sendMessage(remoteJid, { text: '❌ You must be an admin or the owner to use this command.' }, { quoted: msg });
      return;
    }

    if (args.length === 0) {
      await sock.sendMessage(remoteJid, { text: 'Usage: $announce Your announcement here' }, { quoted: msg });
      return;
    }

    const announcementText = args.join(' ');

    // Build mention list
    const mentions = participants.map(p => p.id);

    // Build message with emojis and bold announcement
    const message = 
      `📢 *Announcement* 📢\n\n` +
      `*${announcementText}*\n\n` +
      `@everyone`;

    await sock.sendMessage(remoteJid, {
      text: message,
      mentions,
    });
});