import { horla } from '../lib/horla.js';
import { channelInfo } from '../lib/messageConfig.js';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

// Define emojis for reactions and messages
const emojis = {
  search: '🔍',
  warning: '⚠️',
  error: '❌',
  profile: '👤',
  bio: '📝',
  number: '📞',
  personalStuff: '✨'
};

export default horla({
  nomCom: "google",
  categorie: "AI",
  reaction: emojis.search
}, async (msg, { sock, args }) => {
  const from = msg.key.remoteJid;

  if (!args || args.length === 0) {
    await sock.sendMessage(from, {
      text: "Give me a query.\n*Example: ?google What is artificial intelligence*",
      ...channelInfo
    }, { quoted: msg });
    return;
  }

  try {
    const query = args.join(" ");

    // Use a search API or scraping approach
    const searchUrl = `https://www.googleapis.com/customsearch/v1?key=YOUR_API_KEY&cx=YOUR_CX&q=${encodeURIComponent(query)}`;

    // Fallback to web scraping if API not available
    const fallbackUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&hl=en`;

    try {
      // Try DuckDuckGo instant answer API as it's free and doesn't require API key
      const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
      const ddgResponse = await fetch(ddgUrl);
      const ddgData = await ddgResponse.json();

      let result = '';

      if (ddgData.AbstractText) {
        result = `${emojis.search} *Search Results for: ${query}*\n\n📄 **Answer:**\n${ddgData.AbstractText}\n\n🔗 **Source:** ${ddgData.AbstractURL || 'DuckDuckGo'}`;
      } else if (ddgData.Answer) {
        result = `${emojis.search} *Search Results for: ${query}*\n\n📄 **Answer:**\n${ddgData.Answer}\n\n🔗 **Source:** DuckDuckGo`;
      } else {
        // Fallback to basic web scraping
        const response = await fetch(fallbackUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });

        const html = await response.text();
        const $ = cheerio.load(html);

        // Extract featured snippet or first search result with updated selectors
        let snippet = $('.hgKElc').first().text().trim() ||
                     $('.BNeawe.iBp4i.AP7Wnd').first().text().trim() ||
                     $('.BNeawe.deIvCb.AP7Wnd').first().text().trim() ||
                     $('.st').first().text().trim() ||
                     $('[data-content-feature="1"] .BNeawe').first().text().trim();

        if (snippet && snippet.length > 0) {
          result = `${emojis.search} *Search Results for: ${query}*\n\n📄 **Answer:**\n${snippet.substring(0, 500)}${snippet.length > 500 ? '...' : ''}\n\n🔗 **Source:** Google Search`;
        } else {
          // Try alternative approach with basic search
          result = `${emojis.search} *Search for: ${query}*\n\n💡 Here are some quick facts about "${query}":\n• Search URL: ${fallbackUrl}\n• Try being more specific in your search query\n• Use quotes for exact phrases\n\n🔗 Click the link above for full search results.`;
        }
      }

      // React with search emoji
      await sock.sendMessage(msg.key.remoteJid, {
        react: { text: emojis.search, key: msg.key }
      });

      await sock.sendMessage(from, {
        text: result,
        ...channelInfo
      }, { quoted: msg });

    } catch (apiError) {
      console.error('Search API error:', apiError);
      // React with search emoji even on error
      await sock.sendMessage(msg.key.remoteJid, {
        react: { text: emojis.search, key: msg.key }
      });

      const basicResult = `${emojis.search} *Search for: ${query}*\n\n🔗 Search URL: https://www.google.com/search?q=${encodeURIComponent(query)}\n\n${emojis.warning} Click the link above to view search results.`;

      await sock.sendMessage(from, {
        text: basicResult,
        ...channelInfo
      }, { quoted: msg });
    }

  } catch (error) {
    console.error('Google search error:', error);
    // React with search emoji even on general error
    await sock.sendMessage(msg.key.remoteJid, {
      react: { text: emojis.search, key: msg.key }
    });
    await sock.sendMessage(from, {
      text: `${emojis.error} An error occurred during Google search.`,
      ...channelInfo
    }, { quoted: msg });
  }
});