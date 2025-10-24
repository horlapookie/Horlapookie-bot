
import fs from 'fs';
import { exec } from 'child_process';

export default {
  name: 'bass',
  description: 'Apply bass boost effect to audio',
  category: 'Audio-Edit',
  async execute(msg, { sock, args }) {
    const from = msg.key.remoteJid;
    
    // Check if replying to an audio message
    const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
    const quotedMessage = contextInfo?.quotedMessage;
    
    if (!quotedMessage?.audioMessage) {
      return await sock.sendMessage(from, {
        text: 'Please reply to an audio message to apply the bass boost effect.'
      }, { quoted: msg });
    }

    try {
      await sock.sendMessage(from, {
        text: '🎵 Processing bass boost effect...'
      }, { quoted: msg });

      const audioMsg = quotedMessage.audioMessage;
      
      // Download audio
      const media = await sock.downloadMediaMessage({
        key: {
          remoteJid: from,
          id: contextInfo.stanzaId,
          participant: contextInfo.participant
        },
        message: quotedMessage
      });

      const filename = `${Math.random().toString(36)}_input.mp3`;
      const outputFile = `${Math.random().toString(36)}_output.mp3`;
      
      // Save input file
      fs.writeFileSync(filename, media);

      const set = "-af equalizer=f=18:width_type=o:width=2:g=14";
      
      // Use ffmpeg directly from PATH
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
            caption: "🎵 Bass boost effect applied!"
          }, { quoted: msg });
          
          fs.unlinkSync(outputFile);
        });
      
    } catch (error) {
      console.error('Bass audio error:', error);
      await sock.sendMessage(from, {
        text: "❌ Error processing audio: " + error.message
      }, { quoted: msg });
    }
  }
};
