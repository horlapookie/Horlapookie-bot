import axios from 'axios';
import fs from 'fs';
import path from 'path';

// Load emojis
const emojisPath = path.join(process.cwd(), 'data', 'emojis.json');
const emojis = JSON.parse(fs.readFileSync(emojisPath, 'utf8'));

export default {
  name: "hwaifu",
  description: "Sends random NSFW waifu images (group only).",
  category: "NSFW",

  async execute(msg, { sock }) {
    const dest = msg.key.remoteJid;
    const isGroup = dest.endsWith('@g.us');

    // Group-only check
    if (!isGroup) {
      await sock.sendMessage(dest, {
        text: `${emojis.error} This command can only be used in groups.`,
      }, { quoted: msg });
      return;
    }

    const url = 'https://api.waifu.pics/nsfw/waifu';

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
        text: `${emojis.error} Failed to get waifu images.\n\nError: ${error.message}`
      }, { quoted: msg });
    }
  }
};
