export default {
  name: "log",
  description: "Sends a clean message log with useful commands",
  async execute(msg, { sock }) {
    const remoteJid = msg?.key?.remoteJid;
    if (!remoteJid) {
      console.log("❌ remoteJid is missing in msg.key, cannot send back message.");
      return;
    }

    function get(obj, path, fallback = '') {
      return path.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : fallback), obj);
    }

    const sender = msg.key.participant || msg.key.remoteJid || 'Unknown';
    const fromMe = msg.key.fromMe ? '✅ Yes' : '❌ No';
    const messageId = msg.key.id || 'N/A';
    const timestamp = msg.messageTimestamp
      ? new Date(msg.messageTimestamp * 1000).toLocaleString()
      : 'N/A';
    const isGroup = remoteJid.endsWith('@g.us') ? '👥 Yes' : '👤 No';

    const messageType = Object.keys(msg.message || {})[0] || 'N/A';
    let content = '';

    if (messageType === 'conversation') {
      content = msg.message.conversation;
    } else if (msg.message[messageType]?.text) {
      content = msg.message[messageType].text;
    } else if (msg.message[messageType]?.caption) {
      content = msg.message[messageType].caption;
    } else {
      content = '📎 [Non-text message]';
    }

    let quotedSummary = '';
    const quoted = get(msg, 'message.extendedTextMessage.contextInfo.quotedMessage', null);
    if (quoted) {
      const qType = Object.keys(quoted)[0];
      let qContent = '';
      if (qType === 'conversation') {
        qContent = quoted.conversation;
      } else if (quoted[qType]?.text) {
        qContent = quoted[qType].text;
      } else if (quoted[qType]?.caption) {
        qContent = quoted[qType].caption;
      } else {
        qContent = '📎 [Non-text quoted message]';
      }
      quotedSummary = `\n\n📌 *Quoted Message*\n*Type:* ${qType}\n*Content:* ${qContent}`;
    }

    // Add useful commands list here
    const usefulCommands = `
📚 *Useful Commands*
• $ping - Check if bot is alive
• $help - List all commands
• $welcome on/off - Enable or disable welcome messages
• $log - Show detailed info about your message
• $xget [link] - Download from xvideos (supports quality selection)
• $yt [link or keywords] - Download YouTube videos or audio
`;

    const output = 
`📩 *Message Log*

*👤 From:* ${sender}
*🌐 RemoteJid:* ${remoteJid}
*🆔 Message ID:* ${messageId}
*⏰ Timestamp:* ${timestamp}
*👥 Is Group:* ${isGroup}
*📤 From Me:* ${fromMe}
*📄 Message Type:* ${messageType}
*✉️ Content:*
${content}${quotedSummary}

${usefulCommands}
`;

    await sock.sendMessage(remoteJid, { text: output }, { quoted: msg });
  },
};
