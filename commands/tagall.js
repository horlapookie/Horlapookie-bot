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
export default {
  name: 'tagall',
  description: '📯 Tag all group members',
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
      const senderNumber = msg.key.participant || msg.key.remoteJid;
      
      const senderAdmin = participants.find(p => p.id === senderNumber)?.admin;

      if (!senderAdmin) {
        return await sock.sendMessage(from, {
          text: '❌ You are not an admin!'
        }, { quoted: msg });
      }

      const message = args.length > 0 ? args.join(' ') : 'No message provided';
      const emojis = ['💡', '☢️', '🗡️', '🖌️', '🪫', '🔋', '⚙️', '🕶️', '🌡️', '✏️', '📌', '©️'];
      const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];

      let tagMessage = `┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n`;
      tagMessage += `🌟 *HORLA POOKIE TAGS* 🌟\n`;
      tagMessage += `┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n`;
      tagMessage += `👥 Group: ${groupMetadata.subject} 🚀\n`;
      tagMessage += `👤 By: @${senderNumber.split('@')[0]} 👋\n`;
      tagMessage += `📜 Message: *${message}* 📝\n`;
      tagMessage += `┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n\n`;

      participants.forEach(participant => {
        tagMessage += `${randomEmoji} @${participant.id.split('@')[0]}\n`;
      });

      await sock.sendMessage(from, {
        text: tagMessage,
        mentions: participants.map(p => p.id)
      }, { quoted: msg });

    } catch (error) {
      await sock.sendMessage(from, {
        text: '❌ Error tagging members!'
      }, { quoted: msg });
    }
  }
};
