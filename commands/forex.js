// commands/forex/forex.js
import axios from 'axios';
import fs from 'fs';
import path from 'path';

// Load emojis
const emojisPath = path.join(process.cwd(), 'data', 'emojis.json');
const emojis = JSON.parse(fs.readFileSync(emojisPath, 'utf8'));

export default {
  name: "forex",
  description: "Fetches the latest forex news.",
  category: "trade-place",

  async execute(msg, { sock }) {
    const dest = msg.key.remoteJid;

    try {
      await sock.sendMessage(dest, {
        react: { text: emojis.processing, key: msg.key }
      });

      const res = await axios.get("https://api.polygon.io/v2/reference/news?apiKey=Y4iTYoJANwppB8I3Bm4QVWdV5oXlvc45");
      const articles = res.data.results;

      if (!articles || articles.length === 0) {
        return await sock.sendMessage(dest, {
          text: `${emojis.error} No forex news available at the moment.`
        }, { quoted: msg });
      }

      let output = `📈 *Latest Forex News*\n\n`;
      articles.forEach((a, i) => {
        output += `*Title:* ${a.title}\n`;
        output += `*Publisher:* ${a.publisher?.name || "Unknown"}\n`;
        output += `*Published:* ${a.published_utc}\n`;
        output += `*URL:* ${a.article_url}\n\n`;
        if (i < articles.length - 1) output += "---\n\n";
      });

      await sock.sendMessage(dest, { text: output }, { quoted: msg });

      await sock.sendMessage(dest, {
        react: { text: emojis.success, key: msg.key }
      });
    } catch (err) {
      console.error('Error fetching forex news:', err);
      await sock.sendMessage(dest, {
        text: `${emojis.error} Failed to fetch forex news.`
      }, { quoted: msg });
    }
  }
};
