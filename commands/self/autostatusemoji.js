
import { persistentData } from '../../lib/persistentData.js';

export default {
  name: "autostatusemoji",
  description: "Set emoji for automatic status reactions",
  category: "Self",

  async execute(msg, { sock, args }) {
    const from = msg.key.remoteJid;
    const action = args[0]?.toLowerCase();

    if (!action) {
      await sock.sendMessage(from, {
        text: "😊 *Auto Status Emoji*\n\n" +
              "Usage: ?autostatusemoji <emoji>\n" +
              "• Set an emoji to automatically react to status updates\n" +
              "• Example: ?autostatusemoji 😍"
      }, { quoted: msg });
      return;
    }

    if (action === 'off') {
      await persistentData.set('autostatusemoji', false);
      global.autoStatusEmoji = false;
      
      await sock.sendMessage(from, {
        text: `😊 *Auto Status Emoji*\n\n` +
              `Status: ❌ Disabled\n` +
              `Auto status emoji reactions have been disabled`
      }, { quoted: msg });
      return;
    }

    // Set the emoji
    const emoji = args[0];
    await persistentData.set('autostatusemoji', emoji);
    global.autoStatusEmoji = emoji;

    await sock.sendMessage(from, {
      text: `😊 *Auto Status Emoji*\n\n` +
            `Emoji: ${emoji}\n` +
            `Status: ✅ Enabled\n` +
            `Bot will now automatically react to status updates with ${emoji}`
    }, { quoted: msg });
  }
};
