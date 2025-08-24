
import axios from 'axios';

export default {
  name: 'spotifylist',
  aliases: ['spotifysearch', 'splaylist'],
  description: '🎬 Search for Spotify tracks',
  async execute(msg, { sock, args }) {
    const from = msg.key.remoteJid;

    if (!args.length) {
      return await sock.sendMessage(from, {
        text: '🎬 Please provide a query!\n\nExample: ?spotifylist eminem'
      }, { quoted: msg });
    }

    try {
      const query = args.join(' ');
      const searchApiUrl = `https://spotifyapi.caliphdev.com/api/search/tracks?q=${encodeURIComponent(query)}`;
      const response = await axios.get(searchApiUrl);
      const searchData = response.data;

      if (!searchData || searchData.length === 0) {
        return await sock.sendMessage(from, {
          text: "⁉️ No Spotify search results found."
        }, { quoted: msg });
      }

      let playlistMessage = `🎵 *HORLA POOKIE Bot SPOTIFY SEARCH*\n\n`;
      playlistMessage += `🔍 *Query:* ${query}\n\n`;

      searchData.forEach((track, index) => {
        const trackNumber = index + 1;
        playlistMessage += `*${trackNumber}.* ${track.title}\n`;
        playlistMessage += `*Artist:* ${track.artist || "Unknown"}\n`;
        playlistMessage += `*Album:* ${track.album || "Unknown"}\n`;
        playlistMessage += `*URL:* ${track.url}\n\n`;
        playlistMessage += `─────────────\n\n`;
      });

      await sock.sendMessage(from, {
        text: playlistMessage,
        contextInfo: {
          externalAdReply: {
            showAdAttribution: true,
            title: "HORLA POOKIE Bot SPOTIFY SEARCH",
            body: "Spotify Track Search Results",
            sourceUrl: "https://whatsapp.com/channel/0029VbAW3s15vKA6XqUqcJ0W",
            mediaType: 1,
            renderLargerThumbnail: false,
          },
        },
      }, { quoted: msg });

    } catch (error) {
      console.error('Spotify search error:', error);
      await sock.sendMessage(from, {
        text: `❌ Error searching Spotify: ${error.message}`
      }, { quoted: msg });
    }
  }
};
