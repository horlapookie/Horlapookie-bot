import axios from 'axios';
import * as cheerio from 'cheerio';

async function wallpaperScraper(title, page = '1') {
  const url = `https://www.besthdwallpaper.com/search?CurrentPage=${page}&q=${encodeURIComponent(title)}`;
  const response = await axios.get(url);
  const $ = cheerio.load(response.data);
  const hasil = [];
  $('div.grid-item').each((i, el) => {
    hasil.push({
      title: $(el).find('div.info > a > h3').text(),
      image: $(el).find('picture > img').attr('data-src') || $(el).find('picture > img').attr('src')
    });
  });
  return hasil;
}

export default {
  name: 'wallpaper',
  description: '🖼️ Search wallpapers',
  async execute(msg, { sock, args }) {
    if (!args.length) return await sock.sendMessage(msg.key.remoteJid, { text: '❗️ Provide wallpaper name and optional page number.\nExample: $wallpaper cats 2' }, { quoted: msg });
    
    const pageArg = args[args.length - 1];
    let page = '1';
    let query = args.join(' ');

    if (!isNaN(pageArg)) {
      page = pageArg;
      query = args.slice(0, -1).join(' ');
    }

    try {
      const wallpapers = await wallpaperScraper(query, page);
      if (!wallpapers.length) return await sock.sendMessage(msg.key.remoteJid, { text: `😔 No wallpapers found for "${query}".` }, { quoted: msg });
      for (let i = 0; i < Math.min(wallpapers.length, 5); i++) {
        await sock.sendMessage(msg.key.remoteJid, {
          image: { url: wallpapers[i].image },
          caption: `🖼️ ${wallpapers[i].title} (Page ${page})`
        }, { quoted: msg });
      }
    } catch (e) {
      await sock.sendMessage(msg.key.remoteJid, { text: '⚠️ Error fetching wallpapers.' }, { quoted: msg });
    }
  }
};
