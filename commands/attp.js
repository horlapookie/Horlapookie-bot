
import { Sticker, StickerTypes } from "wa-sticker-formatter";
import { Jimp } from "jimp";
import fs from "fs";
import path from "path";
import Crypto from "crypto";

export default {
  name: "attp",
  aliases: [],
  description: "🎨 Convert text to animated sticker",
  async execute(msg, { sock, args }) {
    if (!args.length) {
      await sock.sendMessage(msg.key.remoteJid, {
        text: `🎨 *ATTP Text to Sticker*

📝 Convert your text into a sticker!

*Usage:* ?attp <text>
*Example:* ?attp Hello World

✨ Your text will be converted into a sticker format!`
      }, { quoted: msg });
      return;
    }

    const text = args.join(' ');

    if (text.length > 50) {
      await sock.sendMessage(msg.key.remoteJid, {
        text: "❌ Text is too long! Please keep it under 50 characters."
      }, { quoted: msg });
      return;
    }

    try {
      await sock.sendMessage(msg.key.remoteJid, {
        text: "🎨 Converting text to sticker... Please wait!"
      }, { quoted: msg });

      const width = 512;
      const height = 512;
      const tempDir = './temp';
      
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir);
      }

      const imagePath = path.join(tempDir, `attp-${Date.now()}.png`);

      // Create image with text using Jimp
      const font = await Jimp.loadFont(Jimp.FONT_SANS_64_BLACK);
      const image = new Jimp(width, height, '#FFFFFF');

      const textWidth = Jimp.measureText(font, text);
      const textHeight = Jimp.measureTextHeight(font, text, width);

      const x = (width - textWidth) / 2;
      const y = (height - textHeight) / 2;

      image.print(font, x, y, text, width);
      await image.writeAsync(imagePath);

      // Convert to sticker using wa-sticker-formatter
      const imageBuffer = fs.readFileSync(imagePath);
      
      const sticker = new Sticker(imageBuffer, {
        pack: "HORLA POOKIE Bot",
        author: "HORLA POOKIE",
        type: StickerTypes.DEFAULT,
        categories: ['🎨', '📝'],
        id: Crypto.randomBytes(16).toString('hex'),
        quality: 50,
        background: 'transparent'
      });

      const stickerBuffer = await sticker.toBuffer();

      await sock.sendMessage(msg.key.remoteJid, {
        sticker: stickerBuffer
      }, { quoted: msg });

      // Clean up
      fs.unlinkSync(imagePath);

    } catch (error) {
      console.error('ATTP command error:', error);
      await sock.sendMessage(msg.key.remoteJid, {
        text: '❌ Failed to create text sticker. Please try again later.'
      }, { quoted: msg });
    }
  }
};
