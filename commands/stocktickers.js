import axios from 'axios';
import fs from 'fs';
import path from 'path';

// Load emojis
const emojisPath = path.join(process.cwd(), 'data', 'emojis.json');
const emojis = JSON.parse(fs.readFileSync(emojisPath, 'utf8'));

export default {
  name: "stocktickers",
  description: "Fetches a list of active stock tickers.",
  category: "Trade",

  async execute(msg, { sock }) {
    const dest = msg.key.remoteJid;

    try {
      await sock.sendMessage(dest, { react: { text: emojis.processing, key: msg.key } });

      const limit = 100;
      const res = await axios.get(`https://api.polygon.io/v3/reference/tickers?active=true&limit=${limit}&apiKey=Y4iTYoJANwppB8I3Bm4QVWdV5oXlvc45`);
      const data = res.data;

      if (!data.results || data.results.length === 0) {
        await sock.sendMessage(dest, { text: `${emojis.error} No active stock tickers found.`, quoted: msg });
        return;
      }

      let output = `📊 *Active Stock Tickers (Limit: ${limit}):*\n\n`;
      data.results.forEach(ticker => {
        output += `${ticker.ticker}: ${ticker.name}\n`;
      });

      await sock.sendMessage(dest, { text: output, quoted: msg });
      await sock.sendMessage(dest, { react: { text: emojis.success, key: msg.key } });

    } catch (err) {
      console.error(err);
      await sock.sendMessage(dest, { text: `${emojis.error} Failed to fetch stock tickers.\n\n${err.message}`, quoted: msg });
    }
  }
};
