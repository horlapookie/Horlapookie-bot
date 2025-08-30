import { horla } from '../lib/horla.js';
import { channelInfo } from '../lib/messageConfig.js';
import axios from 'axios';
import moment from 'moment-timezone';
import config from '../config.js';

const AUDIO_URL = "https://github.com/mp3";
const THUMBNAIL_URL = "https://efs/hea";

const emojis = {
  loading: "⏳",
  image: "🖼️",
  target: "🎯",
  globe: "🌐",
  error: "❌",
  success: "✅"
};

moment.tz.setDefault('Africa/Lagos');

const getTimeAndDate = () => {
  return {
    time: moment().format('HH:mm:ss'),
    date: moment().format('DD/MM/YYYY')
  };
};

export default horla({
  nomCom: "wallpaper2",
  categorie: "Creativity"
}, async (msg, { sock, args }) => {
  const { time, date } = getTimeAndDate();
  const keyword = args.length > 0 ? args.join(" ") : "wallpaper,nature,art,abstract";

  try {
    await sock.sendMessage(msg.key.remoteJid, {
      text: `${emojis.loading} Searching for wallpaper: ${keyword}...`
    }, { quoted: msg });

    // Try multiple wallpaper APIs
    const apis = [
      `https://api.unsplash.com/photos/random?query=${encodeURIComponent(keyword)}&orientation=portrait&client_id=YOUR_ACCESS_KEY`,
      `https://source.unsplash.com/1080x1920/?${encodeURIComponent(keyword)}`,
      `https://picsum.photos/1080/1920`,
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(keyword)}&per_page=1&orientation=portrait`
    ];

    let success = false;
    for (const api of apis) {
      try {
        let imageUrl;
        if (api.includes('unsplash.com/photos/random')) {
          // Skip Unsplash API for now due to key requirement
          continue;
        } else if (api.includes('source.unsplash.com')) {
          const res = await axios.get(api, { timeout: 10000 });
          imageUrl = res.request.res.responseUrl;
        } else if (api.includes('picsum.photos')) {
          imageUrl = api;
        } else {
          continue; // Skip Pexels for now
        }

        await sock.sendMessage(msg.key.remoteJid, {
          image: { url: imageUrl },
          caption: `${emojis.image} *Wallpaper Found!*\n\n${emojis.target} *Search:* ${keyword}\n📅 *Date:* ${date}\n⏰ *Time:* ${time}\n${emojis.globe} *Source:* Unsplash\n\n*Powered by HORLA POOKIE Bot*`
        }, { quoted: msg });

        success = true;
        break;
      } catch (apiError) {
        console.log(`Wallpaper API failed:`, apiError.message);
        continue;
      }
    }

    if (!success) {
      await sock.sendMessage(msg.key.remoteJid, {
        text: `${emojis.error} Failed to fetch wallpaper. All APIs are currently unavailable.`
      }, { quoted: msg });
    }

  } catch (e) {
    console.log("❌ Wallpaper2 Command Error: " + e);
    await sock.sendMessage(msg.key.remoteJid, {
      text: `${emojis.error} Failed to fetch wallpaper.`
    }, { quoted: msg });
  }
});