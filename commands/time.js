
export default {
  name: 'time',
  description: 'Show current time',
  category: 'utility',
  async execute(msg, { sock }) {
    try {
      const now = new Date().toLocaleString('en-NG', { timeZone: 'Africa/Lagos' });
      await sock.sendMessage(msg.key.remoteJid, {
        text: `🕒 Current time is: ${now}`,
      });
    } catch (e) {
      console.error('Time command error:', e);
    }
  },
};
