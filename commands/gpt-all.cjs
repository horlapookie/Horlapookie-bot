
const { ezra } = require('../fredi/ezra');
const { default: axios } = require('axios');

ezra({
  nomCom: "gpt-all",
  aliases: ["gptall", "allgpt"],
  reaction: "🌀",
  categorie: "AI"
}, async (dest, zk, commandeOptions) => {
  const { repondre, arg, ms } = commandeOptions;

  try {
    if (!arg || arg.length === 0) {
      return repondre(`Please ask a question.`);
    }

    const question = arg.join(' ');
    const response = await axios.get(`https://gpt4.giftedtech.workers.dev/?prompt=${question}`);
    
    const data = response.data;
    if (data) {
      repondre(data.result);
    } else {
      repondre("Error during response generation.");
    }
  } catch (error) {
    console.error('Error:', error.message || 'An error occurred');
    repondre("Oops, an error occurred while processing your request.");
  }
});
