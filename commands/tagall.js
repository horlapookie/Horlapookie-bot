import fs from 'fs';
import path from 'path';

// Load emojis
const emojisPath = path.join(process.cwd(), 'data', 'emojis.json');
const emojis = JSON.parse(fs.readFileSync(emojisPath, 'utf8'));

export default {
  name: 'tagall',
  description: '📯 Tag all group members with emojis',
  async execute(msg, { sock, args }) {
    const from = msg.key.remoteJid;

    // Only in groups
    if (!from.endsWith('@g.us')) {
      return await sock.sendMessage(from, {
        text: '❌ This is a group command only!'
      }, { quoted: msg });
    }

    try {
      const groupMetadata = await sock.groupMetadata(from);
      const participants = groupMetadata.participants;
      const senderNumber = msg.key.participant;

      // Check if sender is admin
      const senderAdmin = participants.find(p => p.id === senderNumber)?.admin;
      if (!senderAdmin) {
        return await sock.sendMessage(from, {
          text: '❌ You are not an admin!'
        }, { quoted: msg });
      }

      // React with processing emoji
      await sock.sendMessage(from, {
        react: { text: emojis.processing, key: msg.key }
      });

      const message = args.length > 0 ? args.join(' ') : 'No message provided';
      const reactionEmojis = ['💡','☢️','🗡️','🖌️','🪫','🔋','⚙️','🕶️','🌡️','✏️','📌','©️'];
      const randomEmoji = reactionEmojis[Math.floor(Math.random() * reactionEmojis.length)];

      let tagMessage = `┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n`;
      tagMessage += `🌟 *HORLA POOKIE TAGS* 🌟\n`;
      tagMessage += `┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n`;
      tagMessage += `👥 Group: ${groupMetadata.subject} 🚀\n`;
      tagMessage += `👤 By: @${senderNumber.split('@')[0]} 👋\n`;
      tagMessage += `📜 Message: *${message}* 📝\n`;
      tagMessage += `┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n\n`;

      participants.forEach(p => {
        tagMessage += `${randomEmoji} @${p.id.split('@')[0]}\n`;
      });

      await sock.sendMessage(from, {
        text: tagMessage,
        mentions: participants.map(p => p.id)
      }, { quoted: msg });

      // React with success emoji
      await sock.sendMessage(from, {
        react: { text: emojis.success, key: msg.key }
      });

    } catch (error) {
      console.error(error);
      await sock.sendMessage(from, {
        text: '❌ Error tagging members!'
      }, { quoted: msg });
    }
  }
};