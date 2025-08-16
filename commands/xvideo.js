import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { writeFile } from 'fs/promises';
import path from 'path';
import { tmpdir } from 'os';
import fs from 'fs';
import { horla } from '../lib/horla.js';

// Load emojis
const emojisPath = path.join(process.cwd(), 'data', 'emojis.json');
const emojis = JSON.parse(fs.readFileSync(emojisPath, 'utf8'));

export default horla({
  nomCom: "xvideo",
  categorie: 'NSFW',
  reaction: emojis.adult || '🔞'
}, async (msg, { sock, args }) => {
  try {
    const from = msg.key.remoteJid;
    const userName = msg.pushName || "User";

    // React with processing emoji
    await sock.sendMessage(from, {
      react: { text: emojis.processing, key: msg.key }
    });

    if (!args || args.length === 0) {
      await sock.sendMessage(from, {
        text: `◈━━━━━━━━━━━━━━━━◈\n│❒ WAKE UP, ${userName}! Give me a valid xvideos.com URL or search term! 😤\n│❒ Example: ?xvideo https://www.xvideos.com/video12345\n│❒ Or: ?xvideo search term\n◈━━━━━━━━━━━━━━━━◈`,
        react: { text: emojis.warning, key: msg.key }
      }, { quoted: msg });
      return;
    }

    const input = args.join(' ').trim();

    // Check if it's a URL or search term
    const isUrl = /^https:\/\/(www\.)?xvideos\.com\/video/i.test(input);

    if (isUrl) {
      // Download video from URL using xget.js logic
      await sock.sendMessage(from, {
        text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Yo ${userName}, downloading your video, hang tight! 🔍\n◈━━━━━━━━━━━━━━━━◈`
      }, { quoted: msg });

      try {
        // Better URL validation
        if (!input.includes('xvideos.com') || !input.includes('video')) {
          throw new Error('Invalid XVideos URL. Please provide a valid video link.');
        }

        const res = await fetch(input, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Cache-Control': 'no-cache'
          },
          timeout: 10000
        });

        if (!res.ok) {
          if (res.status === 404) {
            throw new Error('Video not found. The video may have been removed or the link is incorrect.');
          } else if (res.status === 403) {
            throw new Error('Access denied. The video may be region-restricted.');
          } else {
            throw new Error(`Failed to fetch video page. HTTP ${res.status}: ${res.statusText}`);
          }
        }

        const html = await res.text();
        const $ = cheerio.load(html);

        // Exact same video URL extraction logic as xget.js
        let videoUrl = $('video > source').attr('src') || $('#html5video_base source').attr('src');

        if (!videoUrl) {
          const scripts = $('script').get();
          for (const script of scripts) {
            const scriptContent = $(script).html();
            if (!scriptContent) continue;

            // Match setVideoUrlHigh('...')
            let match = scriptContent.match(/setVideoUrlHigh\s*\(\s*['"](.+?)['"]\s*\)/);
            if (match && match[1]) {
              videoUrl = match[1];
              break;
            }

            // Match setVideoUrlLow('...')
            match = scriptContent.match(/setVideoUrlLow\s*\(\s*['"](.+?)['"]\s*\)/);
            if (match && match[1]) {
              videoUrl = match[1];
              break;
            }
          }
        }

        // Look for video URL patterns with more comprehensive search
        const videoPatterns = [
          /html5player\.setVideoUrlLow\('([^']+)'\)/,
          /html5player\.setVideoUrlHigh\('([^']+)'\)/,
          /html5player\.setVideoHLS\('([^']+)'\)/,
          /setVideoUrlLow\('([^']+)'\)/,
          /setVideoUrlHigh\('([^']+)'\)/,
          /"url_low":"([^"]+)"/,
          /"url_high":"([^"]+)"/,
          /"video_url":"([^"]+)"/,
          /video_url['"]\s*:\s*['"]([^'"]+)['"]/,
          /'video_url'\s*:\s*'([^']+)'/
        ];

        let refinedVideoUrl = null;
        for (const pattern of videoPatterns) {
          const match = html.match(pattern);
          if (match) {
            refinedVideoUrl = match[1].replace(/\\/g, '');
            // Validate URL
            if (refinedVideoUrl.startsWith('http') || refinedVideoUrl.startsWith('//')) {
              if (refinedVideoUrl.startsWith('//')) {
                refinedVideoUrl = 'https:' + refinedVideoUrl;
              }
              break;
            }
          }
        }

        if (!refinedVideoUrl) {
          // Try alternative extraction method
          const scriptMatches = html.match(/<script[^>]*>(.*?)<\/script>/gis);
          for (const script of scriptMatches || []) {
            const urlMatch = script.match(/(?:url_low|url_high|video_url)["']\s*:\s*["']([^"']+)["']/i);
            if (urlMatch && urlMatch[1].startsWith('http')) {
              refinedVideoUrl = urlMatch[1];
              break;
            }
          }
        }

        if (!refinedVideoUrl) {
          throw new Error('Could not extract video download URL. The video may be private or protected.');
        }
        videoUrl = refinedVideoUrl;


        if (!videoUrl) {
          await sock.sendMessage(from, {
            text: `◈━━━━━━━━━━━━━━━━◈\n│❒ EPIC FLOP, ${userName}! Couldn't extract video URL! 😡\n│❒ The video might be premium or region-locked!\n◈━━━━━━━━━━━━━━━━◈`,
            react: { text: emojis.error, key: msg.key }
          }, { quoted: msg });
          return;
        }

        const title = $('h2.page-title').text().trim() || 'xvideos_download';

        await sock.sendMessage(from, {
          text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Downloading video: ${title.slice(0, 50)}...\n│❒ Please wait, ${userName}... 📥\n◈━━━━━━━━━━━━━━━━◈`
        }, { quoted: msg });

        // Download video file using same headers and method as xget.js
        const fileRes = await fetch(videoUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
          }
        });

        if (!fileRes.ok) throw new Error(`Failed to download video file. HTTP ${fileRes.status}`);

        const buffer = await fileRes.buffer();
        const cleanTitle = title.replace(/[^\w\s]/gi, '').slice(0, 30);
        const filename = path.join(tmpdir(), `${cleanTitle}.mp4`);

        await writeFile(filename, buffer);

        await sock.sendMessage(from, {
          video: { url: filename },
          caption: `◈━━━━━━━━━━━━━━━━◈\n│❒ NAILED IT, ${userName}! 🔥\n│❒ Title: ${title}\n│❒ Downloaded from: ${input}\n│❒ Powered by HORLA POOKIE Bot\n◈━━━━━━━━━━━━━━━━◈`,
          react: { text: emojis.success, key: msg.key }
        }, { quoted: msg });

        // Clean up temp file
        setTimeout(() => {
          try {
            require('fs').unlinkSync(filename);
          } catch (e) {
            console.log('Could not delete temp file:', e.message);
          }
        }, 60000);

      } catch (error) {
        console.error('Video download error:', error.message);

        let errorMessage = error.message;
        if (error.message.includes('fetch video page')) {
          errorMessage = 'Failed to access video page. The video may be removed or region-blocked.';
        } else if (error.message.includes('Could not extract')) {
          errorMessage = 'Video format not supported or protected content.';
        } else if (error.message.includes('Invalid XVideos URL')) {
          errorMessage = 'Please provide a valid XVideos video URL.';
        }

        await sock.sendMessage(from, {
          text: `◈━━━━━━━━━━━━━━━━◈\n│❒ DOWNLOAD FAILED, ${userName}! 😡\n│❒ ${errorMessage}\n│❒ \n│❒ Try:\n│❒ • Different video link\n│❒ • Check if video exists\n│❒ • Use direct video URL\n◈━━━━━━━━━━━━━━━━◈`
        }, { quoted: msg });
      }

    } else {
      // Search for videos
      await sock.sendMessage(from, {
        text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Searching for: ${input} 🔍\n◈━━━━━━━━━━━━━━━━◈`
      }, { quoted: msg });

      try {
        const searchUrl = `https://www.xvideos.com/?k=${encodeURIComponent(input)}`;
        const res = await fetch(searchUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
          }
        });

        if (!res.ok) {
          throw new Error('Failed to fetch search results');
        }

        const html = await res.text();
        const $ = cheerio.load(html);

        const results = [];
        const thumbBlocks = $('.mozaique .thumb-block').slice(0, 10);

        for (let i = 0; i < thumbBlocks.length; i++) {
          const el = thumbBlocks[i];
          const title = $(el).find('p.title a').text().trim();
          const href = $(el).find('p.title a').attr('href');
          if (!title || !href) continue;

          const mainLink = `https://www.xvideos.com${href}`;
          const duration = $(el).find('.duration').text().trim();

          results.push({
            title: title.slice(0, 50) + (title.length > 50 ? '...' : ''),
            url: mainLink,
            duration: duration || 'N/A'
          });
        }

        if (results.length === 0) {
          await sock.sendMessage(from, {
            text: `◈━━━━━━━━━━━━━━━━◈\n│❒ NO RESULTS FOUND, ${userName}! Try different keywords! 😕\n◈━━━━━━━━━━━━━━━━◈`,
            react: { text: emojis.warning, key: msg.key }
          }, { quoted: msg });
          return;
        }

        let resultText = `◈━━━━━━━━━━━━━━━━◈\n│❒ SEARCH RESULTS for: ${input}\n│❒ Requested by: ${userName}\n◈━━━━━━━━━━━━━━━━◈\n\n`;

        results.forEach((result, index) => {
          resultText += `${index + 1}. *${result.title}*\n`;
          resultText += `   ⏱️ Duration: ${result.duration}\n`;
          resultText += `   🔗 ${result.url}\n\n`;
        });

        resultText += `◈━━━━━━━━━━━━━━━━◈\n│❒ Use ?xvideo [URL] to download any video\n│❒ Powered by HORLA POOKIE Bot\n◈━━━━━━━━━━━━━━━━◈`;

        await sock.sendMessage(from, {
          text: resultText,
          react: { text: emojis.success, key: msg.key }
        }, { quoted: msg });

      } catch (searchError) {
        console.error('Search error:', searchError);
        await sock.sendMessage(from, {
          text: `◈━━━━━━━━━━━━━━━━◈\n│❒ SEARCH FAILED, ${userName}! ${searchError.message} 😡\n◈━━━━━━━━━━━━━━━━◈`,
          react: { text: emojis.error, key: msg.key }
        }, { quoted: msg });
      }
    }

  } catch (error) {
    console.error('xvideo error:', error);
    const userName = msg.pushName || "User";
    await sock.sendMessage(msg.key.remoteJid, {
      text: `◈━━━━━━━━━━━━━━━━◈\n│❒ CRASH AND BURN, ${userName}! Something broke: ${error.message} 😡\n◈━━━━━━━━━━━━━━━━◈`,
      react: { text: emojis.error, key: msg.key }
    }, { quoted: msg });
  }
});