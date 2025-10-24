
import axios from 'axios';

export default {
  name: 'cl_top_scorer',
  description: 'Get UEFA Champions League top scorers',
  category: 'Football',
  async execute(msg, { sock, args }) {
    const from = msg.key.remoteJid;
    
    try {
      await sock.sendMessage(from, {
        text: '⚽ Fetching UEFA Champions League top scorers...'
      }, { quoted: msg });

      const apiKey = '7b6507c792f74a2b9db41cfc8fd8cf05';
      const apiUrl = 'https://api.football-data.org/v4/competitions';
      const topScorerUrl = `${apiUrl}/CL/scorers`;

      const response = await axios.get(topScorerUrl, {
        headers: {
          'X-Auth-Token': apiKey,
        },
        timeout: 10000
      });

      if (!response.data || !response.data.scorers) {
        return await sock.sendMessage(from, {
          text: "❌ Error fetching UEFA Champions League top scorers."
        }, { quoted: msg });
      }

      const topScorers = response.data.scorers.slice(0, 10);
      let topScorerMessage = "🏆 *UEFA Champions League Top Scorers*\n\n";
      
      topScorers.forEach((scorer, index) => {
        topScorerMessage += `${index + 1}. ${scorer.player.name} - ${scorer.numberOfGoals} Goals\n`;
      });

      await sock.sendMessage(from, {
        text: topScorerMessage
      }, { quoted: msg });

    } catch (error) {
      console.error('Champions League top scorers error:', error);
      await sock.sendMessage(from, {
        text: "❌ Error fetching UEFA Champions League top scorers: " + error.message
      }, { quoted: msg });
    }
  }
};
