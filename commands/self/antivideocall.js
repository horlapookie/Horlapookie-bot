
import { updateSetting } from '../../lib/persistentData.js';

export const antivideocall = {
  nomCom: 'antivideocall',
  description: 'Toggle anti-video call rejection',
  categorie: 'Anti-Commands',
  async execute(msg, { sock, args, settings }) {
    const from = msg.key.remoteJid;

    if (!args[0] || !['on', 'off'].includes(args[0].toLowerCase())) {
      return await sock.sendMessage(from, {
        text: `❓ Usage: ${settings.prefix}antivideocall <on/off>`
      }, { quoted: msg });
    }

    const status = args[0].toLowerCase();
    const value = status === 'on';
    updateSetting('antiVideoCall', value);

    await sock.sendMessage(from, {
      text: `✅ Anti-video call ${status === 'on' ? 'enabled' : 'disabled'}`
    }, { quoted: msg });
  }
};

export default antivideocall;
