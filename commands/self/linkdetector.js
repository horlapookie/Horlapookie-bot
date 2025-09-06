
import { updateSetting, getCurrentSettings } from '../../lib/persistentData.js';

export default {
  name: "linkdetector",
  description: "Advanced link detection and management",
  category: "Self",
  async execute(msg, { sock, args, settings }) {
    const from = msg.key.remoteJid;
    const action = args[0]?.toLowerCase();

    if (!action) {
      await sock.sendMessage(from, {
        text: "🕵️ *LINK DETECTOR*\n\n" +
              "Commands:\n" +
              "• ?linkdetector whatsappGroup - Detect WA group links\n" +
              "• ?linkdetector whatsappChannel - Detect WA channel links\n" +
              "• ?linkdetector telegram - Detect Telegram links\n" +
              "• ?linkdetector allLinks - Detect all links\n" +
              "• ?linkdetector off - Disable detection\n" +
              "• ?linkdetector status - Check current settings"
      }, { quoted: msg });
      return;
    }

    const currentSettings = getCurrentSettings();

    switch (action) {
      case 'whatsappgroup':
        updateSetting('linkDetector', 'whatsappGroup');
        await sock.sendMessage(from, {
          text: '🕵️ *Link Detector*\n\nWhatsApp group link protection enabled!'
        }, { quoted: msg });
        break;

      case 'whatsappchannel':
        updateSetting('linkDetector', 'whatsappChannel');
        await sock.sendMessage(from, {
          text: '🕵️ *Link Detector*\n\nWhatsApp channel link protection enabled!'
        }, { quoted: msg });
        break;

      case 'telegram':
        updateSetting('linkDetector', 'telegram');
        await sock.sendMessage(from, {
          text: '🕵️ *Link Detector*\n\nTelegram link protection enabled!'
        }, { quoted: msg });
        break;

      case 'alllinks':
        updateSetting('linkDetector', 'allLinks');
        await sock.sendMessage(from, {
          text: '🕵️ *Link Detector*\n\nAll links protection enabled!'
        }, { quoted: msg });
        break;

      case 'off':
        updateSetting('linkDetector', 'off');
        await sock.sendMessage(from, {
          text: '🕵️ *Link Detector*\n\nLink detection disabled!'
        }, { quoted: msg });
        break;

      case 'status':
        const detectorStatus = currentSettings.linkDetector || 'off';
        await sock.sendMessage(from, {
          text: `🕵️ *Link Detector Status*\n\nCurrent setting: ${detectorStatus}`
        }, { quoted: msg });
        break;

      default:
        await sock.sendMessage(from, {
          text: '❌ Invalid option. Use ?linkdetector for help.'
        }, { quoted: msg });
    }
  }
};
