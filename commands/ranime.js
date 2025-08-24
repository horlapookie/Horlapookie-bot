
import axios from 'axios';
import { horla } from '../lib/horla.js';
import { channelInfo } from '../lib/messageConfig.js';

export default horla({
  nomCom: "ranime",
  categorie: "Fun",
  reaction: "📺"
}, async (msg, { sock }) => {
  const from = msg.key.remoteJid;
  const jsonURL = "https://api.jikan.moe/v4/random/anime";

  try {
    const response = await axios.get(jsonURL);
    const data = response.data.data;

    const title = data.title;
    const synopsis = data.synopsis;
    const imageUrl = data.images.jpg.image_url;
    const episodes = data.episodes;
    const status = data.status;

    const message = `📺 Title: ${title}\n🎬 Episodes: ${episodes}\n📡 Status: ${status}\n📝 Synopsis: ${synopsis}\n🔗 URL: ${data.url}`;

    await sock.sendMessage(from, { 
      image: { url: imageUrl }, 
      caption: message,
      ...channelInfo
    }, { quoted: msg });
    
  } catch (error) {
    console.error('Error retrieving anime data:', error);
    await sock.sendMessage(from, {
      text: '❌ Error retrieving anime data.',
      ...channelInfo
    }, { quoted: msg });
  }
});
