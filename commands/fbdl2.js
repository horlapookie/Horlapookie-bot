
import { horla } from '../lib/horla.js';
import axios from 'axios';

async function getFBInfo(url) {
  try {
    const response = await axios.get(`https://api.vihangayt.com/downloader/fb?url=${encodeURIComponent(url)}`);
    return response.data.data;
  } catch (error) {
    throw new Error('Failed to fetch Facebook video info');
  }
}

export default horla({
  nomCom: "fbdl2",
  categorie: "Downloader", 
  reaction: "📽️"
}, async (msg, { sock, args }) => {
  const from = msg.key.remoteJid;

  if (!args[0]) {
    return await sock.sendMessage(from, {
      text: 'Insert a public Facebook video link!'
    }, { quoted: msg });
  }

  const queryURL = args.join(" ");

  try {
    await sock.sendMessage(from, {
      text: '📥 Downloading Facebook video (SD quality)... Please wait!'
    }, { quoted: msg });

    const result = await getFBInfo(queryURL);
    
    let caption = `
Title: ${result.title || 'Facebook Video'}
Link: ${result.url || queryURL}
    `;

    if (result.thumbnail) {
      await sock.sendMessage(from, {
        image: { url: result.thumbnail },
        caption: caption
      }, { quoted: msg });
    }

    await sock.sendMessage(from, {
      video: { url: result.sd || result.hd },
      caption: 'Facebook video downloader powered by ®HORLA POOKIE'
    }, { quoted: msg });

  } catch (error) {
    console.error('Facebook download error:', error);
    await sock.sendMessage(from, {
      text: '❌ Error occurred during download: ' + error.message
    }, { quoted: msg });
  }
});
