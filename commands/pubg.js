import { horla } from '../lib/horla.js';
import mumaker from 'mumaker';

const pubg = horla({
  nomCom: "pubg",
  categorie: "Logo",
  reaction: "🌈"
}, async (msg, { sock, args }) => {
  const from = msg.key.remoteJid;
  const userName = msg.pushName || "User";

  if (!args || args.length === 0) {
    await sock.sendMessage(from, {
      text: `*Example, ${userName}: * ?pubg text`
    }, { quoted: msg });
    return;
  }

  try {
    await sock.sendMessage(from, {
      text: "*Processing...*"
    }, { quoted: msg });

    const text = Array.isArray(args) ? args.join(' ') : args.toString();
    let anu = await mumaker.textpro("https://en.ephoto360.com/pubg-mascot-logo-maker-for-an-esports-team-612.html", text);

    await sock.sendMessage(from, {
      image: { url: anu.image },
      caption: "*Logo by HORLA POOKIE*"
    }, { quoted: msg });
  } catch (e) {
    await sock.sendMessage(from, {
      text: "🥵🥵 " + e.message
    }, { quoted: msg });
  }
});

export default pubg;

export default pubg;








