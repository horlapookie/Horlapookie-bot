import axios from 'axios';

export default {
  name: 'pair',
  aliases: ['paircode', 'code', 'qr', 'session'],
  description: 'Generate pairing code for WhatsApp sessions',
  category: 'General',
  async execute(msg, { sock, args }) {
    const from = msg.key.remoteJid;
    
    try {
      if (!args || args.length === 0) {
        return await sock.sendMessage(from, {
          text: `❌ Invalid response from API.

📋 Example Usage: .code +2557525259xxx

⚠️ Here is your pair code ✅...
Wait allan is generating code,copy and paste it to the notification above or scan qr code link device`
        }, { quoted: msg });
      }

      await sock.sendMessage(from, {
        text: '*Wait allan is generating your pair code ✅...*'
      }, { quoted: msg });

      const phoneNumber = encodeURIComponent(args.join(' '));
      const apiUrl = `https://fredie-tech.onrender.com/api/ezra/code?number=${phoneNumber}`;
      
      const response = await axios.get(apiUrl);
      const data = response.data;

      if (data && data.code) {
        const pairCode = data.code;
        await sock.sendMessage(from, {
          text: `🔗 Here is your pair code: ${pairCode}

📋 Copy and paste it to the notification above or scan qr code link device`
        }, { quoted: msg });
        
        await sock.sendMessage(from, {
          text: '*Your pair code has been generated successfully! 🎉*'
        }, { quoted: msg });
      } else {
        throw new Error('Invalid response from API.');
      }
    } catch (error) {
      console.error('Error getting response from API:', error.message);
      await sock.sendMessage(from, {
        text: 'Error getting response from API.'
      }, { quoted: msg });
    }
  }
};