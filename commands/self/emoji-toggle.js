export default {
  name: 'emojitoggle',
  description: 'Toggle the status emoji (❤️) display in terminal',
  category: 'Settings',
  aliases: ['statusemoji', 'toggleemoji', 'emojioff', 'emojion'],
  async execute(msg, { sock, args, settings }) {
    const from = msg.key.remoteJid;
    
    // Check if user is owner
    const senderId = msg.key.participant?.split('@')[0] || msg.key.remoteJid.split('@')[0];
    const isOwner = senderId === settings.ownerNumber || senderId === '2349122222622';
    
    if (!isOwner) {
      return await sock.sendMessage(from, {
        text: '❌ Only the bot owner can use this command.'
      }, { quoted: msg });
    }

    try {
      const { updateSetting } = await import('../../lib/persistentData.js');
      
      const currentStatus = global.autoStatusEmoji;
      let newStatus;
      
      if (args[0]) {
        const action = args[0].toLowerCase();
        if (action === 'on' || action === 'enable' || action === 'true') {
          newStatus = '❤️';
        } else if (action === 'off' || action === 'disable' || action === 'false') {
          newStatus = '';
        } else if (action.length === 1 || action.length === 2) {
          // Custom emoji
          newStatus = action;
        } else {
          return await sock.sendMessage(from, {
            text: `*🎛️ Status Emoji Toggle*\n\nUsage:\n• \`${settings.prefix}emojitoggle on\` - Enable ❤️\n• \`${settings.prefix}emojitoggle off\` - Disable emoji\n• \`${settings.prefix}emojitoggle 🌟\` - Set custom emoji\n\nCurrent: ${currentStatus || 'OFF'}`
          }, { quoted: msg });
        }
      } else {
        // Toggle between on/off
        newStatus = currentStatus ? '' : '❤️';
      }
      
      // Update the setting
      await updateSetting('autoStatusEmoji', newStatus);
      global.autoStatusEmoji = newStatus;
      
      const statusText = newStatus ? `ON (${newStatus})` : 'OFF';
      
      await sock.sendMessage(from, {
        text: `*🎛️ Status Emoji Updated*\n\n• Previous: ${currentStatus || 'OFF'}\n• Current: ${statusText}\n\n${newStatus ? '✅ Status emoji will now appear in terminal logs' : '❌ Status emoji disabled in terminal logs'}`
      }, { quoted: msg });
      
      console.log(`[SETTINGS] Status emoji changed from "${currentStatus}" to "${newStatus}" by ${senderId}`);
      
    } catch (error) {
      console.log('Emoji toggle error:', error.message);
      await sock.sendMessage(from, {
        text: '❌ Error updating emoji setting. Please try again.'
      }, { quoted: msg });
    }
  }
};