
const { ezra } = require("../fredi/ezra");

ezra({
  nomCom: "blocklist",
  aliases: ["listblock", "blacklist", "blocked"],
  reaction: '🍂',
  categorie: "Utility Tools"
}, async (dest, zk, commandeOptions) => {
  const { repondre } = commandeOptions;

  try {
    let blocklist = await zk.fetchBlocklist();

    if (blocklist.length > 0) {
      let jackhuh = `*Blocked Contacts*\n\n`;

      await repondre(`You have blocked ${blocklist.length} contact(s), fetching and sending their details!`);

      blocklist.forEach((blockedUser) => {
        const phoneNumber = blockedUser.split('@')[0];
        jackhuh += `🚫  +${phoneNumber}\n`;
      });

      await repondre(jackhuh);
    } else {
      await repondre("There are no blocked contacts.");
    }
  } catch (e) {
    await repondre("An error occurred while accessing blocked users.\n\n" + e.message);
  }
});
