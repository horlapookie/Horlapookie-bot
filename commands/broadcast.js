
export default {
  name: 'broadcast',
  description: 'Send message to all groups the bot is in',
  aliases: ['spread'],
  category: 'Group',
  async execute(msg, { sock, args, isOwner }) {
    const from = msg.key.remoteJid;

    if (!args[0]) {
      return await sock.sendMessage(from, {
        text: "After the command *broadcast*, type your message to be sent to all groups you are in."
      }, { quoted: msg });
    }

    if (!isOwner) {
      return await sock.sendMessage(from, {
        text: "❌ You are not authorized to use this command."
      }, { quoted: msg });
    }

    try {
      const groups = await sock.groupFetchAllParticipating();
      const groupIds = Object.values(groups).map(group => group.id);

      await sock.sendMessage(from, {
        text: "*💦 HORLA POOKIE BOT 💨 is sending your message to all groups ,,,💦*..."
      }, { quoted: msg });

      const broadcastMessage = "*🌟 HORLA POOKIE BROADCAST 🌟*\n\n🀄 Message: " + args.join(" ") + "\n\n🗣️ Author: Bot Owner";

      for (let groupId of groupIds) {
        await sock.sendMessage(groupId, {
          image: { url: "https://files.catbox.moe/uxihoo.jpg" },
          caption: broadcastMessage
        });
      }

      await sock.sendMessage(from, {
        text: `✅ Broadcast sent to ${groupIds.length} groups successfully!`
      }, { quoted: msg });

    } catch (error) {
      console.error('Broadcast error:', error);
      await sock.sendMessage(from, {
        text: "❌ Error sending broadcast: " + error.message
      }, { quoted: msg });
    }
  }
};
