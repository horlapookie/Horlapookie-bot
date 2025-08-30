import axios from 'axios';

export default {
  name: 'imgs',
  aliases: ['image'],
  description: '🖼️ Search for images',
  async execute(msg, { sock, args }) {
    const from = msg.key.remoteJid;

    if (!args.length) {
      return await sock.sendMessage(from, {
        text: '❌ Which image do you want to search for?\n\nExample: ?imgs cats'
      }, { quoted: msg });
    }

    const query = args.join(' ');

    try {
      await sock.sendMessage(from, {
        text: '🔍 Searching for images...'
      }, { quoted: msg });

      // Simple image search using a free API
      const searchUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=10&client_id=oZj8UYbfKhOVLxvF0F3tn5VcN5vVykmE-Z0WdCaJe6c`;

      const response = await axios.get(searchUrl, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (!response.data.results || response.data.results.length === 0) {
        return await sock.sendMessage(from, {
          text: `❌ No images found for "${query}".\n\nTry a different search term.`
        }, { quoted: msg });
      }

      const images = response.data.results;
      const randomImage = images[Math.floor(Math.random() * images.length)];

      await sock.sendMessage(from, {
        image: { url: randomImage.urls.regular },
        caption: `🖼️ *Image Search Results*\n\n🔍 *Query:* ${query}\n📸 *By:* ${randomImage.user.name}\n📊 *Found:* ${images.length} images\n\n*© HORLA POOKIE Bot*`
      }, { quoted: msg });

    } catch (error) {
      console.error('Image search error:', error);

      // Fallback to a simple image placeholder
      try {
        await sock.sendMessage(from, {
          image: { url: `https://via.placeholder.com/500x300/007bff/ffffff?text=${encodeURIComponent(query)}` },
          caption: `🖼️ *Image Search*\n\n🔍 *Query:* ${query}\n❌ *Error:* Could not fetch images from external sources\n📝 *Info:* Showing placeholder image\n\n*© HORLA POOKIE Bot*`
        }, { quoted: msg });
      } catch (fallbackError) {
        await sock.sendMessage(from, {
          text: `❌ Oops, an error occurred while searching for images.\n\nError: ${error.message}\n\nPlease try again later.`
        }, { quoted: msg });
      }
    }
  }
};