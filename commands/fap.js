import axios from 'axios';
import { horla } from '../lib/horla.js';
import fs from 'fs';

async function checkNetworkConnectivity() {
  try {
    await axios.get('https://www.google.com', { timeout: 5000 });
    console.log('[fap] Network connectivity: OK');
    return true;
  } catch (error) {
    console.error(`[fap] Network connectivity check failed: ${error.message}`);
    return false;
  }
}

async function fetchDynamicCookies(url) {
  try {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Referer': url
    };
    const response = await axios.get(url, { headers, timeout: 0 });
    const cookies = response.headers['set-cookie']?.join('; ') || '';
    console.log(`[fap] Fetched cookies for ${url}: ${cookies}`);
    return cookies;
  } catch (error) {
    console.error(`[fap] Cookie fetch failed for ${url}: ${error.message}`);
    return '';
  }
}

async function fetchWithRetry(url, headers, retries = 3, backoff = 1000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await axios.get(url, { headers, timeout: 0 });
      console.log(`[fap] Fetch successful for ${url} on attempt ${attempt}`);
      return response;
    } catch (error) {
      if ([403, 500].includes(error.response?.status) && attempt < retries) {
        console.log(`[fap] ${error.response?.status} on attempt ${attempt} for ${url}, retrying after ${backoff}ms`);
        await new Promise(resolve => setTimeout(resolve, backoff));
        backoff *= 2;
      } else {
        throw error;
      }
    }
  }
  throw new Error('Max retries reached');
}

