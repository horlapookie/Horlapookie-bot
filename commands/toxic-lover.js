import { horla } from '../lib/horla.js';
import OpenAI from 'openai';
import config from '../config.js';

const openai = new OpenAI({
  apiKey: config.openaiApiKey,
});

export default horla({
  nomCom: "toxic-lover",
  aliases: ["toxic", "lover"],
  reaction: "💕",
  categorie: "AI"
}, async (dest, zk, commandeOptions) => {
  const { repondre, ms, arg } = commandeOptions;

  if (!arg || arg.length === 0) {
    return repondre("Please provide a question for Toxic Lover AI.");
  }

  // Check if OpenAI API key is available
  if (!config.openaiApiKey) {
    return repondre('❌ OpenAI API key is not configured. Please contact admin.');
  }

  try {
    const prompt = arg.join(' ');

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a romantic and playful AI assistant. Respond with a mix of sweet and slightly teasing personality.' },
        { role: 'user', content: prompt }
      ],
    });

    const answer = response.choices[0].message.content;
    repondre(`💕 **Toxic Lover:**\n\n${answer}`);

  } catch (error) {
    console.error('[toxic-lover] OpenAI error:', error);

    let errorMessage = '❌ Sorry, something went wrong with the AI. Please try again later.';

    if (error.status === 401) {
      errorMessage = '❌ AI service is not properly configured. Please contact admin.';
    } else if (error.status === 429) {
      errorMessage = '❌ AI service is busy. Please try again in a few minutes.';
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      errorMessage = '❌ AI service is currently unavailable. Please try again later.';
    }

    repondre(errorMessage);
  }
});