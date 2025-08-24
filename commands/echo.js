export default {
  name: "echo",
  execute: async (msg, { sock, args }) => {
    const jid = msg.key.remoteJid;
    if (!jid) throw new Error("❌ Could not determine recipient.");

    // Check if user provided args
    if (args.length) {
      const text = args.join(" ");
      const repeated = ("✨ *" + text + "* ✨\n").repeat(10);
      await sock.sendMessage(jid, { text: repeated }, { quoted: msg });
      return;
    }

    // No args, check if reply to a message
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quoted) {
      // No reply + no args => tell user to send text or reply
      await sock.sendMessage(jid, { text: "Please provide text or reply to a message to echo." }, { quoted: msg });
      return;
    }

    // If the quoted message is text
    if (quoted.conversation || quoted.extendedTextMessage) {
      // Get text from quoted message
      const quotedText = quoted.conversation || quoted.extendedTextMessage?.text || "";
      if (!quotedText) {
        await sock.sendMessage(jid, { text: "Quoted message has no text to echo." }, { quoted: msg });
        return;
      }
      const repeated = ("✨ *" + quotedText + "* ✨\n").repeat(10);
      await sock.sendMessage(jid, { text: repeated }, { quoted: msg });
      return;
    }

    // If the quoted message contains audio or voice note
    if (quoted.audioMessage || quoted.voiceMessage) {
      // Download media
      try {
        const mediaBuffer = await sock.downloadMediaMessage({ message: quoted });
        // Determine mimetype and send back the same type
        const audioMsg = quoted.audioMessage || quoted.voiceMessage;
        await sock.sendMessage(jid, {
          audio: mediaBuffer,
          mimetype: audioMsg.mimetype || "audio/mpeg",
          ptt: !!quoted.voiceMessage, // if voiceMessage, mark as ptt (push-to-talk)
        }, { quoted: msg });
      } catch (e) {
        await sock.sendMessage(jid, { text: "Failed to download audio to echo." }, { quoted: msg });
      }
      return;
    }

    // For other media types you can add handling similarly, or just notify unsupported
    await sock.sendMessage(jid, { text: "Cannot echo this type of message yet." }, { quoted: msg });
  }
};
