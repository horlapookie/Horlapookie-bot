import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

export default {
  name: 'xx1',
  description: 'Search XNXX content. Use #xx2 to download videos.',
  category: 'NSFW',

  async execute(msg, { sock, args }) {
    const dest = msg.key.remoteJid;

    try {
      if (!args || args.length === 0) {
        return await sock.sendMessage(dest, {
          text: '❌ Please provide a search query.\n\nExample: #xx1 steppmom'
        }, { quoted: msg });
      }

      const query = args.join(' ');
      const searchUrl = `https://www.xnxx.com/search/${encodeURIComponent(query)}`;

      const res = await fetch(searchUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (!res.ok) {
        return await sock.sendMessage(dest, {
          text: '❌ Failed to fetch results from XNXX.'
        }, { quoted: msg });
      }

      const html = await res.text();
      const $ = cheerio.load(html);

      const results = [];
      const seen = new Set();

      // Grab all <a> tags that contain /video- (XNXX video links)
      $('a').each((i, el) => {
        const href = $(el).attr('href');
        const title = $(el).attr('title') || $(el).text().trim();
        if (!href || !title) return;
        if (!href.includes('/video-')) return;
        if (seen.has(href)) return; // avoid duplicates
        seen.add(href);

        const videoLink = href.startsWith('http') ? href : `https://www.xnxx.com${href}`;
        results.push(`*${results.length + 1}.* ${title}\n${videoLink}\n➡ Use #xx2 to download this video.`);
      });

      // Limit to first 10 results
      const finalResults = results.slice(0, 10);

      if (finalResults.length === 0) {
        return await sock.sendMessage(dest, {
          text: '❌ No results found.'
        }, { quoted: msg });
      }

      const message = `🔍 *Search Results for:* _${query}_\n\n${finalResults.join('\n\n')}`;
      await sock.sendMessage(dest, { text: message }, { quoted: msg });

    } catch (err) {
      console.error('[xx1] Error:', err);
      await sock.sendMessage(dest, {
        text: '❌ An error occurred while searching.'
      }, { quoted: msg });
    }
  }
};
