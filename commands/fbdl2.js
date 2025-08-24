import { horla } from '../lib/horla.js';
import axios from 'axios';

async function checkNetworkConnectivity() {
  try {
    await axios.get('https://www.google.com', { timeout: 5000 });
    console.log('[facebook] Network connectivity: OK');
    return true;
  } catch (error) {
    console.error(`[facebook] Network connectivity check failed: ${error.message}`);
    return false;
  }
}

async function fetchDynamicCookies() {
  try {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Referer': 'https://m.facebook.com/'
    };
    const response = await axios.get('https://m.facebook.com/', { headers });
    const cookies = response.headers['set-cookie']?.join('; ') || 'c_user=100000000000000; xs=; fr=; datr=; sb=; locale=en_US';
    console.log(`[facebook] Fetched cookies: ${cookies}`);
    return cookies;
  } catch (error) {
    console.error(`[facebook] Cookie fetch failed: ${error.message}`);
    return 'c_user=100000000000000; xs=; fr=; datr=; sb=; locale=en_US';
  }
}

async function resolveFacebookUrl(url) {
  try {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Referer': 'https://www.facebook.com/'
    };
    const response = await axios.get(url, { headers, maxRedirects: 0, validateStatus: status => status >= 200 && status < 400 });
    const resolvedUrl = response.headers.location || url;
    console.log(`[facebook] Resolved URL: ${resolvedUrl}`);
    return resolvedUrl;
  } catch (error) {
    console.error(`[facebook] URL resolution failed: ${error.message}`);
    return url;
  }
}

