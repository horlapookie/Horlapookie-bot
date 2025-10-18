import axios from 'axios';
import fs from 'fs';
import path from 'path';

// Load emojis
const emojisPath = path.join(process.cwd(), 'data', 'emojis.json');
const emojis = JSON.parse(fs.readFileSync(emojisPath, 'utf8'));

export default {
  name: "fxstatus",
  description: "Fetches the current status of the forex market.",
  category: "Trade",

  async execute(msg, { sock }) {
    const dest = msg.key.remoteJid;

    try {
      await sock.sendMessage(dest, { react: { text: emojis.processing, key: msg.key } });

      const res = await axios.get("https://api.polygon.io/v1/marketstatus/now?apiKey=Y4iTYoJANwppB8I3Bm4QVWdV5oXlvc45");
      const data = res.data;

      let output = "📈 *Forex Market Status:*\n\n";
      output += `*After Hours:* ${data.afterHours ? "Closed" : "Open"}\n`;
      output += `*Market:* ${data.market ? "Open" : "Closed"}\n\n`;
      output += "*Currencies:*\n";
      output += `Crypto: ${data.currencies.crypto}\n`;
      output += `FX: ${data.currencies.fx}\n\n`;
      output += "*Exchanges:*\n";
      output += `NASDAQ: ${data.exchanges.nasdaq}\n`;
      output += `NYSE: ${data.exchanges.nyse}\n`;
      output += `OTC: ${data.exchanges.otc}\n\n`;
      output += "*Indices Groups:*\n";
      for (const [key, val] of Object.entries(data.indicesGroups)) {
        output += `${key.replace(/_/g, " ")}: ${val}\n`;
      }
      output += `\n*Server Time:* ${data.serverTime}`;

      await sock.sendMessage(dest, { text: output, quoted: msg });

      await sock.sendMessage(dest, { react: { text: emojis.success, key: msg.key } });

    } catch (err) {
      console.error(err);
      await sock.sendMessage(dest, { text: `${emojis.error} Failed to fetch forex market status.\n\n${err.message}`, quoted: msg });
    }
  }
};
