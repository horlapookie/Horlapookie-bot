import { horla } from '../lib/horla.js';
import { uploadToImgur } from '../lib/imgur.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import config from '../config.js';

// Load emojis
const emojisPath = path.join(process.cwd(), 'data', 'emojis.json');
const emojis = JSON.parse(fs.readFileSync(emojisPath, 'utf8'));

export const sion = horla({
  nomCom: "sion",
  aliases: ["analize", "generate"],
  reaction: '🔍',
  categorie: "AI"
}, async (msg, { sock, args }) => {
  try {
    const from = msg.key.remoteJid;
    const userName = msg.pushName || "User";
    const text = args.join(" ").trim();

    if (msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
      const quotedMsg = msg.message.extendedTextMessage.contextInfo.quotedMessage;

      if (quotedMsg.imageMessage) {
        try {
          if (!text) {
            return await sock.sendMessage(from, {
              text: `Please provide an instruction with the image, ${userName}.`
            }, { quoted: msg });
          }

          await sock.sendMessage(from, {
            text: "_A moment, nexus ai is analyzing contents of the image..._"
          }, { quoted: msg });

          // Download and save the image
          const mediaData = await sock.downloadMediaMessage(msg.message.extendedTextMessage.contextInfo);

          // Upload the image to imgur
          const imageUrl = await uploadToImgur(mediaData);

          // Send request to the Gemini API with the image and instruction
          const genAI = new GoogleGenerativeAI(config.geminiApiKey);

          // Function to convert URL to generative part
          async function urlToGenerativePart(url, mimeType) {
            const response = await axios.get(url, { responseType: 'arraybuffer' });
            const data = Buffer.from(response.data).toString('base64');
            return { inlineData: { data, mimeType } };
          }

          const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
          const image = [await urlToGenerativePart(imageUrl, 'image/jpeg')];

          const result = await model.generateContent([text, ...image]);
          const response = await result.response;
          const resp = response.text();

          await sock.sendMessage(from, {
            text: resp
          }, { quoted: msg });

        } catch (e) {
          console.error('Sion error:', e);
          await sock.sendMessage(from, {
            text: `I am unable to analyze images at the moment, ${userName}. Error: ${e.message}`
          }, { quoted: msg });
        }
      } else {
        return await sock.sendMessage(from, {
          text: `Please provide an image to analyze, ${userName}.`
        }, { quoted: msg });
      }
    } else {
      return await sock.sendMessage(from, {
        text: `No image message received, ${userName}. Please send an image with a question or instruction.

*Usage:* Reply to an image with ?sion <your question/instruction>
*Example:* Reply to an image with "?sion what's in this image?"`
      }, { quoted: msg });
    }

  } catch (error) {
    console.error('Sion command error:', error);
    const userName = msg.pushName || "User";
    await sock.sendMessage(msg.key.remoteJid, {
      text: `An error occurred, ${userName}: ${error.message}`
    }, { quoted: msg });
  }
});

export default sion;