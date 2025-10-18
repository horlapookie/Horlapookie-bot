
import isAdmin from '../lib/isAdmin.js';

export default {
  name: 'group',
  description: '🔐 Open or close group for messages',
  async execute(msg, { sock, args, settings }) {
    const from = msg.key.remoteJid;
    
    if (!msg.key.remoteJid.endsWith('@g.us')) {
      return await sock.sendMessage(from, {
        text: '❌ This is a group command only!'
      }, { quoted: msg });
    }

    try {
      const senderId = msg.key.participant || msg.key.remoteJid;
      const { isBotAdmin, isSenderAdmin } = await isAdmin(sock, from, senderId);

      if (!isBotAdmin) {
        return await sock.sendMessage(from, {
          text: '❌ Bot needs admin privileges to change group settings!'
        }, { quoted: msg });
      }

      if (!isSenderAdmin) {
        return await sock.sendMessage(from, {
          text: '❌ You are not an admin!'
        }, { quoted: msg });
      }

      if (!args[0]) {
        return await sock.sendMessage(from, {
          text: '❌ Instructions:\n\nType ?group open or ?group close'
        }, { quoted: msg });
      }

      const action = args[0].toLowerCase();

      switch (action) {
        case 'open':
          await sock.groupSettingUpdate(from, 'not_announcement');
          await sock.sendMessage(from, {
            text: '✅ Group opened! All members can now send messages.'
          }, { quoted: msg });
          break;

        case 'close':
          await sock.groupSettingUpdate(from, 'announcement');
          await sock.sendMessage(from, {
            text: '🔒 Group closed! Only admins can send messages now.'
          }, { quoted: msg });
          break;

        default:
          await sock.sendMessage(from, {
            text: '❌ Invalid option! Use "open" or "close"'
          }, { quoted: msg });
      }

    } catch (error) {
      await sock.sendMessage(from, {
        text: '❌ Error changing group settings!'
      }, { quoted: msg });
    }
  }
};
