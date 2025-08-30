
import { horla } from '../lib/horla.js';
import axios from 'axios';

export default horla({
  nomCom: "igdl",
  categorie: "Downloader",
  reaction: "📸"
}, async (msg, { sock, args }) => {
  const from = msg.key.remoteJid;
  
  if (!args[0]) {
    return await sock.sendMessage(from, {
      text: 'Please insert an Instagram video link!'
    }, { quoted: msg });
  }

  const link = args.join(' ');

  try {
    await sock.sendMessage(from, {
      text: '📥 Downloading Instagram media... Please wait!'
    }, { quoted: msg });

    let igvid = await axios('https://api.vihangayt.com/downloader/ig?url=' + link);

    if (igvid.data.data.data[0].type == 'video') {
      await sock.sendMessage(from, {
        video: { url: igvid.data.data.data[0].url },
        caption: "Instagram video downloader powered by *HORLA POOKIE*",
        gifPlayback: false
      }, { quoted: msg });
    } else {
      await sock.sendMessage(from, {
        image: { url: igvid.data.data.data[0].url },
        caption: "Instagram image downloader powered by *HORLA POOKIE*"
      }, { quoted: msg });
    }

  } catch (e) {
    console.error('Instagram download error:', e);
    await sock.sendMessage(from, {
      text: "❌ Error occurred during download: " + e.message
    }, { quoted: msg });
  }
});
