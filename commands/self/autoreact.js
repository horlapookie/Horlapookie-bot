
import { updateSetting } from '../../lib/persistentData.js';
import { horla } from '../../lib/horla.js';

export default horla({
  nomCom: 'autoreact',
  categorie: 'Self',
  reaction: '⚡',
  description: 'Toggle automatic message reactions'
}, async (msg, context) => {
  const { sock, args, settings } = context;
  const from = msg.key.remoteJid;

  if (!args[0] || !['on', 'off'].includes(args[0].toLowerCase())) {
    return await sock.sendMessage(from, {
      text: `❓ Usage: ${settings?.prefix || '?'}autoreact <on/off>`
    }, { quoted: msg });
  }

  const status = args[0].toLowerCase();
  const value = status === 'on';
  updateSetting('autoReact', value);
  global.autoReact = value;

  await sock.sendMessage(from, {
    text: `✅ Auto react to messages ${status === 'on' ? 'enabled' : 'disabled'}`
  }, { quoted: msg });
});
