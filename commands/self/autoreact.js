import { updateSetting } from '../../lib/persistentData.js';

export default {
  name: 'autoreact',
  description: 'Toggle automatic message reactions',
  async execute(msg, { sock, args, settings }) {
    const from = msg.key.remoteJid;

    if (!args[0] || !['on', 'off'].includes(args[0].toLowerCase())) {
      return await sock.sendMessage(from, {
        text: `❓ Usage: ${settings.prefix}autoreact <on/off>`
      }, { quoted: msg });
    }

    const status = args[0].toLowerCase();
    const value = status === 'on';
    updateSetting('autoReact', value);

    await sock.sendMessage(from, {
      text: `✅ Auto react to messages ${status === 'on' ? 'enabled' : 'disabled'}`
    }, { quoted: msg });
  }
};