
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
  name: 'liga_portugal_top_scorer',
  description: 'Get Liga Portugal top scorers',
  category: 'Football Live',
  async execute(msg, { sock, args }) {
    const from = msg.key.remoteJid;
    
    try {
      await sock.sendMessage(from, {
        react: { text: '⚽', key: msg.key }
      });

      await sock.sendMessage(from, {
        text: '🏆 Fetching Liga Portugal top scorers...'
      }, { quoted: msg });

      const apiUrl = 'https://api.football-data.org/v4/competitions';
      const topScorerUrl = `${apiUrl}/PPL/scorers`;

      const data = await fetchFootballData(topScorerUrl);
      if (!data || !data.scorers) {
        return await sock.sendMessage(from, {
          text: "❌ Error fetching Liga Portugal top scorers."
        }, { quoted: msg });
      }

      const topScorers = data.scorers.slice(0, 10);
      let topScorerMessage = "🏆 *Liga Portugal Top Scorers*\n\n";
      
      topScorers.forEach((scorer, index) => {
        topScorerMessage += `${index + 1}. ${scorer.player.name} - ${scorer.numberOfGoals} Goals\n`;
      });

      await sock.sendMessage(from, {
        text: topScorerMessage
      }, { quoted: msg });

    } catch (error) {
      console.error('Error in Liga Portugal top scorer command:', error);
      await sock.sendMessage(from, {
        text: "❌ Error fetching Liga Portugal top scorers."
      }, { quoted: msg });
    }
  }
};
