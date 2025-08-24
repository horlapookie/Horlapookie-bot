
import axios from 'axios';

export default {
  name: 'carbon',
  aliases: ['C', 'run-carbon'],
  description: 'Generate code image using Carbon',
  async execute(msg, { sock, args }) {
    const from = msg.key.remoteJid;
    
    try {
      if (!args || args.length === 0) {
        return await sock.sendMessage(from, { 
          text: "Please provide a valid and short code to generate image." 
        }, { quoted: msg });
      }

      let code = args.join(" ");

      const response = await axios.post('https://carbonara.solopov.dev/api/cook', {
        code: code,
        backgroundColor: '#1F816D',
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status !== 200) {
        return await sock.sendMessage(from, { 
          text: 'API failed to fetch a valid response.' 
        }, { quoted: msg });
      }

      const imageBuffer = Buffer.from(response.data, 'base64');
      const caption = "> Thank you for choosing HORLA POOKIE Bot";
      
      await sock.sendMessage(from, { 
        image: imageBuffer, 
        caption: caption 
      }, { quoted: msg });
    } catch (error) {
      await sock.sendMessage(from, { 
        text: "An error occurred while processing your request.\n" + error.message 
      }, { quoted: msg });
    }
  }
};
