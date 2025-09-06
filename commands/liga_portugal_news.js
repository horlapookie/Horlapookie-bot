
import axios from 'axios';
import config from '../config.js';

export default {
  name: 'liga_portugal_news',
  description: 'Get Liga Portugal news',
  category: 'Football Live',
  async execute(msg, { sock, args }) {
    const from = msg.key.remoteJid;
    
    try {
      await sock.sendMessage(from, {
        react: { text: '📰', key: msg.key }
      });

      await sock.sendMessage(from, {
        text: '📰 Fetching Liga Portugal news...'
      }, { quoted: msg });

      // Using a free news API alternative
      const newsUrl = `https://newsapi.org/v2/everything?q=Liga+Portugal&sortBy=publishedAt&language=en&apiKey=${config.NEWSAPI_KEY || 'YOUR_NEWSAPI_KEY'}`;

      try {
        const response = await axios.get(newsUrl, { timeout: 10000 });
        
        if (response.data.status !== "ok") {
          throw new Error("News API error");
        }

        let newsMessage = "📰 *Liga Portugal News*\n\n";
        response.data.articles.slice(0, 5).forEach((article, index) => {
          newsMessage += `${index + 1}. ${article.title}\n🔗 ${article.url}\n\n`;
        });

        await sock.sendMessage(from, {
          text: newsMessage
        }, { quoted: msg });

      } catch (newsError) {
        // Fallback news sources
        const fallbackNews = [
          "📰 *Liga Portugal News*\n\n",
          "• Check Liga Portugal official website for latest updates",
          "• Visit ESPN or BBC Sport for match reports",
          "• Follow @ligaportugal on social media",
          "• Watch highlights on Liga Portugal's official YouTube channel"
        ].join('\n');

        await sock.sendMessage(from, {
          text: fallbackNews
        }, { quoted: msg });
      }

    } catch (error) {
      console.error('Error in Liga Portugal news command:', error);
      await sock.sendMessage(from, {
        text: "❌ Error fetching Liga Portugal news."
      }, { quoted: msg });
    }
  }
};
