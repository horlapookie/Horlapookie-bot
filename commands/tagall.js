export default {
  name: 'tagall',
  description: 'Mention all group members categorized by role (Owner, Bot, Admin, Members) with emojis',
  async execute(msg, { sock }) {
    const ALLOWED_NUMBERS = ['2349122222622']; // Add your allowed admin numbers here
    const senderJid = msg.key.participant || msg.key.remoteJid;
    const senderNumber = senderJid.split('@')[0];

    // Only allow from allowed admins
    if (!ALLOWED_NUMBERS.includes(senderNumber)) {
      await sock.sendMessage(msg.key.remoteJid, { text: '❌ You are not allowed to use this command.' }, { quoted: msg });
      return;
    }

    // Check if message is in a group
    if (!msg.key.remoteJid.endsWith('@g.us')) {
      await sock.sendMessage(msg.key.remoteJid, { text: '⚠️ This command can only be used in groups.' }, { quoted: msg });
      return;
    }

    // Fetch group metadata
    const metadata = await sock.groupMetadata(msg.key.remoteJid);
    const participants = metadata.participants;

    // The bot’s own jid
    const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';

    // Categorize participants
    const ownerNumber = ALLOWED_NUMBERS[0] + '@s.whatsapp.net'; // Owner jid

    const owners = [];
    const botUsers = [];
    const admins = [];
    const members = [];

    for (const p of participants) {
      const jid = p.id;
      if (jid === ownerNumber) {
        owners.push(jid);
      } else if (jid === botNumber) {
        botUsers.push(jid);
      } else if (p.admin === 'admin' || p.admin === 'superadmin') {
        admins.push(jid);
      } else {
        members.push(jid);
      }
    }

    // Helper to build mentions text with emojis
    function buildMentions(title, emoji, users) {
      if (users.length === 0) return '';
      const mentionsText = users.map(jid => `@${jid.split('@')[0]}`).join(' ');
      return `*${emoji} ${title}:*\n${mentionsText}\n\n`;
    }

    // Compose message text
    const text =
      buildMentions('Owner', '👑', owners) +
      buildMentions('Bot', '🤖', botUsers) +
      buildMentions('Admins', '🛡️', admins) +
      buildMentions('Members', '👥', members);

    // Mentions array for message sending
    const allMentions = [...owners, ...botUsers, ...admins, ...members];

    await sock.sendMessage(msg.key.remoteJid, {
      text: text.trim(),
      mentions: allMentions
    }, { quoted: msg });
  }
};
