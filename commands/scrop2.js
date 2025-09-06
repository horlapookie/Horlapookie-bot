
import { Sticker, StickerTypes } from "wa-sticker-formatter";
import { horla } from '../lib/horla.js';
import fs from "fs-extra";

export default horla({
  nomCom: "scrop2",
  categorie: "Conversion", 
  reaction: "👨🏿‍💻"
}, async (msg, { sock, args }) => {
  const from = msg.key.remoteJid;
  
  // Check if replying to a message
  if (!msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
    await sock.sendMessage(from, {
      text: 'Make sure to mention the media'
    }, { quoted: msg });
    return;
  }

  const quotedMsg = msg.message.extendedTextMessage.contextInfo.quotedMessage;
  let pack = args.length > 0 ? args.join(' ') : (msg.pushName || "User");
  let mediamsg;

  if (quotedMsg.imageMessage) {
    mediamsg = quotedMsg.imageMessage;
  } else if (quotedMsg.videoMessage) {
    mediamsg = quotedMsg.videoMessage;
  } else if (quotedMsg.stickerMessage) {
    mediamsg = quotedMsg.stickerMessage;
  } else {
    await sock.sendMessage(from, {
      text: 'Uh media please'
    }, { quoted: msg });
    return;
  }

  try {
    const { downloadMediaMessage } = await import('@whiskeysockets/baileys');
    const targetMsg = {
      key: {
        remoteJid: from,
        id: msg.message.extendedTextMessage.contextInfo.stanzaId,
        participant: msg.message.extendedTextMessage.contextInfo.participant
      },
      message: quotedMsg
    };

    const buffer = await downloadMediaMessage(targetMsg, 'buffer', {});

    let stickerMess = new Sticker(buffer, {
      pack: pack,
      author: "HORLA POOKIE",
      type: StickerTypes.CROPPED,
      categories: ["🤩", "🎉"],
      id: "12345",
      quality: 70,
      background: "transparent",
    });

    const stickerBuffer2 = await stickerMess.toBuffer();
    await sock.sendMessage(from, { 
      sticker: stickerBuffer2 
    }, { quoted: msg });

  } catch (error) {
    console.error('Scrop2 command error:', error);
    await sock.sendMessage(from, {
      text: '❌ Error creating cropped sticker. Please try again.'
    }, { quoted: msg });
  }
});
