
import { updateSetting } from '../../lib/persistentData.js';

export default {
  name: 'autoreactstatus',
  description: 'Toggle automatic status reactions',
  async execute(msg, { sock, args, settings }) {
    const from = msg.key.remoteJid;
    
    if (!args[0] || !['on', 'off'].includes(args[0].toLowerCase())) {
      return await sock.sendMessage(from, {
        text: `❓ Usage: ${settings.prefix}autoreactstatus <on/off>`
      }, { quoted: msg });
    }

    const status = args[0].toLowerCase();
    const value = status === 'on';
    updateSetting('autoReactStatus', value);
    
    await sock.sendMessage(from, {
      text: `✅ Auto react to status ${status === 'on' ? 'enabled' : 'disabled'}`
    }, { quoted: msg });
  }
};
import { updateSetting } from '../../lib/persistentData.js';

export const autoreactstatus = {
  nomCom: 'autoreactstatus',
  description: 'Toggle automatic status reactions',
  categorie: 'Self',
  async execute(msg, { sock, args, settings }) {
    const from = msg.key.remoteJid;

    if (!args[0] || !['on', 'off'].includes(args[0].toLowerCase())) {
      return await sock.sendMessage(from, {
        text: `❓ Usage: ${settings.prefix}autoreactstatus <on/off>`
      }, { quoted: msg });
    }

    const status = args[0].toLowerCase();
    const value = status === 'on';
    updateSetting('autoReactStatus', value);

    await sock.sendMessage(from, {
      text: `✅ Auto react status ${status === 'on' ? 'enabled' : 'disabled'}`
    }, { quoted: msg });
  }
};

export default autoreactstatus;
