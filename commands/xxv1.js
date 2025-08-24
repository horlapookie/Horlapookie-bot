import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

export default {
  name: 'xxv1', // changed from xxsearch
  description: 'Search Xvideos content',
  async execute(msg, { sock, args }) {
    try {
      if (!args || args.length === 0) {
        return await sock.sendMessage(msg.key.remoteJid, {
          text: '❌ Please provide a search query.\n\nExample: $xvideos-search lana rhoades'
        }, { quoted: msg });
      }

      const query = args.join(' ');
      const searchUrl = `https://www.xvideos.com/?k=${encodeURIComponent(query)}`;
      const res = await fetch(searchUrl);
      if (!res.ok) {
        return await sock.sendMessage(msg.key.remoteJid, {
          text: '❌ Failed to fetch results from Xvideos.'
        }, { quoted: msg });
      }

      const html = await res.text();  
      const $ = cheerio.load(html);  

      const results = [];  

      // Helper to fetch alternate link by visiting video page  
      async function fetchAlternateLink(videoPageUrl, originalHref) {  
        try {  
          const res = await fetch(videoPageUrl);  
          if (!res.ok) return null;  
          const html = await res.text();  
          const $ = cheerio.load(html);  

          let altLink = null;  
          const canonical = $('link[rel="canonical"]').attr('href');  
          if (canonical && canonical !== videoPageUrl) {  
            altLink = canonical;  
          }  
          if (!altLink) {  
            const ogUrl = $('meta[property="og:url"]').attr('content');  
            if (ogUrl && ogUrl !== videoPageUrl) altLink = ogUrl;  
          }  
          if (!altLink || altLink === videoPageUrl) {  
            const numMatch = originalHref.match(/^\/video(\d+)\/.+$/i);  
            if (numMatch) return null;  
            const dotMatch = originalHref.match(/^\/video\.([a-z0-9]+)\/.+$/i);  
            if (dotMatch) return null;  
          }  
          return altLink;  
        } catch {  
          return null;  
        }  
      }  

      const thumbBlocks = $('.mozaique .thumb-block').slice(0, 10);  

      for (let i = 0; i < thumbBlocks.length; i++) {  
        const el = thumbBlocks[i];  
        const title = $(el).find('p.title a').text().trim();  
        const href = $(el).find('p.title a').attr('href');  
        if (!title || !href) continue;  

        const mainLink = `https://www.xvideos.com${href}`;               
        const altLink = await fetchAlternateLink(mainLink, href);  

        let numLink = null;  
        let dotLink = null;  
        const numMatch = href.match(/^\/video(\d+)\/.+$/i);  
        const dotMatch = href.match(/^\/video\.([a-z0-9]+)\/.+$/i);  

        if (numMatch) {  
          numLink = mainLink;  
          if (altLink && altLink !== mainLink) dotLink = altLink;  
        } else if (dotMatch) {  
          dotLink = mainLink;  
          if (altLink && altLink !== mainLink) numLink = altLink;  
        } else {  
          numLink = mainLink;  
        }  

        let text = `*${i + 1}.* ${title}\n`;  
        if (numLink) text += `${numLink}\n`;  
        if (dotLink) text += `${dotLink}\n`;  
        results.push(text.trim());  
      }  

      if (results.length === 0) {  
        return await sock.sendMessage(msg.key.remoteJid, {
          text: '❌ No results found.'
        }, { quoted: msg });
      }  

      const message = `🔍 *Search Results for:* _${query}_\n\n${results.join('\n\n')}\n\n➡ Use #xxv2 to download any of these videos.`;
      await sock.sendMessage(msg.key.remoteJid, { text: message }, { quoted: msg });  

    } catch (err) {  
      console.error('[xxv1] Error:', err);  
      await sock.sendMessage(msg.key.remoteJid, {
        text: '❌ An error occurred while searching.'
      }, { quoted: msg });  
    }  
  }  
};
