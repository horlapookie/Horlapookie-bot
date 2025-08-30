import { updateSetting } from '../../lib/persistentData.js';

export default {
  name: 'antideletemessages',
  description: 'Toggle anti-delete message detection and recovery',
  async execute(msg, { sock, args, settings }) {
    const from = msg.key.remoteJid;

    if (!args[0] || !['on', 'off'].includes(args[0].toLowerCase())) {
      return await sock.sendMessage(from, {
        text: `❓ Usage: ?antideletemessages <on/off>\n\n🛡️ When enabled, the bot will:\n• Track deleted messages in groups and DMs\n• Send notifications when messages are deleted\n• Mention the group name and user number for group deletions\n• Show DM details for private message deletions`
      }, { quoted: msg });
    }

    const status = args[0].toLowerCase();
    const value = status === 'on';
    updateSetting('antiDeleteMessages', value);

    // Store globally for the bot to use
    global.antiDeleteMessages = value;

    await sock.sendMessage(from, {
      text: `🛡️ Anti-delete messages ${status === 'on' ? '✅ enabled' : '❌ disabled'}\n\n${status === 'on' ? '📋 Bot will now track and report deleted messages in groups and DMs' : '🔇 Anti-delete monitoring has been turned off'}`
    }, { quoted: msg });
  }
};