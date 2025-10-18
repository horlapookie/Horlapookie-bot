import { updateSetting } from '../../lib/persistentData.js';

export default {
  name: 'autorecording',
  description: 'Toggle automatic recording indicator',
  async execute(msg, { sock, args, settings }) {
    const from = msg.key.remoteJid;

    if (!args[0] || !['on', 'off'].includes(args[0].toLowerCase())) {
      return await sock.sendMessage(from, {
        text: `❓ Usage: ${settings.prefix}autorecording <on/off>`
      }, { quoted: msg });
    }

    const status = args[0].toLowerCase();
    const value = status === 'on';
    updateSetting('autoRecording', value);

    await sock.sendMessage(from, {
      text: `✅ Auto recording ${status === 'on' ? 'enabled' : 'disabled'}`
    }, { quoted: msg });
  }
};