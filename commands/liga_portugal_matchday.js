
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
  name: 'liga_portugal_matchday',
  description: 'Get upcoming Liga Portugal matches',
  category: 'Football Live',
  async execute(msg, { sock, args }) {
    const from = msg.key.remoteJid;
    
    try {
      await sock.sendMessage(from, {
        react: { text: '📅', key: msg.key }
      });

      await sock.sendMessage(from, {
        text: '🗓️ Fetching upcoming Liga Portugal matches...'
      }, { quoted: msg });

      const apiUrl = 'https://api.football-data.org/v4/competitions';
      const matchesUrl = `${apiUrl}/PPL/matches`;

      const data = await fetchFootballData(matchesUrl);
      if (!data || !data.matches) {
        return await sock.sendMessage(from, {
          text: "❌ Error fetching Liga Portugal matchday."
        }, { quoted: msg });
      }

      const matches = data.matches.slice(0, 10);
      let matchdayMessage = "🗓️ *Upcoming Liga Portugal Matches*\n\n";
      
      matches.forEach(match => {
        const date = new Date(match.utcDate).toLocaleDateString();
        matchdayMessage += `${match.homeTeam.name} vs ${match.awayTeam.name}\n📅 ${date}\n\n`;
      });

      await sock.sendMessage(from, {
        text: matchdayMessage
      }, { quoted: msg });

    } catch (error) {
      console.error('Error in Liga Portugal matchday command:', error);
      await sock.sendMessage(from, {
        text: "❌ Error fetching Liga Portugal matchday."
      }, { quoted: msg });
    }
  }
};
