
import config from '../config.js';

export default {
  name: 'mode',
  description: '🔄 Check current bot mode',
  async execute(msg, { sock }) {
    const from = msg.key.remoteJid;
    
    // This is a read-only command that shows current mode
    // Mode switching is handled in bot.js with 'public' and 'self' commands
    
    await sock.sendMessage(from, {
      text: `🤖 *Bot Mode Status*\n\n📍 Current mode information is managed by the bot system.\n\n🔄 *Mode Commands:*\n• \`${config.prefix}public\` - Switch to public mode (bot owner only)\n• \`${config.prefix}self\` - Switch to self mode (bot owner only)\n\n💡 *Note:* Mode switching is only available to the connected bot account.`
    }, { quoted: msg });
  }
};
