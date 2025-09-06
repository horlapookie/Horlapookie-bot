import { horla } from '../../lib/horla.js';
import { updateSetting, getCurrentSettings } from '../../lib/persistentData.js';

export default {
  name: "antilinkwarn",
  description: "Enable/disable anti-link warning (admin only)",
  category: "Self",
  async execute(msg, { sock, args, settings }) {
    const from = msg.key.remoteJid;

    if (!from.endsWith('@g.us')) {
      return await sock.sendMessage(from, {
        text: '❌ This command only works in groups.'
      }, { quoted: msg });
    }

    try {
      // Check if bot is admin
      const groupMeta = await sock.groupMetadata(from);
      const botIsAdmin = groupMeta.participants.find(p => p.id === sock.user.id && (p.admin === 'admin' || p.admin === 'superadmin'));

      if (!botIsAdmin) {
        return await sock.sendMessage(from, {
          text: '❌ Bot must be admin to use anti-link features!'
        }, { quoted: msg });
      }

      const action = args[0]?.toLowerCase();

      if (!action || !['on', 'off'].includes(action)) {
        return await sock.sendMessage(from, {
          text: `❓ Usage: ${settings.prefix}antilinkwarn <on/off>`
        }, { quoted: msg });
      }

      const currentSettings = getCurrentSettings();

      if (action === 'on') {
        currentSettings.antiLinkWarn[from] = true;
      } else {
        delete currentSettings.antiLinkWarn[from];
      }

      updateSetting('antiLinkWarn', currentSettings.antiLinkWarn);

      await sock.sendMessage(from, {
        text: `✅ Anti-link warning ${action === 'on' ? 'enabled' : 'disabled'} for this group`
      }, { quoted: msg });
    } catch (error) {
      console.error('Error in antilinkwarn command:', error);
      await sock.sendMessage(from, {
        text: '❌ An error occurred while updating the anti-link warning setting.'
      }, { quoted: msg });
    }
  }
};