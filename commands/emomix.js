
import axios from 'axios';
import { Sticker, StickerTypes } from 'wa-sticker-formatter';
import { horla } from '../lib/horla.js';
import { channelInfo } from '../lib/messageConfig.js';

export default horla({
  nomCom: "emomix",
  aliases: ["emojimix"],
  categorie: "Conversion",
  reaction: "😀"
}, async (msg, { sock, args }) => {
  const from = msg.key.remoteJid;

  if (!args || args.length !== 1) {
    await sock.sendMessage(from, {
      text: "Incorrect use. Example: ?emomix 😀;🥰",
      ...channelInfo
    }, { quoted: msg });
    return;
  }

  const emojis = args.join(' ').split(';');
  if (emojis.length !== 2) {
    await sock.sendMessage(from, {
      text: "Please specify two emojis using a ';' as a separator.",
      ...channelInfo
    }, { quoted: msg });
    return;
  }

  const emoji1 = emojis[0].trim();
  const emoji2 = emojis[1].trim();

  try {
    const response = await axios.get(`https://levanter.onrender.com/emix?q=${emoji1}${emoji2}`);

    if (response.data.status === true) {
      const stickerMess = new Sticker(response.data.result, {
        pack: "HORLA POOKIE",
        type: StickerTypes.CROPPED,
        categories: ["🤩", "🎉"],
        id: "12345",
        quality: 70,
        background: "transparent",
      });

      const stickerBuffer = await stickerMess.toBuffer();

      await sock.sendMessage(from, { 
        sticker: stickerBuffer 
      }, { quoted: msg });

    } else {
      await sock.sendMessage(from, {
        text: "❌ Unable to create emoji mix.",
        ...channelInfo
      }, { quoted: msg });
    }
  } catch (error) {
    console.error('Emoji mix error:', error);
    await sock.sendMessage(from, {
      text: "❌ An error occurred while creating the emoji mix.",
      ...channelInfo
    }, { quoted: msg });
  }
});
