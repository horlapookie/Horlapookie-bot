
export default {
  name: 'megaauth',
  description: 'Manage Mega.nz auth storage',
  aliases: ['mega', 'authstorage'],
  async execute(msg, { sock, args, isOwner, settings }) {
    if (!isOwner) {
      return await sock.sendMessage(msg.key.remoteJid, {
        text: '❌ Only bot owner can use this command.'
      }, { quoted: msg });
    }

    const megaStorage = (await import('../../lib/megaStorage.js')).default;
    const command = args[0]?.toLowerCase();

    try {
      switch (command) {
        case 'list':
          const bots = await megaStorage.listBots();
          let listText = '📁 *Mega Auth Storage - Bot List*\n\n';
          
          if (bots.length === 0) {
            listText += '• No bot auth data found in Mega storage';
          } else {
            bots.forEach((bot, index) => {
              listText += `${index + 1}. Bot ID: \`${bot.botId}\`\n`;
              listText += `   Created: ${new Date(bot.created).toLocaleString()}\n\n`;
            });
          }
          
          return await sock.sendMessage(msg.key.remoteJid, {
            text: listText
          }, { quoted: msg });

        case 'delete':
          const botId = args[1];
          if (!botId) {
            return await sock.sendMessage(msg.key.remoteJid, {
              text: '❌ Please provide bot ID to delete\n\nUsage: `megaauth delete <bot-id>`'
            }, { quoted: msg });
          }
          
          const deleted = await megaStorage.deleteAuthFiles(botId);
          
          return await sock.sendMessage(msg.key.remoteJid, {
            text: deleted 
              ? `✅ Deleted auth data for bot: ${botId}`
              : `❌ Bot ID not found: ${botId}`
          }, { quoted: msg });

        case 'status':
          await megaStorage.connect();
          const connected = megaStorage.connected;
          
          return await sock.sendMessage(msg.key.remoteJid, {
            text: `📡 *Mega Storage Status*\n\n` +
                  `Connection: ${connected ? '✅ Connected' : '❌ Disconnected'}\n` +
                  `Email: ${(await import('../../settings.js')).default.megaEmail}\n` +
                  `Current Bot: \`${global.currentBotId || 'Unknown'}\``
          }, { quoted: msg });

        case 'backup':
          const currentBotId = global.currentBotId;
          if (!currentBotId) {
            return await sock.sendMessage(msg.key.remoteJid, {
              text: '❌ No current bot session found'
            }, { quoted: msg });
          }
          
          const { createMemoryAuthState } = await import('../../lib/memoryAuth.js');
          const authState = new (await import('../../lib/memoryAuth.js')).MemoryAuthState(currentBotId);
          const saved = await authState.saveToMega();
          
          return await sock.sendMessage(msg.key.remoteJid, {
            text: saved 
              ? '✅ Current session backed up to Mega'
              : '❌ Failed to backup session'
          }, { quoted: msg });

        default:
          return await sock.sendMessage(msg.key.remoteJid, {
            text: `📁 *Mega Auth Storage Commands*\n\n` +
                  `• \`${settings.prefix}megaauth list\` - List all stored bots\n` +
                  `• \`${settings.prefix}megaauth status\` - Check connection status\n` +
                  `• \`${settings.prefix}megaauth backup\` - Backup current session\n` +
                  `• \`${settings.prefix}megaauth delete <bot-id>\` - Delete bot auth data\n\n` +
                  `💡 Auth files are automatically stored in your Mega.nz account`
          }, { quoted: msg });
      }
    } catch (error) {
      console.error('[MEGAAUTH] Command error:', error);
      await sock.sendMessage(msg.key.remoteJid, {
        text: `❌ Error: ${error.message}`
      }, { quoted: msg });
    }
  }
};
