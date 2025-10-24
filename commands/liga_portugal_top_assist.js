
import axios from 'axios';
import config from '../config.js';

// Helper function to fetch data from the API
const fetchFootballData = async (url) => {
  try {
    const response = await axios.get(url, {
      headers: {
        'X-Auth-Token': config.FOOTBALL_API_KEY,
      },
      timeout: 10000
    });
    return response.data;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export default {
  name: 'liga_portugal_top_assist',
  description: 'Get Liga Portugal top assists',
  category: 'Football Live',
  async execute(msg, { sock, args }) {
    const from = msg.key.remoteJid;
    
    try {
      await sock.sendMessage(from, {
        react: { text: '🎯', key: msg.key }
      });

      await sock.sendMessage(from, {
        text: '🎯 Fetching Liga Portugal top assists...'
      }, { quoted: msg });

      const apiUrl = 'https://api.football-data.org/v4/competitions';
      const topAssistUrl = `${apiUrl}/PPL/assists`;

      const data = await fetchFootballData(topAssistUrl);
      if (!data || !data.assists) {
        return await sock.sendMessage(from, {
          text: "❌ Error fetching Liga Portugal top assists."
        }, { quoted: msg });
      }

      const topAssists = data.assists.slice(0, 10);
      let topAssistMessage = "🎯 *Liga Portugal Top Assists*\n\n";
      
      topAssists.forEach((assist, index) => {
        topAssistMessage += `${index + 1}. ${assist.player.name} - ${assist.numberOfAssists} Assists\n`;
      });

      await sock.sendMessage(from, {
        text: topAssistMessage
      }, { quoted: msg });

    } catch (error) {
      console.error('Error in Liga Portugal top assist command:', error);
      await sock.sendMessage(from, {
        text: "❌ Error fetching Liga Portugal top assists."
      }, { quoted: msg });
    }
  }
};
