import { updateSetting } from '../../lib/persistentData.js';

export default {
  name: 'autotyping',
  description: 'Toggle automatic typing indicator',
  async execute(msg, { sock, args, settings }) {
    const from = msg.key.remoteJid;

    if (!args[0] || !['on', 'off'].includes(args[0].toLowerCase())) {
      return await sock.sendMessage(from, {
        text: `❓ Usage: ${settings.prefix}autotyping <on/off>`
      }, { quoted: msg });
    }

    const status = args[0].toLowerCase();
    const value = status === 'on';
    updateSetting('autoTyping', value);

    await sock.sendMessage(from, {
      text: `✅ Auto typing ${status === 'on' ? 'enabled' : 'disabled'}`
    }, { quoted: msg });
  }
};