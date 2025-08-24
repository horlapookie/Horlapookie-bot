
import { horla } from '../lib/horla.js';
import axios from 'axios';

export default horla({
  nomCom: "tiktoklite",
  categorie: "Downloader",
  reaction: "🎵"
}, async (msg, { sock, args, prefix }) => {
  const from = msg.key.remoteJid;

  if (!args[0]) {
    return await sock.sendMessage(from, {
      text: `How to use this command:\n${prefix}tiktoklite tiktok_video_link`
    }, { quoted: msg });
  }

  const videoUrl = args.join(" ");

  try {
    await sock.sendMessage(from, {
      text: '📥 Downloading TikTok video... Please wait!'
    }, { quoted: msg });

    let data = await axios.get('https://api.onesytex.my.id/api/tiktok-dl=' + videoUrl);
    let tik = data.data.data;

    const caption = `
Author: ${tik.author}
Description: ${tik.desc}
    `;

    await sock.sendMessage(from, {
      video: { url: tik.links[0].a },
      caption: caption
    }, { quoted: msg });

  } catch (error) {
    console.error('TikTok download error:', error);
    await sock.sendMessage(from, {
      text: '❌ Error occurred during TikTok download: ' + error.message
    }, { quoted: msg });
  }
});
