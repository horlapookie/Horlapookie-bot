
import { horla } from '../lib/horla.js';
import fs from "fs-extra";
import axios from 'axios';
import FormData from 'form-data';

async function uploadToTelegraph(Path) {
  if (!fs.existsSync(Path)) {
    throw new Error("File not found");
  }

  try {
    const form = new FormData();
    form.append("file", fs.createReadStream(Path));

    const { data } = await axios.post("https://telegra.ph/upload", form, {
      headers: {
        ...form.getHeaders(),
      },
    });

    if (data && data[0] && data[0].src) {
      return "https://telegra.ph" + data[0].src;
    } else {
      throw new Error("Error retrieving link");
    }
  } catch (err) {
    throw new Error(String(err));
  }
}

export default horla({
  nomCom: "url2",
  categorie: "Conversion",
  reaction: "👨🏿‍💻"
}, async (msg, { sock }) => {
  const from = msg.key.remoteJid;

  // Check if replying to a message
  if (!msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
    await sock.sendMessage(from, {
      text: 'Mention an image or video'
    }, { quoted: msg });
    return;
  }

  const quotedMsg = msg.message.extendedTextMessage.contextInfo.quotedMessage;
  let mediaPath;

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

    if (quotedMsg.videoMessage) {
      const buffer = await downloadMediaMessage(targetMsg, 'buffer', {});
      if (!fs.existsSync('./temp')) {
        fs.mkdirSync('./temp');
      }
      mediaPath = `./temp/video_${Date.now()}.mp4`;
      fs.writeFileSync(mediaPath, buffer);
    } else if (quotedMsg.imageMessage) {
      const buffer = await downloadMediaMessage(targetMsg, 'buffer', {});
      if (!fs.existsSync('./temp')) {
        fs.mkdirSync('./temp');
      }
      mediaPath = `./temp/image_${Date.now()}.jpg`;
      fs.writeFileSync(mediaPath, buffer);
    } else {
      await sock.sendMessage(from, {
        text: 'Mention an image or video'
      }, { quoted: msg });
      return;
    }

    const telegraphUrl = await uploadToTelegraph(mediaPath);
    fs.unlinkSync(mediaPath); // Delete file after use

    await sock.sendMessage(from, {
      text: telegraphUrl
    }, { quoted: msg });

  } catch (error) {
    console.error('URL2 command error:', error);
    await sock.sendMessage(from, {
      text: 'Oops error occurred while creating link'
    }, { quoted: msg });
    
    if (mediaPath && fs.existsSync(mediaPath)) {
      fs.unlinkSync(mediaPath);
    }
  }
});
