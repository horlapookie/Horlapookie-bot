
import { updateSetting } from '../../lib/persistentData.js';

export const antideletemessages = {
  nomCom: 'antideletemessages',
  description: 'Toggle anti-delete message detection',
  categorie: 'Anti-Commands',
  async execute(msg, { sock, args, settings }) {
    const from = msg.key.remoteJid;

    if (!args[0] || !['on', 'off'].includes(args[0].toLowerCase())) {
      return await sock.sendMessage(from, {
        text: `❓ Usage: ${settings.prefix}antideletemessages <on/off>`
      }, { quoted: msg });
    }

    const status = args[0].toLowerCase();
    const value = status === 'on';
    updateSetting('antiDeleteMessages', value);

    await sock.sendMessage(from, {
      text: `✅ Anti-delete messages ${status === 'on' ? 'enabled' : 'disabled'}`
    }, { quoted: msg });
  }
};

export default antideletemessages;
