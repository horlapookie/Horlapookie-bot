import fs from 'fs';
import path from 'path';

// Load emojis
const emojisPath = path.join(process.cwd(), 'data', 'emojis.json');
const emojis = JSON.parse(fs.readFileSync(emojisPath, 'utf8'));

export default {
  name: "ping",
  description: "Replies with pong, confirms bot is alive, and shows response time.",
  async execute(msg, { sock }) {
    const start = Date.now();

    // React with processing emoji
    await sock.sendMessage(msg.key.remoteJid, {
      react: { text: emojis.processing, key: msg.key }
    });

    const response = await sock.sendMessage(msg.key.remoteJid, {
      text: `${emojis.success} *Bot is alive bro😆,deploy yours...*`,
    }, { quoted: msg });

    const elapsed = Date.now() - start;

    await sock.sendMessage(msg.key.remoteJid, {
      text: `${emojis.lightning} *Response time:* \`${elapsed} ms\``,
      react: { text: emojis.success, key: msg.key }
    });
  },
};
