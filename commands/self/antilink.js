
import { horla } from '../../lib/horla.js';
import { updateSetting, getCurrentSettings } from '../../lib/persistentData.js';

export default horla({
  nomCom: "antilink",
  categorie: "Self",
  reaction: "🔗",
  description: "Configure antilink protection for groups"
}, async (msg, context) => {
  const { sock, args } = context;
  const from = msg.key.remoteJid;
  const action = args[0]?.toLowerCase();

  if (!action) {
    await sock.sendMessage(from, {
      text: "🔗 *ANTILINK SETUP*\n\n" +
            "Usage:\n" +
            "• ?antilink on - Enable antilink\n" +
            "• ?antilink off - Disable antilink\n" +
            "• ?antilink set delete|kick|warn - Set action\n" +
            "• ?antilink get - Check status"
    }, { quoted: msg });
    return;
  }

  const settings = getCurrentSettings();

  switch (action) {
    case 'on':
      if (settings.antilink?.enabled) {
        await sock.sendMessage(from, {
          text: '*_Antilink is already on_*'
        }, { quoted: msg });
        return;
      }
      updateSetting('antilink', { enabled: true, action: 'delete' });
      await sock.sendMessage(from, {
        text: '*_Antilink has been turned ON_*'
      }, { quoted: msg });
      break;

    case 'off':
      updateSetting('antilink', { enabled: false });
      await sock.sendMessage(from, {
        text: '*_Antilink has been turned OFF_*'
      }, { quoted: msg });
      break;

    case 'set':
      if (args.length < 2) {
        await sock.sendMessage(from, {
          text: '*_Please specify an action: ?antilink set delete | kick | warn_*'
        }, { quoted: msg });
        return;
      }
      const setAction = args[1];
      if (!['delete', 'kick', 'warn'].includes(setAction)) {
        await sock.sendMessage(from, {
          text: '*_Invalid action. Choose delete, kick, or warn._*'
        }, { quoted: msg });
        return;
      }
      updateSetting('antilink', { ...settings.antilink, action: setAction });
      await sock.sendMessage(from, {
        text: `*_Antilink action set to ${setAction}_*`
      }, { quoted: msg });
      break;

    case 'get':
      const status = settings.antilink?.enabled ? 'ON' : 'OFF';
      const actionConfig = settings.antilink?.action || 'Not set';
      await sock.sendMessage(from, {
        text: `*_Antilink Configuration:_*\nStatus: ${status}\nAction: ${actionConfig}`
      }, { quoted: msg });
      break;

    default:
      await sock.sendMessage(from, {
        text: '*_Use ?antilink for usage._*'
      }, { quoted: msg });
  }
});
