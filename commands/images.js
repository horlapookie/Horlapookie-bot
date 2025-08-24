
import axios from 'axios';
import { horla } from '../lib/horla.js';
import { channelInfo } from '../lib/messageConfig.js';

export default horla({
  nomCom: "images",
  aliases: ["imdb"],
  categorie: "Search",
  reaction: "🎬"
}, async (msg, { sock, args }) => {
  const from = msg.key.remoteJid;

  if (!args || args.length === 0) {
    await sock.sendMessage(from, {
      text: "Give the name of a series or film.",
      ...channelInfo
    }, { quoted: msg });
    return;
  }

  try {
    const response = await axios.get(`http://www.omdbapi.com/?apikey=742b2d09&t=${args.join(" ")}&plot=full`);
    const imdbData = response.data;

    if (imdbData.Response === "False") {
      await sock.sendMessage(from, {
        text: "❌ Movie/Series not found. Please check the title and try again.",
        ...channelInfo
      }, { quoted: msg });
      return;
    }

    let imdbInfo = "⚍⚎⚎⚎⚎⚎⚎⚎⚎⚎⚎⚎⚎⚎⚎⚍\n";
    imdbInfo += " ``` HORLA POOKIE SEARCH```\n";
    imdbInfo += "⚎⚎⚎⚎⚎⚎⚎⚎⚎⚎⚎⚎⚎⚎⚎⚎\n";
    imdbInfo += `🎬 Title: ${imdbData.Title}\n`;
    imdbInfo += `📅 Year: ${imdbData.Year}\n`;
    imdbInfo += `⭐ Rating: ${imdbData.Rated}\n`;
    imdbInfo += `📆 Released: ${imdbData.Released}\n`;
    imdbInfo += `⏳ Runtime: ${imdbData.Runtime}\n`;
    imdbInfo += `🌀 Genre: ${imdbData.Genre}\n`;
    imdbInfo += `👨🏻‍💻 Director: ${imdbData.Director}\n`;
    imdbInfo += `✍ Writers: ${imdbData.Writer}\n`;
    imdbInfo += `👨 Actors: ${imdbData.Actors}\n`;
    imdbInfo += `📃 Plot: ${imdbData.Plot}\n`;
    imdbInfo += `🌐 Language: ${imdbData.Language}\n`;
    imdbInfo += `🌍 Country: ${imdbData.Country}\n`;
    imdbInfo += `🎖️ Awards: ${imdbData.Awards}\n`;
    imdbInfo += `📦 BoxOffice: ${imdbData.BoxOffice}\n`;
    imdbInfo += `🏙️ Production: ${imdbData.Production}\n`;
    imdbInfo += `🌟 IMDB Score: ${imdbData.imdbRating}\n`;
    imdbInfo += `❎ IMDB Votes: ${imdbData.imdbVotes}`;

    await sock.sendMessage(from, {
      image: { url: imdbData.Poster },
      caption: imdbInfo,
      ...channelInfo
    }, { quoted: msg });
    
  } catch (error) {
    console.error('IMDB search error:', error);
    await sock.sendMessage(from, {
      text: "❌ An error occurred while searching IMDB.",
      ...channelInfo
    }, { quoted: msg });
  }
});
