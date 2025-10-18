
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { downloadMediaMessage } from '@whiskeysockets/baileys';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load emojis
const emojisPath = path.join(process.cwd(), 'data', 'emojis.json');
const emojis = JSON.parse(fs.readFileSync(emojisPath, 'utf8'));

// Dynamic imports for packages
let acrcloud, yts, ffmpeg, ffmpegPath;

async function loadDependencies() {
  try {
    acrcloud = (await import('acrcloud')).default;
    yts = (await import('yt-search')).default;
    ffmpeg = (await import('fluent-ffmpeg')).default;
    ffmpegPath = (await import('ffmpeg-static')).default;
    
    if (ffmpeg && ffmpegPath) {
      ffmpeg.setFfmpegPath(ffmpegPath);
    }
    
    return true;
  } catch (error) {
    console.log('Shazam dependencies not available:', error.message);
    return false;
  }
}

function trimTo15Seconds(inputBuffer, outputPath) {
  return new Promise((resolve, reject) => {
    const tempDir = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    const inputFile = path.join(tempDir, `input-${Date.now()}.mp4`);
    const outputFile = outputPath;

    try {
      fs.writeFileSync(inputFile, inputBuffer);

      ffmpeg(inputFile)
        .setStartTime(0)
        .duration(15)
        .output(outputFile)
        .on('end', () => {
          try {
            const trimmed = fs.readFileSync(outputFile);
            fs.unlinkSync(inputFile);
            fs.unlinkSync(outputFile);
            resolve(trimmed);
          } catch (err) {
            reject(err);
          }
        })
        .on('error', (err) => {
          // Clean up files on error
          try {
            if (fs.existsSync(inputFile)) fs.unlinkSync(inputFile);
            if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
          } catch (cleanupErr) {
            console.log('Cleanup error:', cleanupErr);
          }
          reject(err);
        })
        .run();
    } catch (err) {
      reject(err);
    }
  });
}

export default {
  name: "shazam",
  description: "Identify a song from audio or video clip",
  aliases: ["whatsong", "findsong", "identify"],
  category: "Search",
  
  async execute(msg, { sock, args, settings }) {
    const from = msg.key.remoteJid;

    // Check if dependencies are available
    const depsLoaded = await loadDependencies();
    if (!depsLoaded) {
      return await sock.sendMessage(from, {
        text: `${emojis.error || '❌'} *Shazam dependencies not available*\n\nThis command requires additional packages to be installed.`
      }, { quoted: msg });
    }

    // React with processing emoji
    await sock.sendMessage(from, {
      react: { text: emojis.processing || '⏳', key: msg.key }
    });

    // Check if message is a reply to audio/video
    const quotedMessage = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    
    if (!quotedMessage || (!quotedMessage.audioMessage && !quotedMessage.videoMessage)) {
      await sock.sendMessage(from, {
        react: { text: emojis.error || '❌', key: msg.key }
      });
      
      return await sock.sendMessage(from, {
        text: `${emojis.music || '🎵'} *Song Identification*\n\n📝 *Usage:* Reply to an audio or video message (10-15 seconds recommended)\n\n⚡ *Example:* Reply to a voice note or video with \`${settings.prefix}shazam\``
      }, { quoted: msg });
    }

    try {
      // Download the media
      const buffer = await downloadMediaMessage(
        { message: quotedMessage },
        'buffer',
        {},
        { logger: console }
      );

      // Trim to 15 seconds for better recognition
      const outputPath = path.join(process.cwd(), 'tmp', `trimmed-${Date.now()}.mp4`);
      const trimmedBuffer = await trimTo15Seconds(buffer, outputPath);

      // Initialize ACRCloud
      const acr = new acrcloud({
        host: 'identify-ap-southeast-1.acrcloud.com',
        access_key: '26afd4eec96b0f5e5ab16a7e6e05ab37',
        access_secret: 'wXOZIqdMNZmaHJP1YDWVyeQLg579uK2CfY6hWMN8'
      });

      // Identify the song
      const { status, metadata } = await acr.identify(trimmedBuffer);

      if (status.code !== 0 || !metadata?.music?.length) {
        await sock.sendMessage(from, {
          react: { text: emojis.error || '❌', key: msg.key }
        });
        
        return await sock.sendMessage(from, {
          text: `${emojis.search || '🔍'} *Song Not Found*\n\n❌ Could not recognize the song from this audio.\n\n💡 *Tips:*\n• Use a clearer audio clip (10-15 seconds)\n• Ensure the music is loud and clear\n• Avoid background noise`
        }, { quoted: msg });
      }

      const music = metadata.music[0];
      const { title, artists, album, genres, release_date } = music;

      // Search for YouTube link
      let youtubeUrl = '';
      try {
        const query = `${title} ${artists?.[0]?.name || ''}`;
        const search = await yts(query);
        if (search?.videos?.[0]?.url) {
          youtubeUrl = search.videos[0].url;
        }
      } catch (ytError) {
        console.log('YouTube search error:', ytError);
      }

      // Build result message
      let result = `${emojis.music || '🎶'} *Song Identified!*\n\n`;
      result += `🎧 *Title:* ${title}\n`;
      
      if (artists && artists.length > 0) {
        result += `👤 *Artist(s):* ${artists.map(a => a.name).join(', ')}\n`;
      }
      
      if (album && album.name) {
        result += `💿 *Album:* ${album.name}\n`;
      }
      
      if (genres && genres.length > 0) {
        result += `🎼 *Genre:* ${genres.map(g => g.name).join(', ')}\n`;
      }
      
      if (release_date) {
        result += `📅 *Released:* ${release_date}\n`;
      }
      
      if (youtubeUrl) {
        result += `🔗 *YouTube:* ${youtubeUrl}\n`;
      }

      result += `\n🤖 *Identified by HORLA POOKIE Bot*`;

      // Success reaction
      await sock.sendMessage(from, {
        react: { text: emojis.success || '✅', key: msg.key }
      });

      return await sock.sendMessage(from, {
        text: result
      }, { quoted: msg });

    } catch (error) {
      console.error('[SHAZAM ERROR]', error);
      
      await sock.sendMessage(from, {
        react: { text: emojis.error || '❌', key: msg.key }
      });

      return await sock.sendMessage(from, {
        text: `${emojis.error || '⚠️'} *Error identifying song*\n\n🔧 *Error:* ${error.message}\n\n💡 *Try again with:*\n• A clearer audio clip\n• Less background noise\n• Popular/well-known songs`
      }, { quoted: msg });
    }
  }
};
