import { downloadMediaMessage } from "@whiskeysockets/baileys";

export default {
  name: 'vv',
  description: 'View once message revealer',
  async execute(msg, { sock, args }) {
    // Removed owner/moderator restriction - command is now public

    try {
      const ctxInfo = msg.message?.extendedTextMessage?.contextInfo;
      const quoted = ctxInfo?.quotedMessage;

      if (!quoted) {
        return await sock.sendMessage(
          msg.key.remoteJid,
          { text: "❌ Please reply to a view-once message." },
          { quoted: msg }
        );
      }

      const mediaTypeKey = Object.keys(quoted).find((k) =>
        ["imageMessage", "videoMessage", "audioMessage", "documentMessage"].includes(k)
      );

      if (!mediaTypeKey) {
        return await sock.sendMessage(
          msg.key.remoteJid,
          { text: "❌ The replied message has no supported media." },
          { quoted: msg }
        );
      }

      const media = quoted[mediaTypeKey];
      if (!media.viewOnce) {
        return await sock.sendMessage(
          msg.key.remoteJid,
          { text: "❌ The replied message is not a view-once message." },
          { quoted: msg }
        );
      }

      const downloadMessage = {
        key: {
          remoteJid: msg.key.remoteJid,
          id: ctxInfo.stanzaId,
          fromMe: false,
          participant: ctxInfo.participant,
        },
        message: {
          [mediaTypeKey]: media,
        },
      };

      const buffer = await downloadMediaMessage(
        downloadMessage,
        "buffer",
        {},
        { logger: sock.logger, reuploadRequest: sock.updateMediaMessage }
      );

      const sendType = mediaTypeKey.replace("Message", "");

      // Resend the media with view-once bypassed
      await sock.sendMessage(
        msg.key.remoteJid,
        {
          [sendType]: buffer,
          caption: "🔓 View-once bypassed.",
        },
        { quoted: msg }
      );

      // Delete the original view-once message
      await sock.sendMessage(msg.key.remoteJid, {
        delete: {
          remoteJid: msg.key.remoteJid,
          fromMe: false,
          id: ctxInfo.stanzaId,
          participant: ctxInfo.participant,
        },
      });
    } catch (err) {
      console.error("ViewOnce command error:", err);
      await sock.sendMessage(
        msg.key.remoteJid,
        { text: `❌ Failed to bypass view-once: ${err.message}` },
        { quoted: msg }
      );
    }
  },
};