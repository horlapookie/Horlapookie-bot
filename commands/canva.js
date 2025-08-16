
import { horla } from '../lib/horla.js';
import fs from 'fs';
import path from 'path';

// Load emojis
const emojisPath = path.join(process.cwd(), 'data', 'emojis.json');
const emojis = JSON.parse(fs.readFileSync(emojisPath, 'utf8'));

export default horla({
  nomCom: "canva",
  aliases: ["canvas"],
  categorie: "Image",
  reaction: "🎨"
}, async (msg, { sock, args }) => {
  try {
    const from = msg.key.remoteJid;
    const userName = msg.pushName || "User";

    await sock.sendMessage(from, {
      text: `🎨 *Canva Image Effects*\n\nAvailable effects:\n• shit, wasted, wanted, trigger, trash\n• rip, sepia, rainbow, hitler, invert\n• jail, affect, beautiful, blur, circle\n• facepalm, greyscale, joke\n\nUsage: ?canva <effect>\nExample: ?canva wasted\n\n*Reply to an image for best results*`
    }, { quoted: msg });

  } catch (error) {
    console.error('Canva command error:', error);
    await sock.sendMessage(msg.key.remoteJid, {
      text: `${emojis.error} Error: ${error.message}`
    }, { quoted: msg });
  }
});
