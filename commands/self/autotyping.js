
import { updateSetting } from '../../lib/persistentData.js';
import { horla } from '../../lib/horla.js';

export default horla({
  nomCom: 'autotyping',
  categorie: 'Self',
  reaction: '⌨️',
  description: 'Toggle automatic typing indicator'
}, async (msg, context) => {
  const { sock, args, settings } = context;
  const from = msg.key.remoteJid;

  if (!args[0] || !['on', 'off'].includes(args[0].toLowerCase())) {
    return await sock.sendMessage(from, {
      text: `❓ Usage: ${settings?.prefix || '?'}autotyping <on/off>`
    }, { quoted: msg });
  }

  const status = args[0].toLowerCase();
  const value = status === 'on';
  updateSetting('autoTyping', value);
  global.autoTyping = value;

  await sock.sendMessage(from, {
    text: `✅ Auto typing ${status === 'on' ? 'enabled' : 'disabled'}`
  }, { quoted: msg });
});
