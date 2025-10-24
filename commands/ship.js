
export default {
  name: 'ship',
  description: '💕 Ship two random group members together',
  aliases: ['couple'],
  async execute(msg, { sock }) {
    try {
      const chatId = msg.key.remoteJid;
      
      // Check if it's a group
      if (!chatId.endsWith('@g.us')) {
        await sock.sendMessage(chatId, { 
          text: '❌ This command can only be used in groups!' 
        }, { quoted: msg });
        return;
      }

      // Get group metadata
      const groupMetadata = await sock.groupMetadata(chatId);
      const participants = groupMetadata.participants.map(v => v.id);
      
      // Need at least 2 participants
      if (participants.length < 2) {
        await sock.sendMessage(chatId, { 
          text: '❌ Need at least 2 group members to ship!' 
        }, { quoted: msg });
        return;
      }

      // Get two random participants
      let firstUser, secondUser;
      
      // Select first random user
      firstUser = participants[Math.floor(Math.random() * participants.length)];
      
      // Select second random user (different from first)
      do {
        secondUser = participants[Math.floor(Math.random() * participants.length)];
      } while (secondUser === firstUser && participants.length > 1);

      // Format the mentions
      const formatMention = id => '@' + id.split('@')[0];

      // Create and send the ship message
      await sock.sendMessage(chatId, {
        text: `💕 *SHIP ALERT* 💕\n\n${formatMention(firstUser)} ❤️ ${formatMention(secondUser)}\n\nCongratulations! 💖🍻\n\n*Love is in the air!* 💕✨`,
        mentions: [firstUser, secondUser]
      }, { quoted: msg });

    } catch (error) {
      console.error('Error in ship command:', error);
      await sock.sendMessage(msg.key.remoteJid, { 
        text: '❌ Failed to ship! Make sure this is a group.' 
      }, { quoted: msg });
    }
  }
};
