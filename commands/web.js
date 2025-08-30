
import axios from 'axios';
import * as cheerio from 'cheerio';

export default {
  name: 'web',
  aliases: ['inspectweb', 'webinspect', 'webscrap'],
  description: 'Inspect and scrape web content',
  async execute(msg, { sock, args }) {
    const from = msg.key.remoteJid;

    if (!args[0]) {
      return await sock.sendMessage(from, { 
        text: 'Provide a valid web link to fetch! The bot will crawl the website and fetch its HTML, CSS, JavaScript, and any media embedded in it!' 
      }, { quoted: msg });
    }

    if (!args[0].includes('https://')) {
      return await sock.sendMessage(from, { 
        text: "That is not a valid link." 
      }, { quoted: msg });
    }

    try {
      const response = await axios.get(args[0]);
      const html = response.data;
      const $ = cheerio.load(html);

      const mediaFiles = [];
      $('img[src], video[src], audio[src]').each((i, element) => {
        let src = $(element).attr('src');
        if (src) {
          mediaFiles.push(src);
        }
      });

      const cssFiles = [];
      $('link[rel="stylesheet"]').each((i, element) => {
        let href = $(element).attr('href');
        if (href) {
          cssFiles.push(href);
        }
      });

      const jsFiles = [];
      $('script[src]').each((i, element) => {
        let src = $(element).attr('src');
        if (src) {
          jsFiles.push(src);
        }
      });

      await sock.sendMessage(from, { 
        text: `**Full HTML Content**:\n\n${html.slice(0, 4000)}${html.length > 4000 ? '...(truncated)' : ''}` 
      }, { quoted: msg });

      if (cssFiles.length > 0) {
        for (const cssFile of cssFiles.slice(0, 3)) { // Limit to 3 files
          try {
            const cssResponse = await axios.get(new URL(cssFile, args[0]));
            const cssContent = cssResponse.data;
            await sock.sendMessage(from, { 
              text: `**CSS File Content**:\n\n${cssContent.slice(0, 4000)}${cssContent.length > 4000 ? '...(truncated)' : ''}` 
            }, { quoted: msg });
          } catch (e) {
            console.error(`Failed to fetch CSS: ${cssFile}`);
          }
        }
      } else {
        await sock.sendMessage(from, { 
          text: "No external CSS files found." 
        }, { quoted: msg });
      }

      if (jsFiles.length > 0) {
        for (const jsFile of jsFiles.slice(0, 3)) { // Limit to 3 files
          try {
            const jsResponse = await axios.get(new URL(jsFile, args[0]));
            const jsContent = jsResponse.data;
            await sock.sendMessage(from, { 
              text: `**JavaScript File Content**:\n\n${jsContent.slice(0, 4000)}${jsContent.length > 4000 ? '...(truncated)' : ''}` 
            }, { quoted: msg });
          } catch (e) {
            console.error(`Failed to fetch JS: ${jsFile}`);
          }
        }
      } else {
        await sock.sendMessage(from, { 
          text: "No external JavaScript files found." 
        }, { quoted: msg });
      }

      if (mediaFiles.length > 0) {
        await sock.sendMessage(from, { 
          text: `**Media Files Found**:\n${mediaFiles.slice(0, 20).join('\n')}${mediaFiles.length > 20 ? '\n...(and more)' : ''}` 
        }, { quoted: msg });
      } else {
        await sock.sendMessage(from, { 
          text: "No media files (images, videos, audios) found." 
        }, { quoted: msg });
      }

    } catch (error) {
      console.error(error);
      return await sock.sendMessage(from, { 
        text: `An error occurred while fetching the website content: ${error.message}` 
      }, { quoted: msg });
    }
  }
};
