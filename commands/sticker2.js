
import { Sticker, StickerTypes } from "wa-sticker-formatter";
import { horla } from '../lib/horla.js';
import traduire from '../lib/traduire.js';
import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import fs from "fs-extra";
import axios from 'axios';
import FormData from 'form-data';
import { exec } from "child_process";

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
      throw new Error("Error retrieving video link");
    }
  } catch (err) {
    throw new Error(String(err));
  }
}

const alea = (ext) => {
  return `${Math.floor(Math.random() * 10000)}${ext}`;
};

export default horla({
  nomCom: "sticker2",
  categorie: "Conversion",
  reaction: "👨🏿‍💻"
}, async (msg, { sock, args }) => {
  const from = msg.key.remoteJid;
  const mtype = Object.keys(msg.message || {})[0];
  const msgText = JSON.stringify(msg.message);
  
  const mime = mtype === "imageMessage" || mtype === "videoMessage";
  const tagImage = mtype === "extendedTextMessage" && msgText.includes("imageMessage");
  const tagVideo = mtype === "extendedTextMessage" && msgText.includes("videoMessage");

  const stickerFileName = alea(".webp");
  let sticker;

  try {
    // Handle image
    if (mtype === "imageMessage" || tagImage) {
      let downloadFilePath;
      if (msg.message.imageMessage) {
        downloadFilePath = msg.message.imageMessage;
      } else {
        downloadFilePath = msg.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage;
      }

      const media = await downloadContentFromMessage(downloadFilePath, "image");
      let buffer = Buffer.from([]);
      for await (const elm of media) {
        buffer = Buffer.concat([buffer, elm]);
      }

      sticker = new Sticker(buffer, {
        pack: "HORLA POOKIE Bot",
        author: msg.pushName || "User",
        type: args.includes("crop") || args.includes("c") ? StickerTypes.CROPPED : StickerTypes.FULL,
        categories: ["🤖", "🎉"],
        quality: 100,
      });
    } 
    // Handle video
    else if (mtype === "videoMessage" || tagVideo) {
      let downloadFilePath;
      if (msg.message.videoMessage) {
        downloadFilePath = msg.message.videoMessage;
      } else {
        downloadFilePath = msg.message.extendedTextMessage.contextInfo.quotedMessage.videoMessage;
      }

      const stream = await downloadContentFromMessage(downloadFilePath, "video");
      let buffer = Buffer.from([]);
      for await (const elm of stream) {
        buffer = Buffer.concat([buffer, elm]);
      }

      sticker = new Sticker(buffer, {
        pack: "HORLA POOKIE Bot",
        author: msg.pushName || "User",
        type: args.includes("-r") || args.includes("-c") ? StickerTypes.CROPPED : StickerTypes.FULL,
        categories: ["🤖", "🎉"],
        quality: 40,
      });
    } else {
      await sock.sendMessage(from, {
        text: "Please mention an image or video!"
      }, { quoted: msg });
      return;
    }

    await sticker.toFile(stickerFileName);
    await sock.sendMessage(from, {
      sticker: fs.readFileSync(stickerFileName),
    }, { quoted: msg });

    try {
      fs.unlinkSync(stickerFileName);
    } catch (e) {
      console.log(e);
    }

  } catch (error) {
    console.error('Sticker2 command error:', error);
    await sock.sendMessage(from, {
      text: '❌ Error creating sticker. Please try again.'
    }, { quoted: msg });
  }
});
