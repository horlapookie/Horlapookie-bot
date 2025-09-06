import { updateSetting, getCurrentSettings } from '../../lib/persistentData.js';

const antilinkkick = {
  name: 'antilinkkick',
  description: 'Toggle anti-link kicking for groups',
  category: 'Anti-Commands',
  async execute(msg, { sock, args, settings }) {
    const from = msg.key.remoteJid;

    if (!from.endsWith('@g.us')) {
      return await sock.sendMessage(from, {
        text: '❌ This command can only be used in groups!'
      }, { quoted: msg });
    }

    if (!args[0] || !['on', 'off'].includes(args[0].toLowerCase())) {
      return await sock.sendMessage(from, {
        text: `❓ Usage: ${settings.prefix}antilinkkick <on/off>`
      }, { quoted: msg });
    }

    try {
      const groupMeta = await sock.groupMetadata(from);
      const botIsAdmin = groupMeta.participants.find(p => p.id === sock.user.id && p.admin);

      if (!botIsAdmin) {
        return await sock.sendMessage(from, {
          text: '❌ Bot must be admin to use anti-link features!'
        }, { quoted: msg });
      }

      const status = args[0].toLowerCase();
      const currentSettings = getCurrentSettings();

      if (status === 'on') {
        currentSettings.antiLinkKick[from] = true;
      } else {
        delete currentSettings.antiLinkKick[from];
      }

      updateSetting('antiLinkKick', currentSettings.antiLinkKick);

      await sock.sendMessage(from, {
        text: `✅ Anti-link kicking ${status === 'on' ? 'enabled' : 'disabled'} for this group`
      }, { quoted: msg });
    } catch (error) {
      await sock.sendMessage(from, {
        text: '❌ Error updating anti-link kicking setting'
      }, { quoted: msg });
    }
  }
};

export default antilinkkick;