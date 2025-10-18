
import fs from 'fs';
import { exec } from 'child_process';
import { downloadContentFromMessage } from '@whiskeysockets/baileys';

export default {
  name: 'nightcore',
  description: 'Apply nightcore effect to audio',
  category: 'Audio-Edit',
  async execute(msg, { sock, args }) {
    const from = msg.key.remoteJid;

    // Check if replying to an audio message
    const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
    const quotedMessage = contextInfo?.quotedMessage;

    if (!quotedMessage?.audioMessage) {
      return await sock.sendMessage(from, {
        text: '🎵 Please reply to an audio message to apply nightcore effect.\n\nUsage: Reply to audio + ?nightcore'
      }, { quoted: msg });
    }

    try {
      await sock.sendMessage(from, {
        text: '🎵 Processing nightcore effect...'
      }, { quoted: msg });

      const audioMsg = quotedMessage.audioMessage;

      // Download audio
      const stream = await downloadContentFromMessage(audioMsg, 'audio');
      
      // Convert stream to buffer
      let buffer = Buffer.from([]);
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }

      const filename = `${Math.random().toString(36)}_input.mp3`;
      const outputFile = `${Math.random().toString(36)}_output.mp3`;

      // Save input file
      fs.writeFileSync(filename, buffer);

      const set = '-filter:a "atempo=1.07,asetrate=44100*1.20"';

      exec(`ffmpeg -i ${filename} ${set} ${outputFile}`, (err, stderr, stdout) => {
        fs.unlinkSync(filename);

        if (err) {
          console.error('FFmpeg error:', err);
          return sock.sendMessage(from, {
            text: "❌ Error during audio processing: " + err.message
          }, { quoted: msg });
        }

        const buff = fs.readFileSync(outputFile);

        sock.sendMessage(from, {
          audio: buff,
          mimetype: "audio/mpeg",
          caption: "🎵 Nightcore effect applied!"
        }, { quoted: msg });

        fs.unlinkSync(outputFile);
      });

    } catch (error) {
      console.error('Nightcore audio error:', error);
      await sock.sendMessage(from, {
        text: "❌ Error processing audio: " + error.message
      }, { quoted: msg });
    }
  }
};
