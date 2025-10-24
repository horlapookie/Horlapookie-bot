
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
  name: 'liga_portugal_table',
  description: 'Get Liga Portugal standings table',
  category: 'Football Live',
  async execute(msg, { sock, args }) {
    const from = msg.key.remoteJid;
    
    try {
      await sock.sendMessage(from, {
        react: { text: '⚽', key: msg.key }
      });

      await sock.sendMessage(from, {
        text: '📊 Fetching Liga Portugal standings...'
      }, { quoted: msg });

      const apiUrl = 'https://api.football-data.org/v4/competitions';
      const standingsUrl = `${apiUrl}/PPL/standings`;

      const data = await fetchFootballData(standingsUrl);
      if (!data || !data.standings) {
        return await sock.sendMessage(from, {
          text: "❌ Error fetching Liga Portugal standings."
        }, { quoted: msg });
      }

      const standings = data.standings[0].table;
      let standingsMessage = "📊 *Liga Portugal Table*\n\n";
      
      standings.forEach((team, index) => {
        standingsMessage += `${index + 1}. ${team.team.name} - ${team.points} Points\n`;
      });

      await sock.sendMessage(from, {
        text: standingsMessage
      }, { quoted: msg });

    } catch (error) {
      console.error('Error in Liga Portugal table command:', error);
      await sock.sendMessage(from, {
        text: "❌ Error fetching Liga Portugal table."
      }, { quoted: msg });
    }
  }
};
