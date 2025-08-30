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

export default {
  NEWSLETTER_CHANNEL,
  channelInfo
};