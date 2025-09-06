import { updateSetting } from '../../lib/persistentData.js';
import fs from 'fs';
import { horla } from '../../lib/horla.js';

// Load emojis from data file
const emojisPath = './data/emojis.json';
const emojis = JSON.parse(fs.readFileSync(emojisPath, 'utf8'));

export default horla({
  nomCom: "autoreactstatus",
  categorie: "Self",
  reaction: "❤️",
  description: "Toggle automatic status reactions"
}, async (msg, context) => {
  const { sock, args } = context;

  try {
    const from = msg.key.remoteJid;
    const userName = msg.pushName || "User";
    const action = args[0]?.toLowerCase();

    // React with processing emoji
    await sock.sendMessage(from, {
      react: { text: emojis.processing || '⏳', key: msg.key }
    });

    if (!action || !['on', 'off'].includes(action)) {
      await sock.sendMessage(from, {
        text: `◈━━━━━━━━━━━━━━━━◈\n│❒ *Auto React Status*\n│❒ Requested by: ${userName}\n│❒ Usage: ?autoreactstatus <on/off>\n│❒ • on: Auto react to all status updates\n│❒ • off: Disable auto status reactions\n◈━━━━━━━━━━━━━━━━◈`,
        react: { text: emojis.warning || '⚠️', key: msg.key }
      }, { quoted: msg });
      return;
    }

    const newState = action === 'on';
    updateSetting('autoReactStatus', newState);

    // Store the setting globally for the bot to use
    global.autoReactStatus = newState;

    await sock.sendMessage(from, {
      text: `◈━━━━━━━━━━━━━━━━◈\n│❒ *Auto React Status*\n│❒ Requested by: ${userName}\n│❒ Status: ${newState ? '✅ Enabled' : '❌ Disabled'}\n│❒ ${newState ? 'Bot will now automatically react to all status updates' : 'Auto status reactions have been disabled'}\n◈━━━━━━━━━━━━━━━━◈`,
      react: { text: emojis.success || '✔️', key: msg.key }
    }, { quoted: msg });

  } catch (error) {
    console.error('[autoreactstatus] Error:', error);
    const userName = msg.pushName || "User";
    await sock.sendMessage(from, {
      text: `◈━━━━━━━━━━━━━━━━◈\n│❒ *Auto React Status*\n│❒ Requested by: ${userName}\n│❒ Error: ${error.message}\n◈━━━━━━━━━━━━━━━━◈`,
      react: { text: emojis.error || '❌', key: msg.key }
    }, { quoted: msg });
  }
});