
import fs from 'fs';
import { exec } from 'child_process';

export default {
  name: 'smooth',
  description: 'Apply smooth effect to audio',
  category: 'Audio-Edit',
  async execute(msg, { sock, args }) {
    const from = msg.key.remoteJid;
    
    // Check if replying to an audio message
    const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
    const quotedMessage = contextInfo?.quotedMessage;
    
    if (!quotedMessage?.audioMessage) {
      return await sock.sendMessage(from, {
        text: 'Please reply to an audio message to apply smooth effect.'
      }, { quoted: msg });
    }

    try {
      await sock.sendMessage(from, {
        text: '🎵 Processing smooth effect...'
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

      const set = '-filter:a "lowpass=f=8000"';
      
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
          caption: "🎵 Smooth effect applied!"
        }, { quoted: msg });
        
        fs.unlinkSync(outputFile);
      });
      
    } catch (error) {
      console.error('Smooth audio error:', error);
      await sock.sendMessage(from, {
        text: "❌ Error processing audio: " + error.message
      }, { quoted: msg });
    }
  }
};
