
import axios from 'axios';

export default {
  name: 'cl_news',
  description: 'Get UEFA Champions League news',
  category: 'Football',
  async execute(msg, { sock, args }) {
    const from = msg.key.remoteJid;
    
    try {
      await sock.sendMessage(from, {
        text: '📰 Fetching UEFA Champions League news...'
      }, { quoted: msg });

      // Using a free news API alternative
      const newsUrl = `https://newsapi.org/v2/everything?q=UEFA+Champions+League&sortBy=publishedAt&language=en&apiKey=YOUR_NEWSAPI_KEY`;

      try {
        const response = await axios.get(newsUrl, { timeout: 10000 });
        
        if (response.data.status !== "ok") {
          throw new Error("News API error");
        }

        let newsMessage = "📰 *UEFA Champions League News*\n\n";
        response.data.articles.slice(0, 5).forEach((article, index) => {
          newsMessage += `${index + 1}. ${article.title}\n🔗 ${article.url}\n\n`;
        });

        await sock.sendMessage(from, {
          text: newsMessage
        }, { quoted: msg });

      } catch (newsError) {
        // Fallback news sources
        const fallbackNews = [
          "📰 *UEFA Champions League News*\n\n",
          "• Check UEFA.com for the latest Champions League updates",
          "• Visit ESPN or BBC Sport for match reports",
          "• Follow @ChampionsLeague on social media",
          "• Watch highlights on UEFA's official YouTube channel"
        ].join('\n');

        await sock.sendMessage(from, {
          text: fallbackNews
        }, { quoted: msg });
      }

    } catch (error) {
      console.error('Champions League news error:', error);
      await sock.sendMessage(from, {
        text: "❌ Error fetching UEFA Champions League news: " + error.message
      }, { quoted: msg });
    }
  }
};
