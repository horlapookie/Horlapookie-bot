
import axios from 'axios';

export default {
  name: 'scrap',
  aliases: ['get', 'find'],
  description: 'Scrape content from URL',
  async execute(msg, { sock, args }) {
    const from = msg.key.remoteJid;
    const urlInput = args.join(" ");

    if (!/^https?:\/\//.test(urlInput)) {
      return await sock.sendMessage(from, { 
        text: "Start the *URL* with http:// or https://" 
      }, { quoted: msg });
    }

    try {
      const url = new URL(urlInput);
      const fetchUrl = `${url.origin}${url.pathname}?${url.searchParams.toString()}`;
      
      const response = await fetch(fetchUrl);

      if (!response.ok) {
        return await sock.sendMessage(from, { 
          text: `Failed to fetch the URL. Status: ${response.status} ${response.statusText}` 
        }, { quoted: msg });
      }

      const contentLength = response.headers.get('content-length');
      if (contentLength && parseInt(contentLength) > 104857600) {
        return await sock.sendMessage(from, { 
          text: `Content-Length exceeds the limit: ${contentLength}` 
        }, { quoted: msg });
      }

      const contentType = response.headers.get('content-type');
      const buffer = Buffer.from(await response.arrayBuffer());

      if (/image\/.*/.test(contentType)) {
        await sock.sendMessage(from, {
          image: { url: fetchUrl },
          caption: "> Thank you for choosing HORLA POOKIE Bot"
        }, { quoted: msg });
      } else if (/video\/.*/.test(contentType)) {
        await sock.sendMessage(from, {
          video: { url: fetchUrl },
          caption: "> Thank you for choosing HORLA POOKIE Bot"
        }, { quoted: msg });
      } else if (/text|json/.test(contentType)) {
        try {
          const json = JSON.parse(buffer);
          await sock.sendMessage(from, { 
            text: JSON.stringify(json, null, 2).slice(0, 10000) 
          }, { quoted: msg });
        } catch {
          await sock.sendMessage(from, { 
            text: buffer.toString().slice(0, 10000) 
          }, { quoted: msg });
        }
      } else {
        await sock.sendMessage(from, {
          document: { url: fetchUrl },
          caption: "> Thank you for choosing HORLA POOKIE Bot"
        }, { quoted: msg });
      }
    } catch (error) {
      console.error("Error fetching data:", error.message);
      await sock.sendMessage(from, { 
        text: `Error fetching data: ${error.message}` 
      }, { quoted: msg });
    }
  }
};
