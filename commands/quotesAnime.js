
import moment from 'moment-timezone';
import config from '../config.js';
import axios from 'axios';

async function quotesAnimeScraper() {
  try {
    console.log('[INFO] Fetching random anime quote from https://animechan.vercel.app/api/random');
    const response = await axios.get('https://animechan.vercel.app/api/random', { timeout: 5000 });
    console.log('[INFO] Quote fetched successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('[ERROR] Failed to fetch anime quote:', error.message);
    throw new Error('Failed to fetch anime quote from API.');
  }
}

export default {
  name: 'quotesanime',
  description: '💬 Get a random anime quote',
  category: 'Fun',
  aliases: ['animequote'],
  
  async execute(msg, { sock }) {
    console.log(`[INFO] Executing quotesanime command for message ID: ${msg.key.id}, from: ${msg.key.remoteJid}`);

    try {
      moment.tz.setDefault("Africa/Lagos");
      const time = moment().format('HH:mm:ss');
      const date = moment().format('DD/MM/YYYY');

      const quote = await quotesAnimeScraper();
      const text = `
💬 *Anime Quote* 💬
"${quote.quote}"
— ${quote.character} (${quote.anime})

📜 BY *${config.botName}* ⚪
*Date*: ${date} | *Time*: ${time} (WAT)

> *POWERED BY ${config.botName.toUpperCase()}*
> ©ᴘᴏᴡᴇʀᴇᴅ ʙʏ ${config.ownerName}
`;

      console.log(`[INFO] Sending anime quote to: ${msg.key.remoteJid}`);
      await sock.sendMessage(msg.key.remoteJid, {
        text,
        contextInfo: {
          externalAdReply: {
            title: `*${config.botName}* ANIME QUOTE`,
            body: "Inspire your day with words from your favorite anime!",
            thumbnailUrl: "https://i.imgur.com/animeimage.jpg",
            sourceUrl: "https://whatsapp.com/channel/0029Vb6AZrY2f3EMgD8kRQ01",
            mediaType: 1,
            renderLargerThumbnail: true
          }
        }
      }, { quoted: msg });

      console.log(`[INFO] Anime quote sent successfully to: ${msg.key.remoteJid}`);
    } catch (error) {
      console.error(`[ERROR] Failed to send anime quote to ${msg.key.remoteJid}:`, error.message);
      if (msg.key.remoteJid) {
        await sock.sendMessage(msg.key.remoteJid, {
          text: `❌ Failed to fetch anime quote. Reason: ${error.message}. Please try again later.`
        }, { quoted: msg }).catch((err) => {
          console.error('[ERROR] Failed to send error message:', err.message);
        });
      }
    }
  }
};
