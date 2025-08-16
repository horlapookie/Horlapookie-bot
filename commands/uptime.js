export default {
  name: 'uptime',
  description: 'Show how long the bot has been running',
  async execute(msg, { sock }) {
    const uptimeSeconds = process.uptime();
    const hours = Math.floor(uptimeSeconds / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const seconds = Math.floor(uptimeSeconds % 60);

    const uptimeString = `${hours}h ${minutes}m ${seconds}s`;

    await sock.sendMessage(
      msg.key.remoteJid,
      { text: `⏳ Bot uptime: ${uptimeString}` },
      { quoted: msg }
    );
  }
};
