
import axios from 'axios';
import ytSearch from 'yt-search';

export default {
  name: 'song',
  alias: ['yt', 'play'],
  description: 'Search and get YouTube song info',
  category: 'Music',
  async execute(msg, { sock, args }) {
    const from = msg.key.remoteJid;
    const query = args.join(' ');

    if (!query) {
      return await sock.sendMessage(from, {
        text: '❌ Please provide a song name to search for.\n\nUsage: ?song <song name>'
      }, { quoted: msg });
    }

    try {
      await sock.sendMessage(from, {
        text: '🔍 Searching for your song...'
      }, { quoted: msg });

      const ytData = await ytSearch(query);
      const track = ytData.videos[0];

      if (!track) {
        return await sock.sendMessage(from, {
          text: '❌ No results found for your query.'
        }, { quoted: msg });
      }

      const songInfo = `🎵 *Song Found!*

📝 *Title:* ${track.title}
👤 *Channel:* ${track.author.name}
⏱️ *Duration:* ${track.duration.timestamp}
👁️ *Views:* ${track.views.toLocaleString()}
📅 *Published:* ${track.ago}
🔗 *URL:* ${track.url}

*Description:*
${track.description.substring(0, 200)}${track.description.length > 200 ? '...' : ''}`;

      await sock.sendMessage(from, {
        image: { url: track.thumbnail },
        caption: songInfo
      }, { quoted: msg });

    } catch (error) {
      console.error('Song search error:', error);
      await sock.sendMessage(from, {
        text: '❌ Error searching for song: ' + error.message
      }, { quoted: msg });
    }
  }
};
