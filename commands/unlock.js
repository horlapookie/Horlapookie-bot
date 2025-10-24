
import isAdmin from '../lib/isAdmin.js';

export default {
  name: 'unlock',
  description: 'Allow all members to send messages in the group',
  aliases: ['open'],
  category: 'Group',
  async execute(msg, { sock, args }) {
    const from = msg.key.remoteJid;
    const isGroup = from.endsWith('@g.us');

    if (!isGroup) {
      return await sock.sendMessage(from, {
        text: '❌ This command can only be used in groups.'
      }, { quoted: msg });
    }

    try {
      const senderId = msg.key.participant || msg.key.remoteJid;
      const { isBotAdmin, isSenderAdmin } = await isAdmin(sock, from, senderId);
      
      if (!isBotAdmin) {
        return await sock.sendMessage(from, {
          text: '❌ Bot needs admin privileges to unlock the group!'
        }, { quoted: msg });
      }

      if (!isSenderAdmin) {
        return await sock.sendMessage(from, {
          text: '❌ Only admins can unlock the group!'
        }, { quoted: msg });
      }

      // Change group settings to allow all participants to send messages
      await sock.groupSettingUpdate(from, 'not_announcement');

      await sock.sendMessage(from, {
        text: '🔓 *Group Unlocked!*\n\nAll members can now send messages in this group.'
      }, { quoted: msg });

    } catch (error) {
      console.error('Unlock group error:', error);
      await sock.sendMessage(from, {
        text: '❌ Failed to unlock group: ' + error.message
      }, { quoted: msg });
    }
  }
};
