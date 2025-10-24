import OpenAI from 'openai';
import config from '../config.js';

const openai = new OpenAI({
  apiKey: config.openaiApiKey,
});

export default {
  name: 'gpt-3',
  description: 'Ask AI a question using GPT',
  async execute(msg, { sock, args }) {
    const prompt = args.join(' ');
    if (!prompt) {
      await sock.sendMessage(msg.key.remoteJid, { text: '❓ Please provide a question or prompt.' }, { quoted: msg });
      return;
    }

    // Check if OpenAI API key is available
    if (!config.openaiApiKey) {
      await sock.sendMessage(msg.key.remoteJid, { text: '❌ OpenAI API key is not configured. Please contact admin.' }, { quoted: msg });
      return;
    }

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
      });

      const answer = response.choices[0].message.content;
      await sock.sendMessage(msg.key.remoteJid, { text: `🤖 **GPT Response:**\n\n${answer}` }, { quoted: msg });
    } catch (error) {
      console.error('[gpt-3] OpenAI error:', error);
      
      let errorMessage = '❌ Sorry, something went wrong with the AI. Please try again later.';
      
      if (error.status === 401) {
        errorMessage = '❌ AI service is not properly configured. Please contact admin.';
      } else if (error.status === 429) {
        errorMessage = '❌ AI service is busy. Please try again in a few minutes.';
      } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        errorMessage = '❌ AI service is currently unavailable. Please try again later.';
      }
      
      await sock.sendMessage(msg.key.remoteJid, { text: errorMessage }, { quoted: msg });
    }
  }
};