async function searchXFreeVideos() {
  try {
    const queries = ['tiktok', 'creampie', 'reels', 'trending'];
    const query = queries[Math.floor(Math.random() * queries.length)];
    console.log(`[fap] Using xfree.com query: ${query}`);
    const cookies = await fetchDynamicCookies('https://www.xfree.com/');
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Referer': 'https://www.xfree.com/',
      'Cookie': cookies
    };
    const searchUrl = `https://www.xfree.com/search?q=${encodeURIComponent(query)}`;
    console.log(`[fap] Fetching xfree.com search page: ${searchUrl}`);
    let videosHtml;
    try {
      const videosResponse = await fetchWithRetry(searchUrl, headers);
      videosHtml = videosResponse.data;
    } catch (directError) {
      console.log(`[fap] Direct request failed for xfree.com, trying proxy: ${directError.message}`);
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(searchUrl)}`;
      const videosResponse = await fetchWithRetry(proxyUrl, headers);
      videosHtml = videosResponse.data;
    }
    const videoLinks = videosHtml.match(/\/video\?id=\d+&title=[^"' >]+/gi) || [];
    console.log(`[fap] Found ${videoLinks.length} xfree.com video links`);
    if (!videoLinks.length) {
      fs.writeFileSync('./xfree_debug.html', videosHtml);
      throw new Error(`No video links found for xfree.com query: ${query}`);
    }
    const randomLink = videoLinks[Math.floor(Math.random() * videoLinks.length)];
    const idMatch = randomLink.match(/id=(\d+)/i);
    const titleMatch = randomLink.match(/title=([^"' >]+)/i);
    if (!idMatch || !titleMatch) {
      throw new Error('Failed to parse xfree.com video ID or title');
    }
    const videoId = idMatch[1];
    const videoTitle = decodeURIComponent(titleMatch[1].replace(/\+/g, ' '));
    const videoUrl = `https://www.xfree.com/video?id=${videoId}&title=${encodeURIComponent(videoTitle)}`;
    console.log(`[fap] Selected xfree.com video: ${videoUrl}`);
    let videoResponse;
    try {
      videoResponse = await fetchWithRetry(videoUrl, headers);
    } catch (directError) {
      console.log(`[fap] Direct request failed for xfree.com video page, trying proxy: ${directError.message}`);
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(videoUrl)}`;
      videoResponse = await fetchWithRetry(proxyUrl, headers);
    }
    const html = videoResponse.data;
    const videoMatch = html.match(/(?:<video[^>]*>|<source[^>]*>)\s*src=["']?(https:\/\/[^\s"']+\.mp4[^"']*)["']?/i);
    const durationMatch = html.match(/duration["'\s:]+(\d+):(\d+)/i);
    if (!videoMatch) {
      fs.writeFileSync('./xfree_video_debug.html', html);
      throw new Error('No video URL found in xfree.com video page');
    }
    console.log(`[fap] Found xfree.com video URL: ${videoMatch[1]}`);
    const duration = durationMatch ? parseInt(durationMatch[1]) * 60 + parseInt(durationMatch[2]) : 30;
    if (duration > 300) {
      throw new Error('xfree.com video exceeds 5-minute limit');
    }
    return {
      url: videoMatch[1],
      title: videoTitle.slice(0, 50),
      creator: 'Unknown',
      source: 'XFree',
      duration
    };
  } catch (error) {
    console.error(`[fap] xfree.com scrape error: ${error.message}`);
    return null;
  }
}

async function searchShortsXXXVideos() {
  try {
    const cookies = await fetchDynamicCookies('https://www.shorts.xxx/');
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Referer': 'https://www.shorts.xxx/',
      'Cookie': cookies
    };
    // Try trending page, fallback to homepage, then post IDs
    let postsHtml;
    const trendingUrl = 'https://www.shorts.xxx/trending';
    console.log(`[fap] Fetching shorts.xxx trending page: ${trendingUrl}`);
    try {
      const postsResponse = await fetchWithRetry(trendingUrl, headers);
      postsHtml = postsResponse.data;
    } catch (directError) {
      console.log(`[fap] Direct request failed for shorts.xxx trending, trying proxy: ${directError.message}`);
      try {
        const postsResponse = await fetchWithRetry(
          `https://api.allorigins.win/raw?url=${encodeURIComponent(trendingUrl)}`,
          headers
        );
        postsHtml = postsResponse.data;
      } catch (proxyError) {
        console.log(`[fap] Proxy failed for trending, trying homepage: ${proxyError.message}`);
        const homeUrl = 'https://www.shorts.xxx/';
        console.log(`[fap] Fetching shorts.xxx homepage: ${homeUrl}`);
        const postsResponse = await fetchWithRetry(homeUrl, headers);
        postsHtml = postsResponse.data;
      }
    }
    let postLinks = postsHtml.match(/href=["']?\/post\/(\d+)["'>]/gi) || [];
    console.log(`[fap] Found ${postLinks.length} shorts.xxx post links`);
    // Fallback to known post IDs
    if (!postLinks.length) {
      console.log('[fap] No post links found, using fallback post IDs');
      fs.writeFileSync('./shortsxxx_debug.html', postsHtml);
      const fallbackIds = Array.from({ length: 10 }, (_, i) => 895 + i); // 895 to 904
      const randomId = fallbackIds[Math.floor(Math.random() * fallbackIds.length)];
      postLinks = [`href="/post/${randomId}"`];
    }
    const randomPost = postLinks[Math.floor(Math.random() * postLinks.length)];
    const idMatch = randomPost.match(/\/post\/(\d+)/i);
    if (!idMatch) {
      throw new Error('Failed to parse shorts.xxx post ID');
    }
    const postId = idMatch[1];
    const postUrl = `https://www.shorts.xxx/post/${postId}`;
    console.log(`[fap] Selected shorts.xxx post: ${postUrl}`);
    let postResponse;
    try {
      postResponse = await fetchWithRetry(postUrl, headers);
    } catch (directError) {
      console.log(`[fap] Direct request failed for shorts.xxx post page, trying proxy: ${directError.message}`);
      postResponse = await fetchWithRetry(
        `https://api.allorigins.win/raw?url=${encodeURIComponent(postUrl)}`,
        headers
      );
    }
    const html = postResponse.data;
    const videoMatch = html.match(/(?:<video[^>]*>|<source[^>]*>)\s*src=["']?(https:\/\/[^\s"']+\.mp4[^"']*)["']?/i);
    const titleMatch = html.match(/<meta name="description" content="([^"]*)"/i);
    const durationMatch = html.match(/duration["'\s:]+(\d+):(\d+)/i);
    if (!videoMatch) {
      fs.writeFileSync('./shortsxxx_post_debug.html', html);
      throw new Error('No video URL found in shorts.xxx post page');
    }
    console.log(`[fap] Found shorts.xxx video URL: ${videoMatch[1]}`);
    const duration = durationMatch ? parseInt(durationMatch[1]) * 60 + parseInt(durationMatch[2]) : 30;
    if (duration > 300) {
      throw new Error('shorts.xxx video exceeds 5-minute limit');
    }
    return {
      url: videoMatch[1],
      title: titleMatch ? titleMatch[1].slice(0, 50) : 'ShortsXXX Reel',
      creator: 'Unknown',
      source: 'ShortsXXX',
      duration
    };
  } catch (error) {
    console.error(`[fap] shorts.xxx scrape error: ${error.message}`);
    return null;
  }
}

export default horla({
  nomCom: 'fap',
  description: 'Send a short adult video reel (up to 5 min) from xfree.com or shorts.xxx.',
  categorie: 'NSFW',
  reaction: '🔥'
}, async (msg, { sock }) => {
  const chatId = msg.key.remoteJid;
  const userName = msg.pushName || 'User';

  try {
    // Check network connectivity
    const isNetworkOk = await checkNetworkConnectivity();
    if (!isNetworkOk) {
      throw new Error('Network connectivity issue detected');
    }

    await sock.sendMessage(chatId, {
      text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Fetching a spicy reel for ${userName}... 🔥\n◈━━━━━━━━━━━━━━━━◈`,
      react: { text: '⏳', key: msg.key }
    }, { quoted: msg });

    // Try xfree.com first, then shorts.xxx
    let video = await searchXFreeVideos();
    let source = 'XFree';

    if (!video) {
      console.log('[fap] xfree.com failed, falling back to shorts.xxx');
      video = await searchShortsXXXVideos();
      source = 'ShortsXXX';
    }

    if (!video) {
      await sock.sendMessage(chatId, {
        text: `◈━━━━━━━━━━━━━━━━◈\n│❒ FAILED, ${userName}! No videos found. 😡\n│❒ This might be due to:\n│❒ • Site downtime\n│❒ • Network issues\n│❒ • No matching videos\n│❒ Try again later.\n◈━━━━━━━━━━━━━━━━◈`,
        react: { text: '❌', key: msg.key }
      }, { quoted: msg });
      return;
    }

    // Download video
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36',
      'Accept': 'video/mp4,video/*;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Referer': video.source === 'XFree' ? 'https://www.xfree.com/' : 'https://www.shorts.xxx/'
    };
    console.log(`[fap] Checking video URL: ${video.url}`);
    const headResponse = await axios.head(video.url, { headers, timeout: 0 });
    const contentType = headResponse.headers['content-type'];
    console.log(`[fap] Video Content-Type: ${contentType}`);
    if (!contentType || !contentType.includes('video/mp4')) {
      throw new Error(`Invalid media type: ${contentType || 'unknown'}`);
    }

    const response = await axios.get(video.url, {
      responseType: 'arraybuffer',
      headers,
      maxRedirects: 5,
      timeout: 0
    });

    const buffer = Buffer.from(response.data);
    console.log(`[fap] Buffer received, size: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);

    // Send video
    await sock.sendMessage(chatId, {
      video: buffer,
      mimetype: contentType,
      caption: `◈━━━━━━━━━━━━━━━━◈\n│❒ NAILED IT, ${userName}! 🔥\n│❒ Title: ${video.title}\n│❒ By: ${video.creator}\n│❒ Source: ${video.source}\n│❒ Duration: ${video.duration}s\n│❒ Powered by HORLA POOKIE Bot\n◈━━━━━━━━━━━━━━━━◈`,
      gifPlayback: false,
      mentions: [msg.key.participant]
    }, { quoted: msg });

    await sock.sendMessage(chatId, { react: { text: '✅', key: msg.key } }, { quoted: msg });
    console.log('[fap] Video sent successfully');

  } catch (error) {
    console.error('[fap] Error:', error.message);
    let errorMessage = `◈━━━━━━━━━━━━━━━━◈\n│❒ FAILED, ${userName}! Failed to fetch video. 😡\n│❒ Error: ${error.message}\n│❒ Try again later.\n◈━━━━━━━━━━━━━━━━◈`;
    if (error.message.includes('404')) {
      errorMessage = `◈━━━━━━━━━━━━━━━━◈\n│❒ FAILED, ${userName}! Video not found (404). 😡\n│❒ This might be due to:\n│❒ • Invalid video ID\n│❒ • Site changes\n│❒ Try again later.\n◈━━━━━━━━━━━━━━━━◈`;
    } else if (error.message.includes('403')) {
      errorMessage = `◈━━━━━━━━━━━━━━━━◈\n│❒ FAILED, ${userName}! Access denied (403). 😡\n│❒ This might be due to:\n│❒ • CloudFlare protection\n│❒ • Authentication required\n│❒ Try again later.\n◈━━━━━━━━━━━━━━━━◈`;
    } else if (error.message.includes('500')) {
      errorMessage = `◈━━━━━━━━━━━━━━━━◈\n│❒ FAILED, ${userName}! Server error (500). 😡\n│❒ This might be due to:\n│❒ • Site downtime\n│❒ • CloudFlare blocking\n│❒ • Server overload\n│❒ Try again later.\n◈━━━━━━━━━━━━━━━━◈`;
    } else if (error.message.includes('Invalid media type')) {
      errorMessage = `◈━━━━━━━━━━━━━━━━◈\n│❒ FAILED, ${userName}! Invalid media type. 😡\n│❒ This might be due to:\n│❒ • Corrupted video\n│❒ • Site issue\n│❒ Try again later.\n◈━━━━━━━━━━━━━━━━◈`;
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('Network connectivity issue')) {
      errorMessage = `◈━━━━━━━━━━━━━━━━◈\n│❒ FAILED, ${userName}! Network or site issue detected. 😡\n│❒ This might be due to:\n│❒ • Site downtime\n│❒ • Network issues\n│❒ • Regional restrictions\n│❒ Try again later.\n◈━━━━━━━━━━━━━━━━◈`;
    } else if (error.message.includes('No video links found') || error.message.includes('No post links found')) {
      errorMessage = `◈━━━━━━━━━━━━━━━━◈\n│❒ FAILED, ${userName}! No videos found. 😡\n│❒ This might be due to:\n│❒ • Site changes\n│❒ • No matching videos\n│❒ Try again later.\n◈━━━━━━━━━━━━━━━━◈`;
    }
    await sock.sendMessage(chatId, {
      text: errorMessage,
      react: { text: '❌', key: msg.key }
    }, { quoted: msg });
  }
});