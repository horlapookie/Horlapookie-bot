import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { writeFile } from 'fs/promises';
import path from 'path';
import { tmpdir } from 'os';
import fs from 'fs';
import path2 from 'path';

// Load emojis
const emojisPath = path2.join(process.cwd(), 'data', 'emojis.json');
const emojis = JSON.parse(fs.readFileSync(emojisPath, 'utf8'));

export default {
  name: 'xx2',
  description: 'Download NSFW videos from XNXX',
  category: 'NSFW',

  async execute(msg, { sock, args }) {
    const dest = msg.key.remoteJid;

    if (!args || args.length === 0) {
      return await sock.sendMessage(dest, {
        text: `${emojis.error} Please provide a valid XNXX video link.\nExample: #xx2 https://www.xnxx.com/video-abc123/title`
      }, { quoted: msg });
    }

    const link = args[0];
    if (!/^https:\/\/(www\.)?xnxx\.com\/video/i.test(link)) {
      return await sock.sendMessage(dest, {
        text: `${emojis.error} Invalid XNXX link format.`
      }, { quoted: msg });
    }

    try {
      await sock.sendMessage(dest, { react: { text: emojis.processing, key: msg.key } });
      await sock.sendMessage(dest, { text: '⏳ Fetching video page, please wait...', quoted: msg });

      const res = await fetch(link, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/115.0.0.0 Safari/537.36'
        }
      });

      if (!res.ok) throw new Error('Failed to fetch video page.');
      const html = await res.text();
      const $ = cheerio.load(html);

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

      if (!videoUrl) {
        return await sock.sendMessage(dest, {
          text: `${emojis.error} Failed to extract video URL.`
        }, { quoted: msg });
      }

      const title = $('h2.page-title').text().trim() || 'xnxx_download';
      await sock.sendMessage(dest, { text: '⏳ Downloading video, please wait...', quoted: msg });

      const fileRes = await fetch(videoUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/115.0.0.0 Safari/537.36'
        }
      });

      if (!fileRes.ok) throw new Error('Failed to download video file.');
      const buffer = await fileRes.buffer();
      const cleanTitle = title.replace(/[^\w\s]/gi, '').slice(0, 30);
      const filename = path.join(tmpdir(), `${cleanTitle}.mp4`);

      await writeFile(filename, buffer);

      await sock.sendMessage(dest, {
        video: { url: filename },
        caption: `🔞 *${title}*\nDownloaded from: ${link}`
      }, { quoted: msg });

      await sock.sendMessage(dest, { react: { text: emojis.success, key: msg.key } });

      // Optionally delete temp file after sending
      // import { unlink } from 'fs/promises';
      // await unlink(filename);

    } catch (err) {
      console.error('[xx2] Error:', err);
      await sock.sendMessage(dest, {
        text: `${emojis.error} Failed to download the video.\n\n${err.message}`
      }, { quoted: msg });
    }
  }
};
