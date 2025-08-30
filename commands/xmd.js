
import moment from 'moment-timezone';
import config from '../config.js';
import { horla } from '../lib/horla.js';
import { channelInfo } from '../lib/messageConfig.js';

const AUDIO_URL = "";
const THUMBNAIL_URL = "";

moment.tz.setDefault('Africa/Lagos');

const getTimeAndDate = () => {
  return {
    time: moment().format("HH:mm:ss"),
    date: moment().format("DD/MM/YYYY")
  };
};

export default horla({
  nomCom: "xmd",
  aliases: ["alive", "online", "status"],
  categorie: "Bot Info",
  reaction: "✅"
}, async (msg, { sock }) => {
  const { time, date } = getTimeAndDate();
  const uptime = Math.floor(process.uptime());

  try {
    const message = {
      text: `✅ *BOT IS ONLINE!*\n🕐 Time: ${time}\n📅 Date: ${date}\n⏱️ Uptime: ${uptime}s\n\n😁 Powered by ${config.botName}`,
      ...channelInfo,
      contextInfo: {
        ...channelInfo.contextInfo,
        externalAdReply: {
          title: "HORLA POOKIE IS ALIVE ✅",
          body: "Stay connected with the bot",
          thumbnailUrl: THUMBNAIL_URL,
          sourceUrl: config.github || "https://github.com/horlapookie",
          mediaType: 1
        }
      }
    };

    if (AUDIO_URL) {
      await sock.sendMessage(msg.key.remoteJid, {
        audio: { url: AUDIO_URL },
        mimetype: "audio/mp4",
        ptt: true,
        ...message
      }, { quoted: msg });
    } else {
      await sock.sendMessage(msg.key.remoteJid, message, { quoted: msg });
    }
  } catch (e) {
    console.log("❌ Alive Command Error: " + e);
    await sock.sendMessage(msg.key.remoteJid, {
      text: "❌ Error executing alive command"
    }, { quoted: msg });
  }
});
