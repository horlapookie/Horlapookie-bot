
import axios from 'axios';

export default {
  name: 'messi',
  description: 'Get random Messi images',
  aliases: ['lionel'],
  category: 'Search',
  async execute(msg, { sock, args }) {
    const from = msg.key.remoteJid;

    try {
      const messiApis = [
        "https://raw.githubusercontent.com/Guru322/api/Guru/BOT-JSON/Messi.json",
        "https://api.github.com/repos/Guru322/api/contents/BOT-JSON/Messi.json"
      ];

      let images = [];
      
      // Try each API until we get images
      for (const api of messiApis) {
        try {
          const response = await axios.get(api, { timeout: 10000 });
          
          if (api.includes('api.github.com')) {
            // GitHub API returns base64 encoded content
            const content = Buffer.from(response.data.content, 'base64').toString('utf8');
            const data = JSON.parse(content);
            images = data.images || data;
          } else {
            // Direct JSON API
            images = response.data.images || response.data;
          }
          
          if (images && images.length > 0) {
            break;
          }
        } catch (apiError) {
          console.log(`Messi API ${api} failed, trying next...`);
          continue;
        }
      }

      if (!images || images.length === 0) {
        await sock.sendMessage(from, {
          text: "❌ Could not fetch Messi images at the moment. Please try again later."
        }, { quoted: msg });
        return;
      }

      // Select random image
      const randomImage = images[Math.floor(Math.random() * images.length)];

      await sock.sendMessage(from, {
        image: { url: randomImage },
        caption: `⚽ *Lionel Messi*\n\n🏆 The GOAT\n🌟 Argentina's Legend\n🔥 8x Ballon d'Or Winner\n\n*© HORLA POOKIE Bot*`
      }, { quoted: msg });

    } catch (error) {
      console.error("Error occurred while retrieving Messi images:", error);
      await sock.sendMessage(from, {
        text: `❌ Oops, an error occurred while fetching Messi images.\n\nError: ${error.message}\n\nPlease try again later.`
      }, { quoted: msg });
    }
  }
};
