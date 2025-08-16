const botInfoText = `✨ *About Omo Toyosi Bot* ✨

Once upon a time, on *May 15th, 2025 at 12pm*, a powerful WhatsApp bot came online to bring fun, utility, and moderation magic to groups and chats.
Created as a special project by *HørläPøøkïë* in their 100LV second semester journey, this bot quickly became a faithful companion.
From answering questions, managing groups, to delivering hilarious reactions, the bot shines as a versatile helper.
Always online, always ready to assist, it grows with every command and every user interaction.
This bot is a reflection of passion, skill, and dedication packed into a seamless chat experience.
Join the adventure and see what it can do for you! 🚀`;

export default {
  name: 'ib',
  description: '✨ About the Omo Toyosi bot and its origin story',
  async execute(msg, { sock }) {
    try {
      await sock.sendMessage(msg.key.remoteJid, { text: botInfoText }, { quoted: msg });
    } catch (error) {
      console.error('Error in ib command:', error);
      await sock.sendMessage(msg.key.remoteJid, { text: '❌ Failed to load bot info.' }, { quoted: msg });
    }
  }
};
