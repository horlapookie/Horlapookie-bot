import { NEWSLETTER_CHANNEL, NEWSLETTER_JID, NEWSLETTER_NAME, SERVER_MESSAGE_ID } from './channelConfig.js';

export const channelInfo = {
  contextInfo: {
    forwardingScore: 999,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
      newsletterJid: NEWSLETTER_JID,
      newsletterName: NEWSLETTER_NAME,
      serverMessageId: SERVER_MESSAGE_ID
    }
  }
};

// Removed duplicate export default - keeping only the one at the bottom
import { isJidGroup } from '@whiskeysockets/baileys';

/**
 * Message handler function to process incoming messages
 * @param {Object} msg - The message object
 * @param {Object} sock - The socket object
 */
export async function messageHandler(msg, sock) {
    try {
        // Basic message processing logic
        const messageType = Object.keys(msg.message || {})[0];
        
        // Skip protocol messages
        if (messageType === 'protocolMessage') {
            return;
        }

        // Handle different message types
        let body = '';
        switch (messageType) {
            case 'conversation':
                body = msg.message.conversation;
                break;
            case 'extendedTextMessage':
                body = msg.message.extendedTextMessage.text;
                break;
            case 'imageMessage':
                body = msg.message.imageMessage.caption || '';
                break;
            case 'videoMessage':
                body = msg.message.videoMessage.caption || '';
                break;
            case 'stickerMessage':
                // Handle sticker messages
                body = '';
                break;
            default:
                body = '';
        }

        // Log the processed message
        const isGroup = isJidGroup(msg.key.remoteJid);
        const senderJid = isGroup ? msg.key.participant : msg.key.remoteJid;
        
        if (body) {
            console.log(`[MESSAGE] ${isGroup ? 'GROUP' : 'DM'} - ${senderJid}: ${body}`);
        }

        return true;
    } catch (error) {
        console.error('Error in messageHandler:', error);
        return false;
    }
}

export default { 
  messageHandler,
  NEWSLETTER_CHANNEL,
  channelInfo
};
