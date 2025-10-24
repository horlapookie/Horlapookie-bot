import axios from 'axios';

export default {
  name: 'tiktok',
  aliases: ['tt'],
  description: 'Download TikTok videos or images by search term, URL, or username (last 3 videos)',
  async execute(msg, { sock, args }) {
    const from = msg.key.remoteJid;
    const userName = msg.pushName || "User";

    try {
      const query = args.join(' ').trim();

      if (!query) {
        await sock.sendMessage(from, {
          text: `◈━━━━━━━━━━━━━━━━◈\n│❒ WAKE UP, ${userName}! Give me a TikTok search term, URL, or username! 😤\n│❒ Usage:\n│❒ • ?tiktok <search term>\n│❒ • ?tiktok <video/photo URL>\n│❒ • ?tiktok @username\n│❒ Examples:\n│❒ • ?tiktok funny dance\n│❒ • ?tiktok https://www.tiktok.com/@user/video/123\n│❒ • ?tiktok https://www.tiktok.com/@user/photo/123\n│❒ • ?tt @therealqueenkema\n◈━━━━━━━━━━━━━━━━◈`,
          react: { text: "❌", key: msg.key }
        }, { quoted: msg });
        return;
      }

      let mediaUrls = [];
      let title = 'N/A';
      let isImage = false;

      // Check if query is a URL
      const isUrl = query.includes('tiktok.com');
      // Check if query is a username (starts with @)
      const isUsername = query.startsWith('@');

      const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/115.0.0.0 Safari/537.36',
        'Referer': 'https://www.tiktok.com/',
        'Origin': 'https://www.tiktok.com'
      };

      // Send initial fetching reaction
      await sock.sendMessage(from, {
        text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Fetching ${isUsername ? `last 3 videos for @${query.replace(/^@/, '')}` : 'media'}, ${userName}... 🔍\n◈━━━━━━━━━━━━━━━━◈`,
        react: { text: "⏳", key: msg.key }
      }, { quoted: msg });

      if (isUrl) {
        // Handle direct URL (video or photo)
        console.log(`[tiktok] Processing URL: ${query}`);

        // Resolve short URLs (e.g., vt.tiktok.com)
        let resolvedUrl = query;
        if (query.includes('vt.tiktok.com')) {
          const redirectResponse = await axios.get(query, { headers, maxRedirects: 0, validateStatus: status => status >= 200 && status < 400 });
          resolvedUrl = redirectResponse.headers.location || query;
          console.log(`[tiktok] Resolved URL: ${resolvedUrl}`);
        }

        const response = await axios.get(`https://www.tikwm.com/api?url=${encodeURIComponent(resolvedUrl)}`, { headers });
        const data = response.data.data;
        if (!data) {
          throw new Error('No media found in URL response');
        }

        if (resolvedUrl.includes('photo') && data.images) {
          isImage = true;
          mediaUrls = data.images;
          title = data.title || 'TikTok Photo Post';
          console.log(`[tiktok] Selected image URLs: ${mediaUrls.join(', ')}`);
        } else if (data.play) {
          mediaUrls = [data.play];
          title = data.title || resolvedUrl;
          console.log(`[tiktok] Selected video URL: ${mediaUrls[0]}`);
        } else {
          throw new Error('No video or images found in URL response');
        }
      } else if (isUsername) {
        // Handle username search (last 3 videos)
        const username = query.replace(/^@/, '');
        console.log(`[tiktok] Searching for username: ${username}`);

        let response;
        try {
          response = await axios.get(`https://www.tikwm.com/api/user/videos?unique_id=${username}&count=3`, { headers, maxRedirects: 5 });
          console.log(`[tiktok] Username API response (tikwm):`, JSON.stringify(response.data, null, 2));
        } catch (error) {
          console.log(`[tiktok] tikwm.com failed for username: ${error.message}, trying profile scraping`);
          const profileUrl = `https://www.tiktok.com/@${username}`;
          const profileResponse = await axios.get(`https://ssstik.io/abc?url=dl&url=${encodeURIComponent(profileUrl)}`, { headers });
          const videoMatches = profileResponse.data.matchAll(/href="(https:\/\/[^\s"]+\.mp4[^"]*)"/g);
          const videos = Array.from(videoMatches).map(match => ({ play: match[1] })).slice(0, 3);
          if (!videos.length) {
            throw new Error('No videos found in profile response');
          }
          response = { data: { data: { videos } } };
          console.log(`[tiktok] Username scraping response:`, JSON.stringify(response.data, null, 2));
        }

        const videos = response.data.data?.videos;
        if (!videos || !videos.length) {
          console.log(`[tiktok] No videos found for username: ${username}`);
          await sock.sendMessage(from, {
            text: `◈━━━━━━━━━━━━━━━━◈\n│❒ NO VIDEOS FOUND, ${userName}! 😕\n│❒ No recent videos for @${username}.\n│❒ Possible reasons:\n│❒ • Private account\n│❒ • Invalid username\n│❒ • No recent posts\n│❒ Try a different username (e.g., @tiktok).\n◈━━━━━━━━━━━━━━━━◈`,
            react: { text: "❌", key: msg.key }
          }, { quoted: msg });
          return;
        }

        mediaUrls = videos.map(video => video.play);
        title = `@${username}'s Recent Videos`;
        console.log(`[tiktok] Selected video URLs: ${mediaUrls.join(', ')}`);
      } else {
        // Handle search term (unchanged from working version)
        console.log(`[tiktok] Searching for: ${query}`);
        const response = await axios.get(`https://www.tikwm.com/api/feed/search?keywords=${encodeURIComponent(query)}&count=1`, {
          headers
        });
        const videos = response.data.data?.videos;
        if (!videos || !videos.length) {
          console.log(`[tiktok] No videos found for: ${query}`);
          await sock.sendMessage(from, {
            text: `◈━━━━━━━━━━━━━━━━◈\n│❒ NO VIDEOS FOUND, ${userName}! Try different keywords! 😕\n◈━━━━━━━━━━━━━━━━◈`,
            react: { text: "❌", key: msg.key }
          }, { quoted: msg });
          return;
        }

        mediaUrls = [videos[0].play];
        title = videos[0].title || 'N/A';
        console.log(`[tiktok] Selected video URL: ${mediaUrls[0]}`);
      }

      // Download media
      const mediaBuffers = [];
      for (let i = 0; i < mediaUrls.length; i++) {
        const mediaUrl = mediaUrls[i];
        await sock.sendMessage(from, { react: { text: "⏳", key: msg.key } }, { quoted: msg });
        console.log(`[tiktok] Downloading ${isImage ? 'image' : 'video'} ${i + 1} from: ${mediaUrl}`);
        let contentType = isImage ? 'image/jpeg' : 'video/mp4';
        if (!isImage) {
          // Validate video Content-Type
          const headResponse = await axios.head(mediaUrl, { headers });
          contentType = headResponse.headers['content-type'];
          console.log(`[tiktok] Video ${i + 1} Content-Type: ${contentType}`);
          if (!contentType || !contentType.includes('video/mp4')) {
            throw new Error(`Invalid media type for video ${i + 1}: ${contentType || 'unknown'}`);
          }
        }

        const response = await axios.get(mediaUrl, {
          responseType: 'arraybuffer',
          headers,
          maxRedirects: 5
        });

        const buffer = Buffer.from(response.data);
        console.log(`[tiktok] Buffer received for ${isImage ? 'image' : 'video'} ${i + 1}, size: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);
        mediaBuffers.push({ buffer, contentType });
      }

      // Send media
      console.log(`[tiktok] Sending ${mediaBuffers.length} ${isImage ? 'image(s)' : 'video(s)'} to user`);
      if (mediaBuffers.length > 1) {
        // For usernames or photo posts: send as carousel
        const mediaMessages = mediaBuffers.map(media => ({
          [isImage ? 'image' : 'video']: media.buffer,
          mimetype: media.contentType
        }));

        try {
          await sock.sendMessage(from, { mediaGroup: mediaMessages }, { quoted: msg });
          await sock.sendMessage(from, {
            text: `◈━━━━━━━━━━━━━━━━◈\n│❒ NAILED IT, ${userName}! 🔥\n│❒ Title: ${title}\n│❒ Downloaded ${mediaBuffers.length} ${isImage ? 'image(s)' : 'video(s)'} from: TikTok\n│❒ Powered by HORLA POOKIE Bot\n◈━━━━━━━━━━━━━━━━◈`,
            react: { text: "✅", key: msg.key }
          }, { quoted: msg });
        } catch (error) {
          console.error('[tiktok] Carousel failed:', error.message);
          // Fallback to individual sends
          for (let i = 0; i < mediaBuffers.length; i++) {
            await sock.sendMessage(from, {
              [isImage ? 'image' : 'video']: mediaBuffers[i].buffer,
              mimetype: mediaBuffers[i].contentType
            }, { quoted: msg });
          }
          await sock.sendMessage(from, {
            text: `◈━━━━━━━━━━━━━━━━◈\n│❒ NAILED IT, ${userName}! 🔥\n│❒ Title: ${title}\n│❒ Downloaded ${mediaBuffers.length} ${isImage ? 'image(s)' : 'video(s)'} from: TikTok\n│❒ Sent individually due to carousel issue. Update your bot for horizontal scrolling.\n│❒ Powered by HORLA POOKIE Bot\n◈━━━━━━━━━━━━━━━━◈`,
            react: { text: "✅", key: msg.key }
          }, { quoted: msg });
        }
      } else {
        // For search or single video/image URL: send single media
        await sock.sendMessage(from, {
          [isImage ? 'image' : 'video']: mediaBuffers[0].buffer,
          mimetype: mediaBuffers[0].contentType
        }, { quoted: msg });
        await sock.sendMessage(from, {
          text: `◈━━━━━━━━━━━━━━━━◈\n│❒ NAILED IT, ${userName}! 🔥\n│❒ Title: ${title}\n│❒ Downloaded from: TikTok\n│❒ Powered by HORLA POOKIE Bot\n◈━━━━━━━━━━━━━━━━◈`,
          react: { text: "✅", key: msg.key }
        }, { quoted: msg });
      }

      console.log(`[tiktok] ${isImage ? 'Images' : 'Videos'} sent successfully`);

    } catch (error) {
      console.error('[tiktok] Error:', error.message);
      let errorMessage = `◈━━━━━━━━━━━━━━━━◈\n│❒ FAILED, ${userName}! Failed to download TikTok media. 😡\n│❒ Error: ${error.message}\n│❒ Try:\n│❒ • Different search term, URL, or username\n│❒ • Check your connection\n◈━━━━━━━━━━━━━━━━◈`;
      if (error.message.includes('403')) {
        errorMessage = `◈━━━━━━━━━━━━━━━━◈\n│❒ FAILED, ${userName}! Access denied (403). 😡\n│❒ This might be due to:\n│❒ • Private or restricted media\n│❒ • API restrictions\n│❒ • Invalid URL or username\n│❒ Try a different URL or username (e.g., @tiktok)\n◈━━━━━━━━━━━━━━━━◈`;
      } else if (error.message.includes('404') || error.message.includes('Not Found') || error.message.includes('undefined')) {
        errorMessage = `◈━━━━━━━━━━━━━━━━◈\n│❒ FAILED, ${userName}! Media not found. 😡\n│❒ This might be due to:\n│❒ • Invalid or restricted media\n│❒ • Private account or invalid username\n│❒ • API issue\n│❒ Try a different search term, URL, or username\n◈━━━━━━━━━━━━━━━━◈`;
      } else if (error.message.includes('Invalid media type')) {
        errorMessage = `◈━━━━━━━━━━━━━━━━◈\n│❒ FAILED, ${userName}! Invalid media type. 😡\n│❒ This might be due to:\n│❒ • Corrupted or unsupported format\n│❒ • API returning invalid data\n│❒ Try a different username (e.g., @tiktok)\n◈━━━━━━━━━━━━━━━━◈`;
      } else if (error.message.includes('ENOTFOUND')) {
        errorMessage = `◈━━━━━━━━━━━━━━━━◈\n│❒ FAILED, ${userName}! API server not found. 😡\n│❒ This might be due to:\n│❒ • API downtime\n│❒ • Network issues\n│❒ • Regional restrictions\n│❒ Try a different username (e.g., @tiktok) or check your connection\n◈━━━━━━━━━━━━━━━━◈`;
      }
      await sock.sendMessage(from, {
        text: errorMessage,
        react: { text: "❌", key: msg.key }
      }, { quoted: msg });
    }
  }
};