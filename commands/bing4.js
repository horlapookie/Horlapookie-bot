import { horla } from '../lib/horla.js';
import OpenAI from 'openai';
import config from '../config.js';

const openai = new OpenAI({
  apiKey: config.openaiApiKey,
});

export default horla({
  nomCom: "bing4",
  aliases: ["bing"],
  reaction: "🔍",
  categorie: "AI"
}, async (dest, zk, commandeOptions) => {
  const { repondre, ms, arg } = commandeOptions;

  if (!arg || arg.length === 0) {
    return repondre("Please provide a search query.");
  }

  // Check if OpenAI API key is available
  if (!config.openaiApiKey) {
    return repondre('❌ OpenAI API key is not configured. Please contact admin.');
  }

  try {
    const query = arg.join(' ');

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a helpful search assistant. Provide informative answers based on your knowledge.' },
        { role: 'user', content: `Search for: ${query}` }
      ],
    });

    const answer = response.choices[0].message.content;
    repondre(`🔍 **Search Results for "${query}":**\n\n${answer}`);

  } catch (error) {
    console.error('[bing4] OpenAI error:', error);

    let errorMessage = '❌ Sorry, something went wrong with the search. Please try again later.';

    if (error.status === 401) {
      errorMessage = '❌ Search service is not properly configured. Please contact admin.';
    } else if (error.status === 429) {
      errorMessage = '❌ Search service is busy. Please try again in a few minutes.';
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      errorMessage = '❌ Search service is currently unavailable. Please try again later.';
    }

    repondre(errorMessage);
  }
});