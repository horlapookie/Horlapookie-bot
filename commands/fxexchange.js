import axios from 'axios';
import fs from 'fs';
import path from 'path';

// Load emojis
const emojisPath = path.join(process.cwd(), 'data', 'emojis.json');
const emojis = JSON.parse(fs.readFileSync(emojisPath, 'utf8'));

export default {
  name: "fxexchange",
  description: "Fetches the latest foreign exchange rates against the US Dollar.",
  category: "Trade",

  async execute(msg, { sock }) {
    const dest = msg.key.remoteJid;

    try {
      await sock.sendMessage(dest, { react: { text: emojis.processing, key: msg.key } });

      const currencyCode = "USD";
      const res = await axios.get(`https://api.exchangerate-api.com/v4/latest/${currencyCode}`);
      const data = res.data;

      if (!data || !data.rates) {
        await sock.sendMessage(dest, { text: `${emojis.error} Failed to fetch exchange rates for ${currencyCode}.`, quoted: msg });
        return;
      }

      let output = `💱 *Foreign Exchange Rates (${data.base}):*\n\n`;
      for (const [currency, rate] of Object.entries(data.rates)) {
        output += `${currency}: ${rate.toFixed(4)}\n`;
      }

      await sock.sendMessage(dest, { text: output, quoted: msg });
      await sock.sendMessage(dest, { react: { text: emojis.success, key: msg.key } });

    } catch (err) {
      console.error(err);
      await sock.sendMessage(dest, { text: `${emojis.error} Failed to fetch exchange rates.\n\n${err.message}`, quoted: msg });
    }
  }
};
