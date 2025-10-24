
import axios from 'axios';
import yts from 'yt-search';
import fs from 'fs';
import path from 'path';

// Load emojis
const emojisPath = path.join(process.cwd(), 'data', 'emojis.json');
const emojis = JSON.parse(fs.readFileSync(emojisPath, 'utf8'));

const BASE_URL = 'https://noobs-api.top';

export default {
  name: 'play',
  description: 'Search and play MP3 music from YouTube (audio only) - Alternative method',
  aliases: ['music2', 'song2'],
  category: 'Music & Media',
  
  async execute(msg, { sock, args, settings }) {
    const from = msg.key.remoteJid;
    const start = Date.now();

    // React with processing emoji
    await sock.sendMessage(from, {
      react: { text: emojis.processing || '⏳', key: msg.key }
    });

    const query = args.join(' ');
    
    if (!query) {
      await sock.sendMessage(from, {
        react: { text: emojis.error || '❌', key: msg.key }
      });
      
      return await sock.sendMessage(from, {
        text: `${emojis.music || '🎵'} *Music Player 2*\n\nPlease provide a song name or keyword.\n\n⚡ *Example:* \`${settings.prefix}play2 Shape of You\``
      }, { quoted: msg });
    }

    try {
      console.log('[PLAY2] Searching YT for:', query);
      
      // Search for the video
      const search = await yts(query);
      const video = search.videos[0];

      if (!video) {
        await sock.sendMessage(from, {
          react: { text: emojis.error || '❌', key: msg.key }
        });
        
        return await sock.sendMessage(from, {
          text: `${emojis.error || '❌'} No results found for your query: "${query}"`
        }, { quoted: msg });
      }

      // Send preview with thumbnail
      const previewMessage = {
        image: { url: video.thumbnail },
        caption: `${emojis.music || '🎵'} *HORLA POOKIE SONG PLAYER*\n\n` +
          `╭───────────────◆\n` +
          `│⿻ *Title:* ${video.title}\n` +
          `│⿻ *Duration:* ${video.timestamp}\n` +
          `│⿻ *Views:* ${video.views.toLocaleString()}\n` +
          `│⿻ *Uploaded:* ${video.ago}\n` +
          `│⿻ *Channel:* ${video.author.name}\n` +
          `╰────────────────◆\n\n` +
          `${emojis.processing || '⏳'} Processing audio download...`,
        contextInfo: {
          forwardingScore: 1,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: '120363420551846782@newsletter',
            newsletterName: 'HORLA POOKIE',
            serverMessageId: -1
          }
        }
      };

      await sock.sendMessage(from, previewMessage, { quoted: msg });

      // Get download link
      const safeTitle = video.title.replace(/[\\/:*?"<>|]/g, '');
      const fileName = `${safeTitle}.mp3`;
      const apiURL = `${BASE_URL}/dipto/ytDl3?link=${encodeURIComponent(video.videoId)}&format=mp3`;

      console.log('[PLAY2] Requesting download from:', apiURL);
      const response = await axios.get(apiURL, { 
        timeout: 60000, // Increased timeout to 60 seconds
        maxRedirects: 5,
        validateStatus: function (status) {
          return status >= 200 && status < 300;
        }
      });
      const data = response.data;

      if (!data.downloadLink) {
        // Try alternative API as fallback
        try {
          console.log('[PLAY2] Trying fallback API...');
          const fallbackURL = `https://api.agatz.xyz/api/ytmp3?url=https://youtube.com/watch?v=${video.videoId}`;
          const fallbackResponse = await axios.get(fallbackURL, { timeout: 45000 });
          
          if (fallbackResponse.data && fallbackResponse.data.data && fallbackResponse.data.data.download) {
            data.downloadLink = fallbackResponse.data.data.download;
          } else {
            throw new Error('Fallback API also failed');
          }
        } catch (fallbackError) {
          console.log('[PLAY2] Fallback API failed:', fallbackError.message);
          await sock.sendMessage(from, {
            react: { text: emojis.error || '❌', key: msg.key }
          });
          
          return await sock.sendMessage(from, {
            text: `${emojis.error || '❌'} Failed to retrieve the MP3 download link from both APIs. Please try:\n• Using ${settings.prefix}play command instead\n• Try again in a few minutes\n• Use a different song search term`
          }, { quoted: msg });
        }
      }

      // Calculate response time
      const elapsed = Date.now() - start;

      // Send the audio file
      await sock.sendMessage(from, {
        document: { url: data.downloadLink },
        mimetype: 'audio/mpeg',
        fileName: fileName,
        caption: `${emojis.success || '✅'} *Music Download Complete*\n\n📱 *Title:* ${video.title}\n🎧 *Format:* MP3\n⭐ *Quality:* High\n💫 *Duration:* ${video.timestamp}\n${emojis.lightning || '⚡'} *Response time:* \`${elapsed} ms\`\n🔗 *URL:* ${video.url}\n\n_Powered by HORLA POOKIE Bot_ 🤖`
      }, { quoted: msg });

      // Success reaction
      await sock.sendMessage(from, {
        react: { text: emojis.success || '✅', key: msg.key }
      });

    } catch (error) {
      console.error('[PLAY2] Error:', error.message);
      
      await sock.sendMessage(from, {
        react: { text: emojis.error || '❌', key: msg.key }
      });

      return await sock.sendMessage(from, {
        text: `${emojis.error || '❌'} *Download failed*\n\n🔧 *Error:* ${error.message}\n\n💡 *Please try:*\n• Different search terms\n• Try again in a moment\n• Use ${settings.prefix}play command instead`
      }, { quoted: msg });
    }
  }
};
