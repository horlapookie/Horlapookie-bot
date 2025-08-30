
import axios from 'axios';
import config from '../config.js';

export default {
  name: 'lyrics',
  aliases: ['lyric', 'mistari'],
  description: 'Search song lyrics using multiple APIs',
  category: 'Music',
  async execute(msg, { sock, args }) {
    const from = msg.key.remoteJid;
    const text = args.join(" ").trim();

    if (!text) {
      await sock.sendMessage(from, {
        text: '❗ Please provide a song name.\nExample: ?lyrics seyi vibez happy'
      }, { quoted: msg });
      return;
    }

    try {
      await sock.sendMessage(from, {
        react: { text: '🤦', key: msg.key }
      });

      // Function to get lyrics data from APIs
      const getLyricsData = async (url) => {
        try {
          const response = await axios.get(url, { timeout: 10000 });
          return response.data;
        } catch (error) {
          console.error('Error fetching data from API:', error);
          return null;
        }
      };

      // List of APIs to try
      const apis = [
        `https://api.dreaded.site/api/lyrics?title=${encodeURIComponent(text)}`,
        `https://some-random-api.com/others/lyrics?title=${encodeURIComponent(text)}`,
        `https://api.davidcyriltech.my.id/lyrics?title=${encodeURIComponent(text)}`
      ];

      let lyricsData;
      for (const api of apis) {
        lyricsData = await getLyricsData(api);
        if (lyricsData && lyricsData.result && lyricsData.result.lyrics) break;
      }

      // Check if lyrics data was found
      if (!lyricsData || !lyricsData.result || !lyricsData.result.lyrics) {
        await sock.sendMessage(from, {
          text: `❌ Failed to retrieve lyrics for "${text}". Please try again.`
        }, { quoted: msg });
        return;
      }

      const { title, artist, thumb, lyrics } = lyricsData.result;
      const imageUrl = thumb || "https://files.catbox.moe/ac1096.jpg";

      const caption = `🎵 **Title**: ${title}\n🎤 **Artist**: ${artist}\n\n${lyrics}`;

      try {
        // Fetch the image
        const imageResponse = await axios.get(imageUrl, { 
          responseType: 'arraybuffer',
          timeout: 10000
        });
        const imageBuffer = Buffer.from(imageResponse.data, 'binary');

        // Send the message with the image and lyrics
        await sock.sendMessage(from, {
          image: imageBuffer,
          caption: caption
        }, { quoted: msg });

      } catch (error) {
        console.error('Error fetching or sending image:', error);
        // Fallback to sending just the text if image fetch fails
        await sock.sendMessage(from, {
          text: caption
        }, { quoted: msg });
      }

    } catch (error) {
      console.error('❌ Error in lyrics command:', error);
      await sock.sendMessage(from, {
        text: `❌ Error fetching lyrics. Please try again later.`
      }, { quoted: msg });
    }
  }
};
