import axios from 'axios';

export default {
  name: 'copilot',
  description: 'Ask Copilot AI a question',
  async execute(msg, { sock, args }) {
    const dest = msg.key.remoteJid;
    const prompt = args.join(' ');

    if (!prompt) {
      return await sock.sendMessage(dest, {
        text: '❌ Please provide a prompt.\n\nExample: ?copilot Hello AI!',
      }, { quoted: msg });
    }

    try {
      // Using the same API as gpt4.js for consistency
      async function SupunAi(text) {
        const response = await axios.post("https://chatgptforpro.onrender.com/", {
          message: text,
          model: "gpt-4"
        }, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
          }
        });
        return response.data;
      }

      const result = await SupunAi(prompt);
      
      if (result && result.length > 0) {
        await sock.sendMessage(dest, {
          text: `🤖 *Copilot Response:*\n\n${result}`,
        }, { quoted: msg });
      } else {
        throw new Error('Empty response from Copilot');
      }

    } catch (error) {
      console.error('[Copilot Error]', error);
      let errorMessage = '❌ Sorry, Copilot is currently unavailable. Please try again later.';
      
      if (error.response?.status === 429) {
        errorMessage = '❌ Copilot is busy. Please try again in a few minutes.';
      } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        errorMessage = '❌ Copilot service is currently down. Please try again later.';
      } else if (error.response?.status === 400) {
        errorMessage = '❌ Invalid request. Please try with different text.';
      }
      
      await sock.sendMessage(dest, { text: errorMessage }, { quoted: msg });
    }
  }
};
