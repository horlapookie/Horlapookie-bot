import axios from 'axios';

export default {
  name: 'fap',
  description: 'Get random adult content (NSFW)',
  async execute(msg, { sock }) {
    const from = msg.key.remoteJid;

    try {
      await sock.sendMessage(from, {
        text: '🔞 Fetching NSFW content... Please wait!'
      }, { quoted: msg });

      // Simple implementation for now - can be enhanced later
      const response = await axios.get('https://api.waifu.pics/nsfw/waifu');
      
      if (response.data && response.data.url) {
        await sock.sendMessage(from, {
          image: { url: response.data.url },
          caption: '🔞 *NSFW Content*\n\n⚠️ *Warning: Adult Content* ⚠️\n\n© HORLA POOKIE Bot'
        }, { quoted: msg });
      } else {
        throw new Error('Failed to fetch content');
      }

    } catch (error) {
      console.error('[fap] Error:', error.message);
      await sock.sendMessage(from, {
        text: '❌ Failed to fetch NSFW content. Please try again later.'
      }, { quoted: msg });
    }
  }
};