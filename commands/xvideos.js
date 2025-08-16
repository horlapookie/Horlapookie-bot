import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

export default {
  name: 'xvideos-search',
  description: 'Search Xvideos content',
  async execute(msg, { sock, args }) {
    try {
      if (!args || args.length === 0) {
        return await sock.sendMessage(msg.key.remoteJid, {
          text: '❌ Please provide a search query.\n\nExample: `$xvideos-search lana rhoades`'
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

          // From video page, try to get alternate link formats:

          // Check for dot style link in canonical or og:url
          let altLink = null;

          const canonical = $('link[rel="canonical"]').attr('href');
          if (canonical && canonical !== videoPageUrl) {
            altLink = canonical;
          }

          // Also check meta og:url if canonical missing
          if (!altLink) {
            const ogUrl = $('meta[property="og:url"]').attr('content');
            if (ogUrl && ogUrl !== videoPageUrl) altLink = ogUrl;
          }

          // If no alternate found or same as original, try to build opposite style
          if (!altLink || altLink === videoPageUrl) {
            // Try to generate dot style link if original is numeric
            const numMatch = originalHref.match(/^\/video(\d+)\/.+$/i);
            if (numMatch) {
              // No known way to get dot ID from numeric id, return null
              return null;
            }
            // Try to generate numeric link if original is dot style
            const dotMatch = originalHref.match(/^\/video\.([a-z0-9]+)\/.+$/i);
            if (dotMatch) {
              // No known way to get numeric id from dot id, return null
              return null;
            }
          }

          return altLink;
        } catch {
          return null;
        }
      }

      // Loop through up to 10 results
      const thumbBlocks = $('.mozaique .thumb-block').slice(0, 10);

      for (let i = 0; i < thumbBlocks.length; i++) {
        const el = thumbBlocks[i];
        const title = $(el).find('p.title a').text().trim();
        const href = $(el).find('p.title a').attr('href');
        if (!title || !href) continue;

        const mainLink = `https://www.xvideos.com${href}`;

        // We'll attempt to get the alternate link by visiting the video page
        const altLink = await fetchAlternateLink(mainLink, href);

        // Format results: numeric style first if possible
        let numLink = null;
        let dotLink = null;

        // Determine if mainLink is numeric or dot style
        const numMatch = href.match(/^\/video(\d+)\/.+$/i);
        const dotMatch = href.match(/^\/video\.([a-z0-9]+)\/.+$/i);

        if (numMatch) {
          numLink = mainLink;
          if (altLink && altLink !== mainLink) dotLink = altLink;
        } else if (dotMatch) {
          dotLink = mainLink;
          if (altLink && altLink !== mainLink) numLink = altLink;
        } else {
          // fallback if unknown format
          numLink = mainLink;
        }

        // Prepare text with both links if available
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

      const message = `🔍 *Search Results for:* _${query}_\n\n${results.join('\n\n')}`;
      await sock.sendMessage(msg.key.remoteJid, { text: message }, { quoted: msg });

    } catch (err) {
      console.error('[xvideos-search] Error:', err);
      await sock.sendMessage(msg.key.remoteJid, {
        text: '❌ An error occurred while searching.'
      }, { quoted: msg });
    }
  }
};
