// Newsletter configuration for forwarded messages
export const NEWSLETTER_JID = "120363420639943950@newsletter";
export const NEWSLETTER_NAME = "HORLA POOKIE";
export const SERVER_MESSAGE_ID = 146;

export const channelInfo = {
  contextInfo: {
    forwardingScore: 999,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
      newsletterJid: NEWSLETTER_JID, // Use NEWSLETTER_JID
      newsletterName: NEWSLETTER_NAME, // Use NEWSLETTER_NAME
      serverMessageId: SERVER_MESSAGE_ID
    }
  }
};

// Export newsletter channel constant
export const NEWSLETTER_CHANNEL = NEWSLETTER_JID;

export default {
  NEWSLETTER_CHANNEL: NEWSLETTER_JID, // Exporting JID as NEWSLETTER_CHANNEL for backward compatibility if needed
  channelInfo
};