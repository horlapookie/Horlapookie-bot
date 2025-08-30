
import axios from 'axios';

export default {
  name: 'wc_matchday',
  description: 'Get upcoming FIFA World Cup matches',
  category: 'Football',
  async execute(msg, { sock, args }) {
    const from = msg.key.remoteJid;
    
    try {
      await sock.sendMessage(from, {
        text: '📅 Fetching upcoming FIFA World Cup matches...'
      }, { quoted: msg });

      const apiKey = '7b6507c792f74a2b9db41cfc8fd8cf05';
      const apiUrl = 'https://api.football-data.org/v4/competitions';
      const matchesUrl = `${apiUrl}/WC/matches`;

      const response = await axios.get(matchesUrl, {
        headers: {
          'X-Auth-Token': apiKey,
        },
        timeout: 10000
      });

      if (!response.data || !response.data.matches) {
        return await sock.sendMessage(from, {
          text: "❌ Error fetching FIFA World Cup matchday."
        }, { quoted: msg });
      }

      const matches = response.data.matches.slice(0, 10);
      let matchdayMessage = "🗓️ *Upcoming FIFA World Cup Matches*\n\n";
      
      matches.forEach(match => {
        const date = new Date(match.utcDate).toLocaleDateString();
        matchdayMessage += `${match.homeTeam.name} vs ${match.awayTeam.name}\n📅 ${date}\n\n`;
      });

      await sock.sendMessage(from, {
        text: matchdayMessage
      }, { quoted: msg });

    } catch (error) {
      console.error('World Cup matchday error:', error);
      await sock.sendMessage(from, {
        text: "❌ Error fetching FIFA World Cup matchday: " + error.message
      }, { quoted: msg });
    }
  }
};
