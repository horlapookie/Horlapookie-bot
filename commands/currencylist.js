// commands/forex/currencylist.js
import axios from 'axios';
import fs from 'fs';
import path from 'path';

// Load emojis
const emojisPath = path.join(process.cwd(), 'data', 'emojis.json');
const emojis = JSON.parse(fs.readFileSync(emojisPath, 'utf8'));

export default {
  name: "currencylist",
  description: "Lists currency conversion rates.",
  category: "trade-place",

  async execute(msg, { sock }) {
    const dest = msg.key.remoteJid;

    try {
      await sock.sendMessage(dest, {
        react: { text: emojis.processing, key: msg.key }
      });

      const res = await axios.get('https://v6.exchangerate-api.com/v6/0d36793326ec3af0c240a8d4/latest/USD');
      const data = res.data;

      if (!data || data.result !== "success") {
        return sock.sendMessage(dest, {
          text: `${emojis.error} Failed to retrieve currency rates.`
        }, { quoted: msg });
      }

      let msgText = `${emojis.money} *Currency Conversion Rates:*\n\n`;

      for (const [currency, rate] of Object.entries(data.conversion_rates)) {
        msgText += `*${currency}*: ${rate}\n`;
      }

      await sock.sendMessage(dest, { text: msgText }, { quoted: msg });

      await sock.sendMessage(dest, {
        react: { text: emojis.success, key: msg.key }
      });

    } catch (err) {
      console.error('Error fetching currency rates:', err);
      await sock.sendMessage(dest, {
        text: `${emojis.error} Error retrieving currency data. Please try again later.`
      }, { quoted: msg });
    }
  }
};
