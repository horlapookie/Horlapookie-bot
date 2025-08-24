import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

// Load emojis
const emojisPath = path.join(process.cwd(), 'data', 'emojis.json');
const emojis = JSON.parse(fs.readFileSync(emojisPath, 'utf8'));

export default {
  name: "hentaivid",
  description: "Sends a random NSFW hentai video (group only).",
  category: "NSFW",

  async execute(msg, { sock }) {
    const dest = msg.key.remoteJid;
    const isGroup = dest.endsWith('@g.us');

    if (!isGroup) {
      await sock.sendMessage(dest, {
        text: `${emojis.error} This command can only be used in group chats.`,
      }, { quoted: msg });
      return;
    }

    try {
      await sock.sendMessage(dest, {
        react: { text: emojis.processing, key: msg.key }
      });

      const videos = await fetchHentaiVideos();
      const index = Math.floor(Math.random() * Math.min(videos.length, 10));
      const selected = videos[index];

      await sock.sendMessage(dest, {
        video: { url: selected.video_1 },
        caption: `*Title:* ${selected.title}\n*Category:* ${selected.category}`,
      }, { quoted: msg });

      await sock.sendMessage(dest, {
        react: { text: emojis.success, key: msg.key }
      });

    } catch (error) {
      await sock.sendMessage(dest, {
        text: `${emojis.error} Failed to fetch hentai video.\n\nError: ${error.message}`,
      }, { quoted: msg });
    }
  }
};

async function fetchHentaiVideos() {
  return new Promise((resolve, reject) => {
    const page = Math.floor(Math.random() * 1153);
    axios.get(`https://sfmcompile.club/page/${page}`)
      .then((response) => {
        const $ = cheerio.load(response.data);
        const results = [];

        $('#primary > div > div > ul > li > article').each((i, el) => {
          results.push({
            title: $(el).find('header > h2').text(),
            link: $(el).find('header > h2 > a').attr('href'),
            category: $(el).find('header > div.entry-before-title > span > span').text().replace('in ', ''),
            share_count: $(el).find('header > div.entry-after-title > p > span.entry-shares').text(),
            views_count: $(el).find('header > div.entry-after-title > p > span.entry-views').text(),
            type: $(el).find('source').attr('type') || 'video/mp4',
            video_1: $(el).find('source').attr('src') || $(el).find('img').attr('data-src'),
            video_2: $(el).find('video > a').attr('href') || ''
          });
        });

        resolve(results);
      })
      .catch(reject);
  });
}
