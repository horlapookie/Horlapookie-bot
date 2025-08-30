import OpenAI from 'openai';
import config from '../config.js';

const openai = new OpenAI({
  apiKey: config.openaiApiKey
});

export default {
  name: 'translate',
  description: 'Translate text to a specified language. Usage: ?translate [language] [text]',
  async execute(msg, { sock, args }) {
    if (args.length < 2) {
      await sock.sendMessage(msg.key.remoteJid, { text: '❌ Usage: ?translate [language] [text to translate]' }, { quoted: msg });
      return;
    }

    // Check if OpenAI API key is available
    if (!config.openaiApiKey) {
      await sock.sendMessage(msg.key.remoteJid, { text: '❌ Translation service is not configured. Please contact admin.' }, { quoted: msg });
      return;
    }

    const targetLanguage = args.shift();
    const textToTranslate = args.join(' ');

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful translator.' },
          { role: 'user', content: `Translate the following text to ${targetLanguage}:\n\n${textToTranslate}` }
        ],
        max_tokens: 200,
        temperature: 0.7,
      });

      const translation = response.choices[0].message.content;

      await sock.sendMessage(msg.key.remoteJid, { text: `🌐 Translation (${targetLanguage}):\n\n${translation}` }, { quoted: msg });

    } catch (error) {
      console.error('[translate] OpenAI API error:', error);
      
      let errorMessage = '❌ Sorry, there was an error while translating. Please try again later.';
      
      if (error.status === 401) {
        errorMessage = '❌ Translation service is not properly configured. Please contact admin.';
      } else if (error.status === 429) {
        errorMessage = '❌ Translation service is busy. Please try again in a few minutes.';
      } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        errorMessage = '❌ Translation service is currently unavailable. Please try again later.';
      }
      
      await sock.sendMessage(msg.key.remoteJid, { text: errorMessage }, { quoted: msg });
    }
  }
};
