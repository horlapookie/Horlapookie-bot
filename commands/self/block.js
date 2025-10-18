export default {
  name: 'block',
  description: 'Block a user (owner only)',
  category: 'Self',
  async execute(msg, { sock, args, settings }) {
    const from = msg.key.remoteJid;
    const quoted = msg.quoted || msg;

    try {
      let userToBlock;

      if (args[0]) {
        // Block by number
        userToBlock = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
      } else if (quoted && quoted.key && quoted.key.participant) {
        // Block quoted message sender
        userToBlock = quoted.key.participant;
      } else if (quoted && quoted.key && quoted.key.remoteJid && quoted.key.remoteJid.endsWith('@s.whatsapp.net')) {
        // Block quoted user in DM
        userToBlock = quoted.key.remoteJid;
      } else {
        return await sock.sendMessage(from, {
          text: '❌ Please provide a number or quote a message from the user to block.\n\nUsage: ?block <number> or quote a message'
        }, { quoted: msg });
      }

      await sock.updateBlockStatus(userToBlock, 'block');

      const blockedNumber = userToBlock.split('@')[0];
      await sock.sendMessage(from, {
        text: `✅ Successfully blocked user: +${blockedNumber}`
      }, { quoted: msg });

      console.log(`[INFO] User blocked: ${blockedNumber}`);
    } catch (error) {
      console.error(`[ERROR] Block command failed: ${error.message}`);
      await sock.sendMessage(from, {
        text: `❌ Failed to block user: ${error.message}`
      }, { quoted: msg });
    }
  }
};