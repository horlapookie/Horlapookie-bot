import { updateSetting } from '../../lib/persistentData.js';

export default {
  name: 'autoviewmessage',
  description: 'Toggle automatic message viewing',
  async execute(msg, { sock, args, settings }) {
    const from = msg.key.remoteJid;

    if (!args[0] || !['on', 'off'].includes(args[0].toLowerCase())) {
      return await sock.sendMessage(from, {
        text: `❓ Usage: ?autoviewmessage <on/off>`
      }, { quoted: msg });
    }

    const status = args[0].toLowerCase();
    const value = status === 'on';
    updateSetting('autoViewMessage', value);

    await sock.sendMessage(from, {
      text: `✅ Auto view messages ${status === 'on' ? 'enabled' : 'disabled'}`
    }, { quoted: msg });
  }
};