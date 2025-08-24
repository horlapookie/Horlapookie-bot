import axios from 'axios';
import yts from 'yt-search';

export default {
  name: 'tik',
  description: 'Download TikTok video by link or search keyword',
  async execute(msg, { sock, args }) {
    const input = args.join(' ');
    const remoteJid = msg.key.remoteJid;

    if (!input) {
      await sock.sendMessage(remoteJid, {
        text: '❌ Provide a TikTok link or keyword.\n\nExample:\n$tik https://www.tiktok.com/@user/video/123...\n$tik funny dance'
      }, { quoted: msg });
      return;
    }

    let tiktokUrl = input;

    // If it's not a TikTok link, search for it
    if (!/^https?:\/\/(www\.)?tiktok\.com/.test(input)) {
      await sock.sendMessage(remoteJid, {
        text: `🔍 Searching TikTok for: *${input}*...`
      }, { quoted: msg });

      try {
        const search = await yts(input + ' site:tiktok.com');
        const found = search.videos.find(v => v.url.includes('tiktok.com'));

        if (!found) {
          await sock.sendMessage(remoteJid, {
            text: '❌ No TikTok video found for that search.'
          }, { quoted: msg });
          return;
        }

        tiktokUrl = found.url;
      } catch (err) {
        console.error('Search error:', err);
        await sock.sendMessage(remoteJid, {
          text: '❌ Failed to search for TikTok video.'
        }, { quoted: msg });
        return;
      }
    }

    try {
      await sock.sendMessage(remoteJid, {
        text: '⬇️ Downloading video...'
      }, { quoted: msg });

      const response = await axios.post('https://shinoa.us.kg/api/download/tiktok', {
        text: tiktokUrl
      }, {
        headers: {
          'accept': '*/*',
          'api_key': 'kyuurzy',
          'Content-Type': 'application/json'
        }
      });

      const video = response.data.video || response.data.result?.video;

      if (!video || !video.url) {
        await sock.sendMessage(remoteJid, {
          text: '❌ Failed to get download link.'
        }, { quoted: msg });
        return;
      }

      await sock.sendMessage(remoteJid, {
        video: { url: video.url },
        caption: `✅ Downloaded from TikTok\n\n${tiktokUrl}`
      }, { quoted: msg });

    } catch (error) {
      console.error('TikTok download error:', error);
      await sock.sendMessage(remoteJid, {
        text: '❌ Error downloading TikTok video.'
      }, { quoted: msg });
    }
  }
};
