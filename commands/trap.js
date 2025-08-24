import axios from 'axios';
import fs from 'fs';
import path from 'path';

// Load emojis
const emojisPath = path.join(process.cwd(), 'data', 'emojis.json');
const emojis = JSON.parse(fs.readFileSync(emojisPath, 'utf8'));

export default {
  name: "trap",
  description: "Sends random NSFW trap images (group only).",
  category: "NSFW",

  async execute(msg, { sock }) {
    const dest = msg.key.remoteJid;
    const isGroup = dest.endsWith('@g.us');

    // Only allow in groups
    if (!isGroup) {
      await sock.sendMessage(dest, {
        text: `${emojis.error} This command can only be used in group chats.`,
      }, { quoted: msg });
      return;
    }

    const url = 'https://api.waifu.pics/nsfw/trap';

    try {
      await sock.sendMessage(dest, {
        react: { text: emojis.processing, key: msg.key }
      });

      for (let i = 0; i < 5; i++) {
        const response = await axios.get(url);
        const imageUrl = response.data.url;

        await sock.sendMessage(dest, {
          image: { url: imageUrl }
        }, { quoted: msg });
      }

      await sock.sendMessage(dest, {
        react: { text: emojis.success, key: msg.key }
      });

    } catch (error) {
      await sock.sendMessage(dest, {
        text: `${emojis.error} Failed to fetch trap images.\n\nError: ${error.message}`,
      }, { quoted: msg });
    }
  }
};
