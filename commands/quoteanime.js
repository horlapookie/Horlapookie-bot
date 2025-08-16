import axios from 'axios';

async function quotesAnimeScraper() {
  try {
    const response = await axios.get('https://animechan.vercel.app/api/random');
    return response.data;
  } catch (error) {
    throw error;
  }
}

export default {
  name: 'quotesAnime',
  description: '💬 Get a random anime quote',
  async execute(msg, { sock }) {
    try {
      const quote = await quotesAnimeScraper();
      const text = `💬 "${quote.quote}"\n— ${quote.character} (${quote.anime})`;
      await sock.sendMessage(msg.key.remoteJid, { text });
    } catch (error) {
      await sock.sendMessage(msg.key.remoteJid, { text: '⚠️ Error fetching anime quotes.' });
    }
  }
};
