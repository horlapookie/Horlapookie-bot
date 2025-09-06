import axios from 'axios';

async function wikimediaScraper(query) {
  try {
    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=10&prop=imageinfo&iiprop=url&format=json`;
    const response = await axios.get(url);
    const pages = response.data.query?.pages;
    if (!pages) return [];

    return Object.values(pages).map(page => page.imageinfo?.[0].url).filter(Boolean);
  } catch (error) {
    throw error;
  }
}

export default {
  name: 'wikimedia',
  description: '🌐 Search images on Wikimedia Commons',
  async execute(msg, { sock, args }) {
    if (!args.length) return sock.sendMessage(msg.key.remoteJid, { text: '❗️ Please provide a search query.\nExample: $wikimedia river' });
    const query = args.join(' ');
    try {
      const images = await wikimediaScraper(query);
      if (images.length === 0) return sock.sendMessage(msg.key.remoteJid, { text: `😔 No images found for "${query}".` });
      for (let i = 0; i < Math.min(images.length, 5); i++) {
        await sock.sendMessage(msg.key.remoteJid, { image: { url: images[i] }, caption: `🌐 Wikimedia result ${i + 1} for "${query}"` });
      }
    } catch (error) {
      await sock.sendMessage(msg.key.remoteJid, { text: '⚠️ Error fetching Wikimedia images.' });
    }
  }
};
