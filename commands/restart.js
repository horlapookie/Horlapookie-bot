import { exec } from 'child_process';

export default {
  name: 'restart',
  description: 'Restart the bot process',
  aliases: ['reboot', 'reload'],
  async execute(msg, { sock, args, isOwner, settings }) {
    const from = msg.key.remoteJid;

    // Only bot owner can restart
    if (!isOwner) {
      return await sock.sendMessage(from, {
        text: '❌ Only the bot owner can restart the bot.'
      }, { quoted: msg });
    }

    try {
      await sock.sendMessage(from, {
        text: '🔄 *Restarting Bot...*\n\n⏳ Performing graceful restart...\n\n💫 Bot will be back online in a few seconds!'
      }, { quoted: msg });

      // Give time for the message to send, then restart gracefully
      setTimeout(() => {
        console.log('[RESTART] Bot restart initiated by owner - Graceful restart');
        
        // Try PM2 restart first (more graceful)
        exec('pm2 restart index.js', (error) => {
          if (error) {
            console.log('[RESTART] PM2 not available, performing process restart...');
            // Fallback to process restart - Replit will handle the restart
            process.exit(0);
          } else {
            console.log('[RESTART] Graceful restart via PM2 completed');
          }
        });
      }, 2000);

    } catch (error) {
      console.error('[RESTART] Restart failed:', error);
      await sock.sendMessage(from, {
        text: `❌ *Restart Failed*\n\n🚫 Error: ${error.message}\n\nPlease try again or restart manually.`
      }, { quoted: msg });
    }
  }
};