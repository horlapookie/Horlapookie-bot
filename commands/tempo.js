import fs from 'fs';
import { exec } from 'child_process';
import newsletter from './lib/newsletter.js'; // Import newsletter from lib

export default {
  name: 'tempo',
  description: 'Adjust audio tempo',
  category: 'Audio-Edit',
  async execute(msg, { sock, args }) {
    const from = msg.key.remoteJid;

    // Check if replying to an audio message
    const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
    const quotedMessage = contextInfo?.quotedMessage;

    if (!quotedMessage?.audioMessage) {
      // Construct button message
      const buttons = [
        { buttonId: '?repos', buttonText: { displayText: '📚 Repos' }, type: 1 },
        { buttonId: '?botinfo', buttonText: { displayText: 'ℹ️ Bot Info' }, type: 1 },
        { buttonId: '?settings', buttonText: { displayText: '⚙️ Settings' }, type: 1 },
      ];

      const buttonMessage = {
        text: '🌟 Bot Menu Options 🌟\n\nType any of these commands or use the buttons below:',
        footer: 'Powered by horla-pookie-bot©',
        buttons: buttons,
        headerType: 1
      };

      await sock.sendMessage(from, buttonMessage, { quoted: msg });
      return;
    }

    try {
      await sock.sendMessage(from, {
        text: '🎵 Processing tempo adjustment...'
      }, { quoted: msg });

      const audioMsg = quotedMessage.audioMessage;

      // Download audio
      const { downloadMediaMessage } = await import('@whiskeysockets/baileys');
      const media = await downloadMediaMessage({
        key: {
          remoteJid: from,
          id: contextInfo.stanzaId,
          participant: contextInfo.participant
        },
        message: quotedMessage
      }, 'buffer', {});

      const filename = `${Math.random().toString(36)}_input.mp3`;
      const outputFile = `${Math.random().toString(36)}_output.mp3`;

      // Save input file
      fs.writeFileSync(filename, media);

      const set = '-filter:a "atempo=0.9,asetrate=65100"';

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
          caption: "🎵 Tempo adjusted!"
        }, { quoted: msg });

        fs.unlinkSync(outputFile);
      });

    } catch (error) {
      console.error('Tempo audio error:', error);
      await sock.sendMessage(from, {
        text: "❌ Error processing audio: " + error.message
      }, { quoted: msg });
    }
  }
};