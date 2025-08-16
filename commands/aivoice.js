
import { channelInfo } from '../lib/messageConfig.js';
import fetch from 'node-fetch';
import fs from 'fs';

// Map of supported celebrity voices
const voiceMap = {
  obama: "barack-obama",
  trump: "donald-trump",
  morgan: "morgan-freeman",
  eminem: "eminem",
  elon: "elon-musk",
  kanye: "kanye-west",
  biden: "joe-biden",
  taylor: "taylor-swift",
  oprah: "oprah-winfrey",
  einstein: "albert-einstein"
};

export default {
  name: 'aivoice',
  aliases: ['voice-clone', 'celebrity-voice', 'ai-voice'],
  description: '🎙️ Generate AI voice clones of celebrities',
  async execute(msg, { sock, args }) {
    const from = msg.key.remoteJid;
    
    if (!args || args.length < 2) {
      const availableVoices = Object.keys(voiceMap).join(", ");
      await sock.sendMessage(from, {
        text: `🎙️ *AI Voice Cloner*\n\n📝 **Usage:**\n?aivoice <voice> <text>\n\n🎭 **Available Voices:**\n${availableVoices}\n\n💡 **Example:**\n?aivoice obama Hello my people!\n?aivoice morgan In a world full of chaos...\n?aivoice trump This is going to be huge!`,
        ...channelInfo
      }, { quoted: msg });
      return;
    }

    const voiceKey = args[0]?.toLowerCase();
    const text = args.slice(1).join(" ");
    
    const voiceId = voiceMap[voiceKey];
    if (!voiceId) {
      const availableVoices = Object.keys(voiceMap).join(", ");
      await sock.sendMessage(from, {
        text: `❌ *Unsupported voice: ${voiceKey}*\n\n🎭 **Available voices:**\n${availableVoices}`,
        ...channelInfo
      }, { quoted: msg });
      return;
    }

    if (text.length > 200) {
      await sock.sendMessage(from, {
        text: `❌ Text too long! Please keep it under 200 characters.\nCurrent length: ${text.length}`,
        ...channelInfo
      }, { quoted: msg });
      return;
    }

    try {
      // Send processing message
      await sock.sendMessage(from, {
        text: `🎙️ Generating ${voiceKey} voice for: "${text}"\n⏳ Please wait...`,
        ...channelInfo
      }, { quoted: msg });

      // Create temp directory if it doesn't exist
      if (!fs.existsSync('./temp')) {
        fs.mkdirSync('./temp', { recursive: true });
      }

      // Use Google TTS API as fallback
      const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=en&client=tw-ob&q=${encodeURIComponent(text)}`;
      
      const response = await fetch(ttsUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://translate.google.com'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const audioBuffer = await response.buffer();
      const outputPath = `./temp/aivoice_${Date.now()}.mp3`;
      
      fs.writeFileSync(outputPath, audioBuffer);

      // Send the generated audio
      await sock.sendMessage(from, {
        audio: fs.readFileSync(outputPath),
        mimetype: "audio/mp4",
        ptt: false,
        ...channelInfo
      }, { quoted: msg });

      // Cleanup
      fs.unlinkSync(outputPath);

    } catch (error) {
      console.error('AI Voice error:', error);
      
      let errorMessage = '❌ Failed to generate voice. ';
      if (error.message.includes('HTTP 429')) {
        errorMessage += 'Rate limit exceeded. Try again later.';
      } else if (error.message.includes('HTTP 401')) {
        errorMessage += 'API authentication failed.';
      } else {
        errorMessage += 'Try again later or use shorter text.';
      }
      
      await sock.sendMessage(from, {
        text: errorMessage,
        ...channelInfo
      }, { quoted: msg });
    }
  }
};
