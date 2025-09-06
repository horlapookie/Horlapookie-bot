import axios from 'axios';
import * as cheerio from 'cheerio';

async function pinterestScraper(query) {
  try {
    const url = `https://id.pinterest.com/search/pins/?autologin=true&q=${encodeURIComponent(query)}`;
    const response = await axios.get(url, {
      headers: {
        cookie: `_auth=1; _b=...` // Replace with your Pinterest cookie
      }
    });
    const $ = cheerio.load(response.data);
    const result = [];
    $('div > a').each((i, el) => {
      const link = $(el).find('img').attr('src');
      if (link) result.push(link.replace(/236/g, '736'));
    });
    if (result.length > 0 && !result[0]) result.shift();
    return result;
  } catch (error) {
    throw error;
  }
}

export default {
  name: 'pinterest',
  description: '🔍 Search images on Pinterest',
  async execute(msg, { sock, args }) {
    if (!args.length) {
      return await sock.sendMessage(msg.key.remoteJid, { text: '❗️ Please provide a search query. Example: $pinterest cats' }, { quoted: msg });
    }
    const query = args.join(' ');
    try {
      const images = await pinterestScraper(query);
      if (images.length === 0) {
        return await sock.sendMessage(msg.key.remoteJid, { text: `😔 No results found for "${query}".` }, { quoted: msg });
      }
      for (let i = 0; i < Math.min(images.length, 5); i++) {
        await sock.sendMessage(msg.key.remoteJid, { image: { url: images[i] }, caption: `📌 Result ${i + 1} for "${query}"` }, { quoted: msg });
      }
    } catch (error) {
      await sock.sendMessage(msg.key.remoteJid, { text: '⚠️ Error fetching Pinterest images.' }, { quoted: msg });
    }
  }
};
