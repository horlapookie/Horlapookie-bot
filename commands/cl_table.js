
import axios from 'axios';

export default {
  name: 'cl_table',
  description: 'Get UEFA Champions League standings',
  category: 'Football',
  async execute(msg, { sock, args }) {
    const from = msg.key.remoteJid;
    
    try {
      await sock.sendMessage(from, {
        text: '⚽ Fetching UEFA Champions League standings...'
      }, { quoted: msg });

      const apiKey = '7b6507c792f74a2b9db41cfc8fd8cf05';
      const apiUrl = 'https://api.football-data.org/v4/competitions';
      const standingsUrl = `${apiUrl}/CL/standings`;

      const response = await axios.get(standingsUrl, {
        headers: {
          'X-Auth-Token': apiKey,
        },
        timeout: 10000
      });

      if (!response.data || !response.data.standings) {
        return await sock.sendMessage(from, {
          text: "❌ Error fetching UEFA Champions League standings."
        }, { quoted: msg });
      }

      const standings = response.data.standings[0].table;
      let standingsMessage = "📊 *UEFA Champions League Table*\n\n";
      
      standings.forEach((team, index) => {
        standingsMessage += `${index + 1}. ${team.team.name} - ${team.points} Points\n`;
      });

      await sock.sendMessage(from, {
        text: standingsMessage
      }, { quoted: msg });

    } catch (error) {
      console.error('Champions League table error:', error);
      await sock.sendMessage(from, {
        text: "❌ Error fetching UEFA Champions League standings: " + error.message
      }, { quoted: msg });
    }
  }
};
