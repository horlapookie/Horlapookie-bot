import { downloadMediaMessage } from '@whiskeysockets/baileys';
import fs from 'fs';
import path from 'path';
import { randomBytes } from 'crypto';
import { horla } from '../lib/horla.js';

export default horla({
  nomCom: 'stt',
  categorie: 'Utility',
  reaction: '🎤',
  description: 'Convert speech/audio to text'
}, async (msg, context) => {
  const { sock, args, repondre } = context;
  const from = msg.key.remoteJid;

  try {
    let audioMessage = null;
    let targetMessage = null;

    // Check if replying to a message
    if (msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
      const quotedMsg = msg.message.extendedTextMessage.contextInfo.quotedMessage;

      if (quotedMsg.audioMessage) {
        audioMessage = quotedMsg.audioMessage;
        targetMessage = {
          key: {
            remoteJid: from,
            id: msg.message.extendedTextMessage.contextInfo.stanzaId,
            participant: msg.message.extendedTextMessage.contextInfo.participant
          },
          message: quotedMsg
        };
      }
    }
    // Check if current message has audio
    else if (msg.message?.audioMessage) {
      audioMessage = msg.message.audioMessage;
      targetMessage = msg;
    }

    if (!audioMessage || !targetMessage) {
      await sock.sendMessage(from, {
        text: `❌ Please reply to an audio message!\n\n📝 **Usage:**\n• Reply to voice note: ?stt\n• Reply to audio file: ?stt\n\n💡 **Tip:** This will convert speech to text`
      }, { quoted: msg });
      return;
    }

    await sock.sendMessage(from, {
      text: '🎤 Converting speech to text... Please wait!'
    }, { quoted: msg });

    try {
      // Download the audio
      const buffer = await downloadMediaMessage(targetMessage, 'buffer', {});

      if (!buffer) {
        throw new Error('Failed to download audio');
      }

      // Create temp directory if it doesn't exist
      const tempDir = './temp';
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const timestamp = randomBytes(3).toString('hex');
      const audioPath = path.join(tempDir, `audio_${timestamp}.ogg`);

      // Save audio file
      fs.writeFileSync(audioPath, buffer);

      // Simple transcription placeholder
      let transcriptionText = '[Audio detected. Speech-to-text requires additional setup. Install Whisper (pip install openai-whisper) or configure Google Cloud Speech API for accurate transcription.]';

      await sock.sendMessage(from, {
        text: `🎤 *Speech-to-Text*\n\n📄 *Transcribed Text:*\n"${transcriptionText}"\n\n🔧 *Audio Info:*\n• Duration: ${audioMessage.seconds || 'Unknown'} seconds\n• Size: ${(buffer.length/1024).toFixed(2)} KB\n\n💡 *Tip:* For better results, ensure clear speech and minimal background noise`
      }, { quoted: msg });

      // Clean up temp file
      setTimeout(() => {
        try {
          if (fs.existsSync(audioPath)) {
            fs.unlinkSync(audioPath);
          }
        } catch (cleanupError) {
          console.log('Cleanup error:', cleanupError);
        }
      }, 5000);

    } catch (downloadError) {
      console.error('Speech-to-text processing error:', downloadError);
      await sock.sendMessage(from, {
        text: '❌ Failed to process audio. The audio might be corrupted or in an unsupported format.'
      }, { quoted: msg });
    }

  } catch (error) {
    console.error('STT command error:', error);
    await sock.sendMessage(from, {
      text: '❌ Error processing speech-to-text. Please try again.'
    }, { quoted: msg });
  }
});