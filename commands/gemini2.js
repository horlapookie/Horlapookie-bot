import config from '../config.js';

export default {
  name: 'gemini2',
  description: 'Chat with Google Gemini 2.0 AI',
  category: 'AI',
  aliases: ['g2', 'gemini-2'],
  async execute(msg, { sock, args }) {
    const from = msg.key.remoteJid;
    const text = args.join(' ').trim();

    if (!text) {
      return await sock.sendMessage(from, {
        text: '🤖 *Gemini 2.0 AI*\n\nUsage: `?gemini2 <your question>`\n\nExample: `?gemini2 What is artificial intelligence?`'
      }, { quoted: msg });
    }

    try {
      // Show typing indicator
      await sock.sendPresenceUpdate('composing', from);

      const prompt = `You are Gemini 2.0, Google's advanced AI assistant. You are helpful, accurate, and provide detailed responses. Answer the following question:

${text}`;

      // Try multiple Gemini APIs
      const apis = [
        `https://api.dreaded.site/api/gemini?text=${encodeURIComponent(prompt)}`,
        `https://api.nexoracle.com/gemini?text=${encodeURIComponent(prompt)}`,
        `https://widipe.com/gemini?text=${encodeURIComponent(prompt)}`
      ];

      let response;
      for (const api of apis) {
        try {
          const res = await fetch(api);
          const data = await res.json();

          if (data.success && data.result) {
            response = data.result;
            break;
          } else if (data.response) {
            response = data.response;
            break;
          } else if (data.answer) {
            response = data.answer;
            break;
          }
        } catch (apiError) {
          console.log(`[GEMINI2] API ${api} failed:`, apiError.message);
          continue;
        }
      }

      if (!response) {
        throw new Error('All Gemini APIs failed');
      }

      await sock.sendPresenceUpdate('paused', from);

      // Format response
      const formattedResponse = `🤖 *Gemini 2.0 Response:*\n\n${response}\n\n─────────────────\n*Powered by Google Gemini 2.0*`;

      await sock.sendMessage(from, {
        text: formattedResponse
      }, { quoted: msg });

    } catch (error) {
      console.error('[GEMINI2] Error:', error.message);
      await sock.sendMessage(from, {
        text: '❌ Failed to get response from Gemini 2.0. Please try again later.'
      }, { quoted: msg });
    }
  }
};
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI('AIzaSyAkxSdt7V5rEn6rQ_UyAVMANNgYvI75H2g');

export default {
  name: 'gemini2',
  aliases: ['gem2', 'g2'],
  description: 'Advanced Gemini AI chat with enhanced responses',
  category: 'AI Commands',
  async execute(msg, { sock, args }) {
    const from = msg.key.remoteJid;
    const senderName = msg.pushName || 'User';

    if (!args || args.length === 0) {
      return await sock.sendMessage(from, {
        text: `🤖 *Gemini 2 AI*\n\nUsage: ?gemini2 <your question>\n\nExample: ?gemini2 Explain quantum physics`
      }, { quoted: msg });
    }

    try {
      await sock.sendMessage(from, {
        text: "🧠 *Gemini 2 is thinking...*"
      }, { quoted: msg });

      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = args.join(' ');

      const result = await model.generateContent(`You are Gemini 2, an advanced AI assistant created by Google. You have knowledge about the Horlapookie WhatsApp bot and its website. Be helpful, informative, and friendly. User's name is ${senderName}. Question: ${prompt}`);

      const response = result.response;
      const text = response.text();

      if (text.length > 4000) {
        // Split long responses
        const chunks = text.match(/.{1,4000}/g) || [text];
        for (let i = 0; i < chunks.length; i++) {
          await sock.sendMessage(from, {
            text: `🤖 *Gemini 2 Response ${i + 1}/${chunks.length}*\n\n${chunks[i]}`
          }, { quoted: msg });
        }
      } else {
        await sock.sendMessage(from, {
          text: `🤖 *Gemini 2 Response*\n\n${text}`
        }, { quoted: msg });
      }

    } catch (error) {
      console.error('Gemini 2 error:', error);
      await sock.sendMessage(from, {
        text: "❌ Gemini 2 encountered an error. Please try again later."
      }, { quoted: msg });
    }
  }
};