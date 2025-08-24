
const { ezra } = require('../fredi/ezra');
const traduire = require("../fredi/traduction");

ezra({
  nomCom: "toxic-lover",
  aliases: ["toxic", "lover"],
  reaction: "🤷",
  categorie: "AI"
}, async (dest, zk, commandeOptions) => {
  const { repondre, ms, arg } = commandeOptions;
  
  if (!arg || !arg[0]) {
    return repondre("I'm listening to you.");
  }

  try {
    const message = await traduire(arg.join(' '), { to: 'en' });
    console.log(message);

    fetch(`http://api.brainshop.ai/get?bid=177607&key=NwzhALqeO1kubFVD&uid=[uid]&msg=${message}`)
      .then(response => response.json())
      .then(data => {
        const botResponse = data.cnt;
        console.log(botResponse);

        traduire(botResponse, { to: 'en' })
          .then(translatedResponse => {
            repondre(translatedResponse);
          })
          .catch(error => {
            console.error('Error when translating into French:', error);
            repondre('Error when translating into French');
          });
      })
      .catch(error => {
        console.error('Error requesting BrainShop:', error);
        repondre('Error requesting BrainShop');
      });

  } catch (e) {
    repondre("oops an error: " + e);
  }
});
