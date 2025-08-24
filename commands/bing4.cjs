
const { ezra } = require('../fredi/ezra');
const { default: axios } = require('axios');

ezra({
  nomCom: "bing4",
  aliases: ["bing", "bingimg"],
  reaction: "🌀",
  categorie: "AI"
}, async (dest, zk, commandeOptions) => {
  const { repondre, arg, ms } = commandeOptions;

  try {
    if (!arg || arg.length === 0) {
      return repondre(`Please enter the necessary information to generate the image.`);
    }

    const image = arg.join(' ');
    const response = await axios.get(`http://api.maher-zubair.tech/ai/photoleap?q=${image}`);
    
    const data = response.data;
    let caption = '*Bing images by HORLA POOKIE*';
    
    if (data.status == 200) {
      const imageUrl = data.result;
      zk.sendMessage(dest, { image: { url: imageUrl }, caption: caption }, { quoted: ms });
    } else {
      repondre("Error during image generation.");
    }
  } catch (error) {
    console.error('Error:', error.message || 'An error occurred');
    repondre("Oops, an error occurred while processing your request");
  }
});
