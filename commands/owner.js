import config from '../config.js';
import { channelInfo } from '../lib/channelConfig.js';

export default {
  name: 'owner',
  description: 'Get bot owner contact information',
  aliases: ['creator', 'developer', 'admin'],
  async execute(msg, { sock, args, settings }) {
    const from = msg.key.remoteJid;
    const ownerNumber = '2349122222622';
    const ownerName = settings.botOwner || config.ownerName || 'HORLAPOOKIE';
    
    try {
      // Create vCard contact
      const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${ownerName}
TEL;waid=${ownerNumber}:${ownerNumber}
END:VCARD`;

      await sock.sendMessage(from, {
        contacts: {
          displayName: ownerName,
          contacts: [{ vcard }]
        },
        ...channelInfo
      }, { quoted: msg });

    } catch (error) {
      console.error('Owner command error:', error);
      await sock.sendMessage(from, {
        text: `❌ Error sending owner contact: ${error.message}`
      }, { quoted: msg });
    }
  }
};
