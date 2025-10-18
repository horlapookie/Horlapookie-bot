import { format } from 'date-fns';

const reactionInfoText = `🤖 *Reaction Commands Info*\n
You can use a variety of reaction commands to interact with others in fun ways.
Use commands like $rslap, $rkiss, $rlove, $rpunch, and many more.
Simply tag a user or reply to their message with the reaction command.
Each reaction sends a matching GIF and a message mentioning you and the target user.
Try them out to spice up your chats with fun expressive animations!`;

const botLaunchDate = (() => {
  const now = new Date();
  const dayBeforeYesterday = new Date(now);
  dayBeforeYesterday.setDate(now.getDate() - 2);
  // Format: Month day, Year at 12pm
  return format(dayBeforeYesterday, "MMMM do, yyyy 'at' 12pm");
})();

const botInfoText = `✨ *About Omo Toyosi Bot* ✨

Once upon a time, on *${botLaunchDate}*, a powerful WhatsApp bot came online to bring fun, utility, and moderation magic to groups and chats.
Created as a special project by *HørläPøøkïë* in their 100LV second semester journey, this bot quickly became a faithful companion.
From answering questions, managing groups, to delivering hilarious reactions, the bot shines as a versatile helper.
Always online, always ready to assist, it grows with every command and every user interaction.
This bot is a reflection of passion, skill, and dedication packed into a seamless chat experience.
Join the adventure and see what it can do for you! 🚀`;

export default {
  name: 'info',
  description: 'Provide information about reactions or the bot itself',
  async execute(msg, { sock, args }) {
    try {
      const input = args[0]?.toLowerCase();

      if (input === 'reactions' || input === 'reaction') {
        await sock.sendMessage(msg.key.remoteJid, { text: reactionInfoText }, { quoted: msg });
      } else if (input === 'bot' || input === 'info-bot') {
        await sock.sendMessage(msg.key.remoteJid, { text: botInfoText }, { quoted: msg });
      } else {
        await sock.sendMessage(msg.key.remoteJid, {
          text: `❓ Unknown info topic.\nUse:\n$info reactions - Info about reaction commands\n$info bot - Info about the bot`
        }, { quoted: msg });
      }
    } catch (error) {
      console.error('Error in info command:', error);
      await sock.sendMessage(msg.key.remoteJid, { text: '❌ Failed to get info.' }, { quoted: msg });
    }
  }
};
