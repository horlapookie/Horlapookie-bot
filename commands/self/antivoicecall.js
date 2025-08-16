
import { updateSetting } from '../../lib/persistentData.js';

export const antivoicecall = {
  nomCom: 'antivoicecall',
  description: 'Toggle anti-voice call rejection',
  categorie: 'Anti-Commands',
  async execute(msg, { sock, args, settings }) {
    const from = msg.key.remoteJid;

    if (!args[0] || !['on', 'off'].includes(args[0].toLowerCase())) {
      return await sock.sendMessage(from, {
        text: `❓ Usage: ${settings.prefix}antivoicecall <on/off>`
      }, { quoted: msg });
    }

    const status = args[0].toLowerCase();
    const value = status === 'on';
    updateSetting('antiVoiceCall', value);

    await sock.sendMessage(from, {
      text: `✅ Anti-voice call ${status === 'on' ? 'enabled' : 'disabled'}`
    }, { quoted: msg });
  }
};

export default antivoicecall;