async function getFBInfo(url) {
  try {
    // Resolve URL first
    const resolvedUrl = await resolveFacebookUrl(url);

    // Check network connectivity
    const isNetworkOk = await checkNetworkConnectivity();
    if (!isNetworkOk) {
      throw new Error('Network connectivity issue detected');
    }

    // Primary API: fbdownloader.io (via corsproxy.io)
    try {
      const response = await axios.get(`https://corsproxy.io/?${encodeURIComponent(`https://fbdownloader.io/api?url=${encodeURIComponent(resolvedUrl)}`)}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0.0.0 Safari/537.36',
          'Accept': 'application/json',
          'Referer': 'https://fbdownloader.io/',
          'Origin': 'https://fbdownloader.io'
        }
      });
      const data = response.data;
      if (!data.video_url) {
        throw new Error('No video URL found in primary API response');
      }
      return {
        videoUrl: data.video_url,
        title: data.title || 'Facebook Video',
        thumbnail: data.thumbnail || null
      };
    } catch (primaryError) {
      console.error(`[facebook] Primary API failed: ${primaryError.message}`);
      
      // Secondary API: savefb.online (via corsproxy.io)
      try {
        const response = await axios.get(`https://corsproxy.io/?${encodeURIComponent(`https://savefb.online/api?url=${encodeURIComponent(resolvedUrl)}`)}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0.0.0 Safari/537.36',
            'Accept': 'application/json',
            'Referer': 'https://savefb.online/',
            'Origin': 'https://savefb.online'
          }
        });
        const data = response.data;
        if (!data.url) {
          throw new Error('No video URL found in secondary API response');
        }
        return {
          videoUrl: data.url,
          title: data.title || 'Facebook Video',
          thumbnail: data.thumbnail || null
        };
      } catch (secondaryError) {
        console.error(`[facebook] Secondary API failed: ${secondaryError.message}`);
        
        // Fallback: Scrape resolved Facebook page HTML (try both mobile and desktop)
        try {
          const cookies = await fetchDynamicCookies();
          const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Referer': 'https://m.facebook.com/',
            'Cookie': cookies
          };
          let html, response;
          // Try mobile URL first
          try {
            response = await axios.get(resolvedUrl, { headers });
            html = response.data;
          } catch (mobileError) {
            console.error(`[facebook] Mobile URL scrape failed: ${mobileError.message}`);
            // Fallback to desktop URL
            const desktopUrl = resolvedUrl.replace('m.facebook.com', 'www.facebook.com');
            response = await axios.get(desktopUrl, { headers });
            html = response.data;
          }
          if (html.includes('login_form') || html.includes('login/?next') || response.status === 403) {
            throw new Error('Video is private or restricted');
          }
          // Parse JSON payloads in HTML
          const jsonMatch = html.match(/<script[^>]*type="application\/json"[^>]*>([\s\S]*?)<\/script>/gi);
          let videoUrl = null;
          if (jsonMatch) {
            for (const match of jsonMatch) {
              try {
                const jsonData = JSON.parse(match.replace(/<script[^>]*type="application\/json"[^>]*>([\s\S]*?)<\/script>/i, '$1'));
                const urls = JSON.stringify(jsonData).match(/(https:\/\/[^\s"]+\.mp4)/i);
                if (urls) {
                  videoUrl = urls[1];
                  break;
                }
              } catch (jsonError) {
                console.error(`[facebook] JSON parsing failed: ${jsonError.message}`);
              }
            }
          }
          const videoMatch = videoUrl ||
                            html.match(/"(https:\/\/video\.fbcdn\.net\/[^"]*\.mp4[^"]*)"/i) || 
                            html.match(/playable_url":"(https:\/\/[^"]*\.mp4[^"]*)"/i) ||
                            html.match(/playable_url_quality_hd":"(https:\/\/[^"]*\.mp4[^"]*)"/i) ||
                            html.match(/video":{"url":"(https:\/\/[^"]*\.mp4[^"]*)"/i) ||
                            html.match(/src="(https:\/\/[^"]*\.mp4[^"]*)"/i) ||
                            html.match(/"video":"(https:\/\/[^"]*\.mp4[^"]*)"/i);
          const titleMatch = html.match(/<title>(.*?)<\/title>/i);
          const thumbnailMatch = html.match(/og:image" content="(https:\/\/[^\s"]+\.jpg)"/i);
          if (!videoMatch) {
            throw new Error('No video URL found in scraped HTML');
          }
          return {
            videoUrl: videoMatch[1],
            title: titleMatch ? titleMatch[1] : 'Facebook Video',
            thumbnail: thumbnailMatch ? thumbnailMatch[1] : null
          };
        } catch (scrapeError) {
          throw new Error(`Failed to fetch video: Primary API error: ${primaryError.message}; Secondary API error: ${secondaryError.message}; Scraping error: ${scrapeError.message}`);
        }
      }
    }
  } catch (error) {
    throw error;
  }
}

async function searchFBVideos(query) {
  try {
    // Primary search API: fbdownloader.io (via corsproxy.io)
    const response = await axios.get(`https://corsproxy.io/?${encodeURIComponent(`https://fbdownloader.io/api/search?q=${encodeURIComponent(query)}&limit=3`)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Referer': 'https://fbdownloader.io/',
        'Origin': 'https://fbdownloader.io'
      }
    });
    const results = response.data.videos;
    if (!results || !results.length) {
      throw new Error('No videos found in primary API search response');
    }
    return results.slice(0, 3).map((item, index) => ({
      videoUrl: item.video_url,
      title: item.title || `Video ${index + 1} for ${query}`,
      thumbnail: item.thumbnail || null
    }));
  } catch (error) {
    // Fallback: Scrape fbdownloader.io search
    try {
      const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0.0.0 Safari/537.36',
        'Referer': 'https://fbdownloader.io/',
        'Origin': 'https://fbdownloader.io'
      };
      const response = await axios.get(`https://fbdownloader.io/search?q=${encodeURIComponent(query)}`, { headers });
      const data = response.data;
      const videoMatches = Array.from(data.matchAll(/href="(https:\/\/[^\s"]+\.mp4[^"]*)"/g));
      if (!videoMatches.length) {
        throw new Error('No videos found in fallback search response');
      }
      return videoMatches.slice(0, 3).map((match, index) => ({
        videoUrl: match[1],
        title: `Video ${index + 1} for ${query}`,
        thumbnail: data.match(/<img[^>]+src=["'](https:\/\/[^\s"']+\.jpg)["']/i)?.[1] || null
      }));
    } catch (scrapeError) {
      throw new Error(`Failed to search videos: Primary API error: ${error.message}; Scraping error: ${scrapeError.message}`);
    }
  }
}

export default horla({
  nomCom: 'fbdl2',
  aliases: ['facebook'],
  categorie: 'Downloader',
  reaction: '📽️'
}, async (msg, { sock, args }) => {
  const from = msg.key.remoteJid;
  const userName = msg.pushName || 'User';

  try {
    const query = args.join(' ').trim();

    if (!query) {
      await sock.sendMessage(from, {
        text: `◈━━━━━━━━━━━━━━━━◈\n│❒ WAKE UP, ${userName}! Give me a public Facebook video link or search term! 😤\n│❒ Usage:\n│❒ • ?fbdl2 <search term>\n│❒ • ?fbdl2 <video URL>\n│❒ Examples:\n│❒ • ?fbdl2 ShanksComics\n│❒ • ?facebook https://www.facebook.com/share/v/16Z4DJkviG/?mibextid=jmPrMh\n│❒ • ?fbdl2 https://m.facebook.com/watch/?v=377667495157343\n◈━━━━━━━━━━━━━━━━◈`,
        react: { text: '❌', key: msg.key }
      }, { quoted: msg });
      return;
    }

    const isUrl = query.includes('facebook.com') || query.includes('fb.watch');
    let mediaItems = [];

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0.0.0 Safari/537.36',
      'Accept': 'video/mp4,video/*;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Connection': 'keep-alive',
      'Referer': 'https://m.facebook.com/'
    };

    await sock.sendMessage(from, {
      text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Fetching ${isUrl ? 'video' : `videos for "${query}"`}, ${userName}... 🔍\n◈━━━━━━━━━━━━━━━━◈`,
      react: { text: '⏳', key: msg.key }
    }, { quoted: msg });

    if (isUrl) {
      console.log(`[facebook] Processing URL: ${query}`);
      const result = await getFBInfo(query);
      mediaItems = [{ videoUrl: result.videoUrl, title: result.title, thumbnail: result.thumbnail }];
      console.log(`[facebook] Selected video URL: ${result.videoUrl}`);
    } else {
      console.log(`[facebook] Searching for: ${query}`);
      mediaItems = await searchFBVideos(query);
      console.log(`[facebook] Selected video URLs: ${mediaItems.map(item => item.videoUrl).join(', ')}`);
    }

    const mediaBuffers = [];
    for (let i = 0; i < mediaItems.length; i++) {
      const { videoUrl } = mediaItems[i];
      await sock.sendMessage(from, { react: { text: '⏳', key: msg.key } }, { quoted: msg });
      console.log(`[facebook] Downloading video ${i + 1} from: ${videoUrl}`);
      const headResponse = await axios.head(videoUrl, { headers });
      const contentType = headResponse.headers['content-type'];
      console.log(`[facebook] Video ${i + 1} Content-Type: ${contentType}`);
      if (!contentType || !contentType.includes('video/mp4')) {
        throw new Error(`Invalid media type for video ${i + 1}: ${contentType || 'unknown'}`);
      }

      const response = await axios.get(videoUrl, {
        responseType: 'arraybuffer',
        headers,
        maxRedirects: 5
      });

      const buffer = Buffer.from(response.data);
      console.log(`[facebook] Buffer received for video ${i + 1}, size: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);
      mediaBuffers.push({ buffer, contentType, title: mediaItems[i].title, thumbnail: mediaItems[i].thumbnail });
    }

    console.log(`[facebook] Sending ${mediaBuffers.length} video(s) to user`);
    for (const media of mediaBuffers) {
      if (media.thumbnail) {
        await sock.sendMessage(from, {
          image: { url: media.thumbnail },
          mimetype: 'image/jpeg'
        }, { quoted: msg });
      }
    }

    if (mediaBuffers.length > 1) {
      const mediaMessages = mediaBuffers.map(media => ({
        video: media.buffer,
        mimetype: media.contentType
      }));

      try {
        await sock.sendMessage(from, { mediaGroup: mediaMessages }, { quoted: msg });
        await sock.sendMessage(from, {
          text: `◈━━━━━━━━━━━━━━━━◈\n│❒ NAILED IT, ${userName}! 🔥\n│❒ Title: ${mediaBuffers[0].title}\n│❒ Downloaded ${mediaBuffers.length} video(s) from: Facebook\n│❒ Powered by HORLA POOKIE Bot\n◈━━━━━━━━━━━━━━━━◈`,
          react: { text: '✅', key: msg.key }
        }, { quoted: msg });
      } catch (error) {
        console.error('[facebook] Carousel failed:', error.message);
        for (const media of mediaBuffers) {
          await sock.sendMessage(from, {
            video: media.buffer,
            mimetype: media.contentType
          }, { quoted: msg });
        }
        await sock.sendMessage(from, {
          text: `◈━━━━━━━━━━━━━━━━◈\n│❒ NAILED IT, ${userName}! 🔥\n│❒ Title: ${mediaBuffers[0].title}\n│❒ Downloaded ${mediaBuffers.length} video(s) from: Facebook\n│❒ Sent individually due to carousel issue. Update your bot for horizontal scrolling.\n│❒ Powered by HORLA POOKIE Bot\n◈━━━━━━━━━━━━━━━━◈`,
          react: { text: '✅', key: msg.key }
        }, { quoted: msg });
      }
    } else {
      await sock.sendMessage(from, {
        video: mediaBuffers[0].buffer,
        mimetype: mediaBuffers[0].contentType
      }, { quoted: msg });
      await sock.sendMessage(from, {
        text: `◈━━━━━━━━━━━━━━━━◈\n│❒ NAILED IT, ${userName}! 🔥\n│❒ Title: ${mediaBuffers[0].title}\n│❒ Downloaded from: Facebook\n│❒ Powered by HORLA POOKIE Bot\n◈━━━━━━━━━━━━━━━━◈`,
        react: { text: '✅', key: msg.key }
      }, { quoted: msg });
    }

    console.log(`[facebook] Videos sent successfully`);

  } catch (error) {
    console.error('[facebook] Error:', error.message);
    let errorMessage = `◈━━━━━━━━━━━━━━━━◈\n│❒ FAILED, ${userName}! Failed to download Facebook video. 😡\n│❒ Error: ${error.message}\n│❒ Try:\n│❒ • Different search term or URL\n│❒ • Ensure the video is public\n│❒ • Check your connection\n◈━━━━━━━━━━━━━━━━◈`;
    if (error.message.includes('400')) {
      errorMessage = `◈━━━━━━━━━━━━━━━━◈\n│❒ FAILED, ${userName}! Invalid request (400). 😡\n│❒ This might be due to:\n│❒ • Unsupported URL format\n│❒ • API restrictions\n│❒ • Invalid video link\n│❒ Try a different URL (e.g., https://m.facebook.com/watch/?v=377667495157343)\n◈━━━━━━━━━━━━━━━━◈`;
    } else if (error.message.includes('403')) {
      errorMessage = `◈━━━━━━━━━━━━━━━━◈\n│❒ FAILED, ${userName}! Access denied (403). 😡\n│❒ This might be due to:\n│❒ • Private or restricted video\n│❒ • API restrictions\n│❒ • Invalid URL\n│❒ Try a different URL or search term\n◈━━━━━━━━━━━━━━━━◈`;
    } else if (error.message.includes('404') || error.message.includes('Not Found') || error.message.includes('undefined')) {
      errorMessage = `◈━━━━━━━━━━━━━━━━◈\n│❒ FAILED, ${userName}! Video not found. 😡\n│❒ This might be due to:\n│❒ • Invalid or restricted video\n│❒ • API issue\n│❒ Try a different search term or URL\n◈━━━━━━━━━━━━━━━━◈`;
    } else if (error.message.includes('Invalid media type')) {
      errorMessage = `◈━━━━━━━━━━━━━━━━◈\n│❒ FAILED, ${userName}! Invalid media type. 😡\n│❒ This might be due to:\n│❒ • Corrupted or unsupported format\n│❒ • API returning invalid data\n│❒ Try a different URL or search term\n◈━━━━━━━━━━━━━━━━◈`;
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('Network connectivity issue')) {
      errorMessage = `◈━━━━━━━━━━━━━━━━◈\n│❒ FAILED, ${userName}! Network or API issue detected. 😡\n│❒ This might be due to:\n│❒ • API downtime\n│❒ • Network issues\n│❒ • Regional restrictions\n│❒ Try a different search term or URL, or check your network\n◈━━━━━━━━━━━━━━━━◈`;
    } else if (error.message.includes('private or restricted')) {
      errorMessage = `◈━━━━━━━━━━━━━━━━◈\n│❒ FAILED, ${userName}! Video is private or restricted. 😡\n│❒ This might be due to:\n│❒ • Video requires login or specific permissions\n│❒ • Region-locked content\n│❒ Try a public video URL or different search term\n◈━━━━━━━━━━━━━━━━◈`;
    }
    await sock.sendMessage(from, {
      text: errorMessage,
      react: { text: '❌', key: msg.key }
    }, { quoted: msg });
  }
});