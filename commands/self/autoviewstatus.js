import { updateSetting } from '../../lib/persistentData.js';
import fs from 'fs';
import path from 'path';

// Load emojis from data file
const emojisPath = path.join(process.cwd(), 'data', 'emojis.json');
const emojis = JSON.parse(fs.readFileSync(emojisPath, 'utf8'));

export default {
  name: "autoviewstatus",
  description: "Toggle automatic status viewing",
  async execute(msg, { sock, args }) {
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
          text: `◈━━━━━━━━━━━━━━━━◈\n│❒ *Auto View Status*\n│❒ Requested by: ${userName}\n│❒ Usage: ?autoviewstatus <on/off>\n│❒ • on: Auto view all status updates\n│❒ • off: Disable auto status viewing\n◈━━━━━━━━━━━━━━━━◈`,
          react: { text: emojis.warning || '⚠️', key: msg.key }
        }, { quoted: msg });
        return;
      }

      const newState = action === 'on';
      updateSetting('autoViewStatus', newState);

      // Store the setting globally for the bot to use
      global.autoViewStatus = newState;

      await sock.sendMessage(from, {
        text: `◈━━━━━━━━━━━━━━━━◈\n│❒ *Auto View Status*\n│❒ Requested by: ${userName}\n│❒ Status: ${newState ? '✅ Enabled' : '❌ Disabled'}\n│❒ ${newState ? 'Bot will now automatically view all status updates' : 'Auto status viewing has been disabled'}\n◈━━━━━━━━━━━━━━━━◈`,
        react: { text: emojis.success || '✔️', key: msg.key }
      }, { quoted: msg });

    } catch (error) {
      console.error('[autoviewstatus] Error:', error);
      const userName = msg.pushName || "User";
      await sock.sendMessage(from, {
        text: `◈━━━━━━━━━━━━━━━━◈\n│❒ *Auto View Status*\n│❒ Requested by: ${userName}\n│❒ Error: ${error.message}\n◈━━━━━━━━━━━━━━━━◈`,
        react: { text: emojis.error || '❌', key: msg.key }
      }, { quoted: msg });
    }
  }
};