
import { Sticker, StickerTypes } from "wa-sticker-formatter";
import { horla } from '../lib/horla.js';
import fs from "fs-extra";
import axios from 'axios';
import FormData from 'form-data';

export default horla({
  nomCom: "write2",
  categorie: "Conversion",
  reaction: "👨🏿‍💻"
}, async (msg, { sock, args }) => {
  const from = msg.key.remoteJid;

  // Check if replying to a message
  if (!msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
    await sock.sendMessage(from, {
      text: 'Please mention an image'
    }, { quoted: msg });
    return;
  }

  const quotedMsg = msg.message.extendedTextMessage.contextInfo.quotedMessage;

  if (!quotedMsg.imageMessage) {
    await sock.sendMessage(from, {
      text: 'The command only works with images'
    }, { quoted: msg });
    return;
  }

  const text = args.join(' ');
  
  if (!text || text === null) {
    await sock.sendMessage(from, {
      text: 'Make sure to insert text'
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

    const imageBuffer = await downloadMediaMessage(targetMsg, 'buffer', {});
    
    // Create a temporary file
    const tempPath = `./temp/image_${Date.now()}.jpg`;
    if (!fs.existsSync('./temp')) {
      fs.mkdirSync('./temp');
    }
    fs.writeFileSync(tempPath, imageBuffer);

    // Create a FormData object
    const data = new FormData();
    data.append('image', fs.createReadStream(tempPath));

    // Configure headers
    const clientId = 'b40a1820d63cd4e'; // Replace with your Imgur client ID
    const headers = {
      'Authorization': `Client-ID ${clientId}`,
      ...data.getHeaders()
    };

    // Configure the query
    const config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'https://api.imgur.com/3/image',
      headers: headers,
      data: data
    };

    const response = await axios(config);
    const imageUrl = response.data.data.link;

    // Use imageUrl for meme creation
    const meme = `https://api.memegen.link/images/custom/-/${encodeURIComponent(text)}.png?background=${imageUrl}`;

    // Create the sticker
    const stickerMess = new Sticker(meme, {
      pack: msg.pushName || "User",
      author: 'HORLA POOKIE',
      type: StickerTypes.FULL,
      categories: ["🤩", "🎉"],
      id: "12345",
      quality: 70,
      background: "transparent",
    });

    const stickerBuffer2 = await stickerMess.toBuffer();
    await sock.sendMessage(from, { 
      sticker: stickerBuffer2 
    }, { quoted: msg });

    // Clean up temp file
    fs.unlinkSync(tempPath);

  } catch (error) {
    console.error('Write2 command error:', error);
    await sock.sendMessage(from, {
      text: 'An error occurred while creating the meme.'
    }, { quoted: msg });
  }
});
