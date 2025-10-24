
import axios from 'axios';

export default {
  name: 'wc_news',
  description: 'Get FIFA World Cup news',
  category: 'Football',
  async execute(msg, { sock, args }) {
    const from = msg.key.remoteJid;
    
    try {
      await sock.sendMessage(from, {
        text: '📰 Fetching FIFA World Cup news...'
      }, { quoted: msg });

      try {
        const newsUrl = `https://newsapi.org/v2/everything?q=FIFA+World+Cup&sortBy=publishedAt&language=en&apiKey=YOUR_NEWSAPI_KEY`;
        const response = await axios.get(newsUrl, { timeout: 10000 });
        
        if (response.data.status !== "ok") {
          throw new Error("News API error");
        }

        let newsMessage = "📰 *FIFA World Cup News*\n\n";
        response.data.articles.slice(0, 5).forEach((article, index) => {
          newsMessage += `${index + 1}. ${article.title}\n🔗 ${article.url}\n\n`;
        });

        await sock.sendMessage(from, {
          text: newsMessage
        }, { quoted: msg });

      } catch (newsError) {
        // Fallback news sources
        const fallbackNews = [
          "📰 *FIFA World Cup News*\n\n",
          "• Check FIFA.com for the latest World Cup updates",
          "• Visit ESPN or BBC Sport for match reports",
          "• Follow @FIFAWorldCup on social media",
          "• Watch highlights on FIFA's official YouTube channel"
        ].join('\n');

        await sock.sendMessage(from, {
          text: fallbackNews
        }, { quoted: msg });
      }

    } catch (error) {
      console.error('World Cup news error:', error);
      await sock.sendMessage(from, {
        text: "❌ Error fetching FIFA World Cup news: " + error.message
      }, { quoted: msg });
    }
  }
};
