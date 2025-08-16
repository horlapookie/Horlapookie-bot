
import { persistentData } from '../../lib/persistentData.js';

export default {
  name: "autoviewstatus",
  description: "Toggle automatic status viewing",
  category: "Self",

  async execute(msg, { sock, args }) {
    const from = msg.key.remoteJid;
    const action = args[0]?.toLowerCase();

    if (!action || !['on', 'off'].includes(action)) {
      await sock.sendMessage(from, {
        text: "📱 *Auto View Status*\n\n" +
              "Usage: ?autoviewstatus <on/off>\n" +
              "• on: Auto view all status updates\n" +
              "• off: Disable auto status viewing"
      }, { quoted: msg });
      return;
    }

    const newState = action === 'on';
    await persistentData.set('autoviewstatus', newState);

    await sock.sendMessage(from, {
      text: `📱 *Auto View Status*\n\n` +
            `Status: ${newState ? '✅ Enabled' : '❌ Disabled'}\n` +
            `${newState ? 'Bot will now automatically view all status updates' : 'Auto status viewing has been disabled'}`
    }, { quoted: msg });

    // Store the setting globally for the bot to use
    global.autoViewStatus = newState;
  }
};
