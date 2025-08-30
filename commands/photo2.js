
import { horla } from '../lib/horla.js';
import fs from "fs-extra";
import { exec } from "child_process";

export default horla({
  nomCom: "photo2",
  categorie: "Conversion",
  reaction: "👨🏿‍💻"
}, async (msg, { sock }) => {
  const from = msg.key.remoteJid;

  // Check if replying to a message
  if (!msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
    await sock.sendMessage(from, {
      text: 'Make sure to mention the media'
    }, { quoted: msg });
    return;
  }

  const quotedMsg = msg.message.extendedTextMessage.contextInfo.quotedMessage;

  if (!quotedMsg.stickerMessage) {
    await sock.sendMessage(from, {
      text: 'Um mention a non-animated sticker'
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
    
    const alea = (ext) => {
      return `${Math.floor(Math.random() * 10000)}${ext}`;
    };

    if (!fs.existsSync('./temp')) {
      fs.mkdirSync('./temp');
    }

    const mediaMess = `./temp/sticker_${alea('.webp')}`;
    const ran = `./temp/photo_${alea('.png')}`;

    fs.writeFileSync(mediaMess, buffer);

    exec(`ffmpeg -i ${mediaMess} ${ran}`, (err) => {
      fs.unlinkSync(mediaMess);
      if (err) {
        sock.sendMessage(from, {
          text: 'A non-animated sticker please',
        }, { quoted: msg });
        return;
      }
      
      let imageBuffer = fs.readFileSync(ran);
      sock.sendMessage(from, { 
        image: imageBuffer 
      }, { quoted: msg });
      fs.unlinkSync(ran);
    });

  } catch (error) {
    console.error('Photo2 command error:', error);
    await sock.sendMessage(from, {
      text: '❌ Error converting sticker to photo. Please try again.'
    }, { quoted: msg });
  }
});
