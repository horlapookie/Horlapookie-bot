import axios from 'axios';
import * as cheerio from 'cheerio';

const GENIUS_API_KEY = '0pGwtCkuTluaptHINQQP0XRv6fyUpSY5h68feuFMaJ1HMPFXdxRJFuADfdXsdmVZ';

export default {
  name: 'lyrics',
  description: 'Search song lyrics using Genius API',
  async execute(msg, { sock, args }) {
    if (!args.length) {
      await sock.sendMessage(
        msg.key.remoteJid,
        { text: '❗ Please provide artist and song title.\nExample: $lyrics seyi vibez happy' },
        { quoted: msg }
      );
      return;
    }

    try {
      const query = args.join(' ');
      const searchUrl = `https://api.genius.com/search?q=${encodeURIComponent(query)}`;

      const searchResponse = await axios.get(searchUrl, {
        headers: { Authorization: `Bearer ${GENIUS_API_KEY}` }
      });

      const hits = searchResponse.data.response.hits;
      if (!hits.length) {
        await sock.sendMessage(
          msg.key.remoteJid,
          { text: `❌ Sorry, no lyrics found for "${query}". Please check spelling or try another song.` },
          { quoted: msg }
        );
        return;
      }

      const songPath = hits[0].result.path;
      const lyricsUrl = `https://genius.com${songPath}`;

      const lyricsPage = await axios.get(lyricsUrl);
      const $ = cheerio.load(lyricsPage.data);

      // Genius stores lyrics in multiple containers with data-lyrics-container="true"
      let lyrics = '';
      $('div[data-lyrics-container="true"]').each((i, elem) => {
        lyrics += $(elem).text().trim() + '\n\n';
      });

      // Fallback if above fails
      if (!lyrics) {
        lyrics = $('.lyrics').text().trim();
      }

      if (!lyrics) {
        await sock.sendMessage(
          msg.key.remoteJid,
          { text: `❌ Couldn't parse lyrics for "${query}".` },
          { quoted: msg }
        );
        return;
      }

      const title = hits[0].result.title;
      const artist = hits[0].result.primary_artist.name;

      // Format lyrics with arrow bullets and clean lines
      const formattedLyrics =
        `🎵 *${title}* by *${artist}* 🎤\n\n` +
        lyrics
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0)
          .map(line => `➡️ ${line}`)
          .join('\n');

      // Split long messages into chunks for WhatsApp (max ~4000 chars)
      const maxChunkSize = 4000;
      for (let i = 0; i < formattedLyrics.length; i += maxChunkSize) {
        const chunk = formattedLyrics.substring(i, i + maxChunkSize);
        await sock.sendMessage(msg.key.remoteJid, { text: chunk }, { quoted: msg });
      }
    } catch (error) {
      console.error('❌ Error fetching lyrics:', error);
      await sock.sendMessage(
        msg.key.remoteJid,
        { text: `❌ Error fetching lyrics. Please try again later.` },
        { quoted: msg }
      );
    }
  }
};
