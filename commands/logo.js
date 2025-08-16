import { horla } from '../lib/horla.js';
import fs from 'fs';
import path from 'path';
import mumaker from 'mumaker';

// Load emojis
const emojisPath = path.join(process.cwd(), 'data', 'emojis.json');
const emojis = JSON.parse(fs.readFileSync(emojisPath, 'utf8'));

// Hacker command
export const hacker = horla({ 
  nomCom: "hacker",
  categorie: "Logo", 
  reaction: "👨🏿‍💻" 
}, async (msg, { sock, args }) => {
  const from = msg.key.remoteJid;
  const userName = msg.pushName || "User";

  if (!args || args.length === 0) {
    await sock.sendMessage(from, {
      text: `*Example, ${userName}: * ?hacker hacking`
    }, { quoted: msg });
    return;
  }

  try {
    await sock.sendMessage(from, {
      text: "*Processing...*"
    }, { quoted: msg });

    let anu = await mumaker.ephoto("https://en.ephoto360.com/create-anonymous-hacker-avatars-cyan-neon-677.html", args.join(' '));

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

// Dragonball command
export const dragonball = horla({ 
  nomCom: "dragonball", 
  categorie: "Logo", 
  reaction: "🐉" 
}, async (msg, { sock, args }) => {
  const from = msg.key.remoteJid;
  const userName = msg.pushName || "User";

  try {
    if (!args || args.length === 0) {
      await sock.sendMessage(from, {
        text: `*Example: * ?dragonball ${userName}`
      }, { quoted: msg });
      return;
    }

    await sock.sendMessage(from, { 
      text: "*Processing...*" 
    }, { quoted: msg });

    var lienMaker2 = "https://en.ephoto360.com/create-dragon-ball-style-text-effects-online-809.html";
    const imgInfo = await mumaker.ephoto(lienMaker2, args.join(' '));

    await sock.sendMessage(from, { 
      image: { url: imgInfo.image }, 
      caption: "*Logo by HORLA POOKIE*" 
    }, { quoted: msg });
  } catch (e) {
    await sock.sendMessage(from, {
      text: "🥵🥵 " + e.message
    }, { quoted: msg });
  }
});

// Naruto command
export const naruto = horla({ 
  nomCom: "naruto", 
  categorie: "Logo", 
  reaction: "⛩" 
}, async (msg, { sock, args }) => {
  const from = msg.key.remoteJid;
  const userName = msg.pushName || "User";

  try {
    if (!args || args.length === 0) {
      await sock.sendMessage(from, {
        text: `*Example: * ?naruto ${userName}`
      }, { quoted: msg });
      return;
    }

    await sock.sendMessage(from, {
      text: "*Processing...*"
    }, { quoted: msg });

    var img = await mumaker.ephoto("https://en.ephoto360.com/naruto-shippuden-logo-style-text-effect-online-808.html", args.join(' '));

    await sock.sendMessage(from, { 
      image: { url: img.image }, 
      caption: "*Logo by HORLA POOKIE*" 
    }, { quoted: msg });
  } catch (e) {
    await sock.sendMessage(from, {
      text: "🥵🥵 " + e.message
    }, { quoted: msg });
  }
});

// Didong command
export const didong = horla({ 
  nomCom: "didong", 
  categorie: "Logo", 
  reaction: "📱" 
}, async (msg, { sock, args }) => {
  const from = msg.key.remoteJid;
  const userName = msg.pushName || "User";

  try {
    if (!args || args.length === 0) {
      await sock.sendMessage(from, {
        text: `*Example:* ?didong ${userName}`
      }, { quoted: msg });
      return;
    }

    await sock.sendMessage(from, {
      text: '*Processing...*'
    }, { quoted: msg });

    var lien = "https://ephoto360.com/tao-anh-che-vui-tu-choi-cuoc-goi-voi-ten-cua-ban-930.html";
    var maker = await mumaker.ephoto(lien, args.join(' '));

    await sock.sendMessage(from, { 
      image: { url: maker.image }, 
      caption: "*Logo by HORLA POOKIE*" 
    }, { quoted: msg });
  } catch (e) {
    await sock.sendMessage(from, {
      text: "🥵🥵 " + e.message
    }, { quoted: msg });
  }
});

// Wall command
export const wall = horla({
  nomCom: "wall",
  categorie: "Logo",
  reaction: "👍"
}, async (msg, { sock, args }) => {
  const from = msg.key.remoteJid;
  const userName = msg.pushName || "User";

  if (!args || args.length === 0) {
    await sock.sendMessage(from, {
      text: `Example: ?wall ${userName}`
    }, { quoted: msg });
    return;
  }

  try {
    await sock.sendMessage(from, {
      text: "*Processing...*"
    }, { quoted: msg });

    let text = args.join(" ");
    let data = await mumaker.textpro("https://textpro.me/break-wall-text-effect-871.html", text);

    await sock.sendMessage(from, {
      image: { url: data.image },
      caption: '*Logo by HORLA POOKIE*'
    }, { quoted: msg });
  } catch (e) {
    await sock.sendMessage(from, {
      text: "🥵🥵 " + e.message
    }, { quoted: msg });
  }
});

// Summer command
export const summer = horla({
  nomCom: "summer", 
  categorie: "Logo", 
  reaction: "🌞"
}, async (msg, { sock, args }) => {
  const from = msg.key.remoteJid;
  const userName = msg.pushName || "User";

  if (!args || args.length === 0) {
    await sock.sendMessage(from, {
      text: `Example: ?summer ${userName}`
    }, { quoted: msg });
    return;
  }

  try {
    await sock.sendMessage(from, {
      text: "*Processing...*"
    }, { quoted: msg });

    const text = args.join(" ");
    let data = await mumaker.textpro("https://textpro.me/create-sunset-light-text-effects-online-for-free-1124.html", text);

    await sock.sendMessage(from, { 
      image: { url: data.image }, 
      caption: '*Logo by HORLA POOKIE*' 
    }, { quoted: msg });
  } catch (e) {
    await sock.sendMessage(from, {
      text: "🥵🥵 " + e.message
    }, { quoted: msg });
  }
});

// Neonlight command
export const neonlight = horla({
  nomCom: "neonlight", 
  categorie: "Logo", 
  reaction: "💡"
}, async (msg, { sock, args }) => {
  const from = msg.key.remoteJid;
  const userName = msg.pushName || "User";

  if (!args || args.length === 0) {
    await sock.sendMessage(from, {
      text: `Example: ?neonlight ${userName}`
    }, { quoted: msg });
    return;
  }

  try {
    await sock.sendMessage(from, {
      text: "*Processing...*"
    }, { quoted: msg });

    const text = args.join(" ");
    let maker = await mumaker.textpro("https://textpro.me/create-glowing-neon-light-text-effect-online-free-1061.html", text);

    await sock.sendMessage(from, { 
      image: { url: maker.image }, 
      caption: '*Logo by HORLA POOKIE*' 
    }, { quoted: msg });
  } catch (e) {
    await sock.sendMessage(from, {
      text: "🥵🥵 " + e.message
    }, { quoted: msg });
  }
});

// Greenneon command
export const greenneon = horla({
  nomCom: "greenneon", 
  categorie: "Logo", 
  reaction: "🟢"
}, async (msg, { sock, args }) => {
  const from = msg.key.remoteJid;
  const userName = msg.pushName || "User";

  if (!args || args.length === 0) {
    await sock.sendMessage(from, {
      text: `Example: ?greenneon ${userName}`
    }, { quoted: msg });
    return;
  }

  try {
    await sock.sendMessage(from, {
      text: "*Processing...*"
    }, { quoted: msg });

    const text = args.join(" ");
    let data = await mumaker.textpro("https://textpro.me/green-neon-text-effect-874.html", text);

    await sock.sendMessage(from, { 
      image: { url: data.image }, 
      caption: '*Logo by HORLA POOKIE*' 
    }, { quoted: msg });
  } catch (e) {
    await sock.sendMessage(from, {
      text: "🥵🥵 " + e.message
    }, { quoted: msg });
  }
});

// Glitch command
export const glitch = horla({
  nomCom: "glitch",
  categorie: "Logo",
  reaction: "🎛️"
}, async (msg, { sock, args }) => {
  const from = msg.key.remoteJid;
  const userName = msg.pushName || "User";

  try {
    if (!args || args.length === 0) {
      await sock.sendMessage(from, {
        text: `Example: ?glitch ${userName}`
      }, { quoted: msg });
      return;
    }

    await sock.sendMessage(from, {
      text: "*Processing...*"
    }, { quoted: msg });

    var lien = "https://textpro.me/create-impressive-glitch-text-effects-online-1027.html";
    var img = await mumaker.textpro(lien, args.join(' '));

    await sock.sendMessage(from, {
      image: { url: img.image },
      caption: "*Logo by HORLA POOKIE*"
    }, { quoted: msg });
  } catch (e) {
    await sock.sendMessage(from, {
      text: "🥵🥵 " + e.message
    }, { quoted: msg });
  }
});

// Devil command
export const devil = horla({
  nomCom: "devil", 
  categorie: "Logo", 
  reaction: "😈"
}, async (msg, { sock, args }) => {
  const from = msg.key.remoteJid;
  const userName = msg.pushName || "User";

  if (!args || args.length === 0) {
    await sock.sendMessage(from, {
      text: `Example: ?devil ${userName}`
    }, { quoted: msg });
    return;
  }

  try {
    await sock.sendMessage(from, {
      text: "*Processing...*"
    }, { quoted: msg });

    const text = args.join(" ");
    let data = await mumaker.textpro("https://textpro.me/create-neon-devil-wings-text-effect-online-free-1014.html", text);

    await sock.sendMessage(from, { 
      image: { url: data.image }, 
      caption: '*Logo by HORLA POOKIE*' 
    }, { quoted: msg });
  } catch (e) {
    await sock.sendMessage(from, {
      text: "🥵🥵 " + e.message
    }, { quoted: msg });
  }
});

// Boom command
export const boom = horla({
  nomCom: "boom",
  categorie: "Logo",
  reaction: "💥"
}, async (msg, { sock, args }) => {
  const from = msg.key.remoteJid;
  const userName = msg.pushName || "User";

  if (!args || args.length === 0) {
    await sock.sendMessage(from, {
      text: `Example: ?boom ${userName}`
    }, { quoted: msg });
    return;
  }

  try {
    await sock.sendMessage(from, {
      text: "*Processing...*"
    }, { quoted: msg });

    var lien = "https://en.ephoto360.com/boom-text-comic-style-text-effect-675.html";
    var img = await mumaker.ephoto(lien, args.join(' '));

    await sock.sendMessage(from, {
      image: { url: img.image },
      caption: "*Logo by HORLA POOKIE*"
    }, { quoted: msg });
  } catch (e) {
    await sock.sendMessage(from, {
      text: "🥵🥵 " + e.message
    }, { quoted: msg });
  }
});

// Water command
export const water = horla({
  nomCom: "water",
  categorie: "Logo",
  reaction: "💦"
}, async (msg, { sock, args }) => {
  const from = msg.key.remoteJid;
  const userName = msg.pushName || "User";

  if (!args || args.length === 0) {
    await sock.sendMessage(from, {
      text: `Example: ?water ${userName}`
    }, { quoted: msg });
    return;
  }

  try {
    await sock.sendMessage(from, {
      text: "*Processing...*"
    }, { quoted: msg });

    var lien = "https://en.ephoto360.com/create-water-effect-text-online-295.html";
    var img = await mumaker.ephoto(lien, args.join(' '));

    await sock.sendMessage(from, {
      image: { url: img.image },
      caption: "*Logo by HORLA POOKIE*"
    }, { quoted: msg });
  } catch (e) {
    await sock.sendMessage(from, {
      text: "🥵🥵 " + e.message
    }, { quoted: msg });
  }
});

// Snow command
export const snow = horla({
  nomCom: "snow",
  categorie: "Logo",
  reaction: "❄️"
}, async (msg, { sock, args }) => {
  const from = msg.key.remoteJid;
  const userName = msg.pushName || "User";

  try {
    if (!args || args.length === 0) {
      await sock.sendMessage(from, {
        text: `Example: ?snow ${userName}`
      }, { quoted: msg });
      return;
    }

    await sock.sendMessage(from, {
      text: "*Processing...*"
    }, { quoted: msg });

    var lien = "https://textpro.me/create-beautiful-3d-snow-text-effect-online-1101.html";
    var img = await mumaker.textpro(lien, args.join(' '));

    await sock.sendMessage(from, {
      image: { url: img.image },
      caption: "*Logo by HORLA POOKIE*"
    }, { quoted: msg });
  } catch (e) {
    await sock.sendMessage(from, {
      text: "🥵🥵 " + e.message
    }, { quoted: msg });
  }
});

// Transformer command
export const transformer = horla({ 
  nomCom: "transformer", 
  categorie: "Logo", 
  reaction: "🤖" 
}, async (msg, { sock, args }) => {
  const from = msg.key.remoteJid;
  const userName = msg.pushName || "User";

  if (!args || args.length === 0) {
    await sock.sendMessage(from, {
      text: `Example: ?transformer ${userName}`
    }, { quoted: msg });
    return;
  }

  try {
    await sock.sendMessage(from, {
      text: "*Processing...*"
    }, { quoted: msg });

    const text = args.join(" ");
    let data = await mumaker.textpro("https://textpro.me/create-a-transformer-text-effect-online-1035.html", text);

    await sock.sendMessage(from, { 
      image: { url: data.image }, 
      caption: '*Logo by HORLA POOKIE*' 
    }, { quoted: msg });
  } catch (e) {
    await sock.sendMessage(from, {
      text: "🥵🥵 " + e.message
    }, { quoted: msg });
  }
});

// Thunder command
export const thunder = horla({
  nomCom: "thunder",
  categorie: "Logo",
  reaction: "⚡"
}, async (msg, { sock, args }) => {
  const from = msg.key.remoteJid;
  const userName = msg.pushName || "User";

  try {
    if (!args || args.length === 0) {
      await sock.sendMessage(from, {
        text: `Example: ?thunder ${userName}`
      }, { quoted: msg });
      return;
    }

    await sock.sendMessage(from, {
      text: "*Processing...*"
    }, { quoted: msg });

    var lien = "https://textpro.me/online-thunder-text-effect-generator-1031.html";
    var img = await mumaker.textpro(lien, args.join(' '));

    await sock.sendMessage(from, {
      image: { url: img.image },
      caption: "*Logo by HORLA POOKIE*"
    }, { quoted: msg });
  } catch (e) {
    await sock.sendMessage(from, {
      text: "🥵🥵 " + e.message
    }, { quoted: msg });
  }
});

// Harrypotter command
export const harrypotter = horla({ 
  nomCom: "harrypotter", 
  categorie: "Logo", 
  reaction: "🧙‍♂️" 
}, async (msg, { sock, args }) => {
  const from = msg.key.remoteJid;
  const userName = msg.pushName || "User";

  if (!args || args.length === 0) {
    await sock.sendMessage(from, {
      text: `Example: ?harrypotter ${userName}`
    }, { quoted: msg });
    return;
  }

  try {
    await sock.sendMessage(from, {
      text: "*Processing...*"
    }, { quoted: msg });

    const text = args.join(" ");
    let data = await mumaker.textpro("https://textpro.me/create-harry-potter-text-effect-online-1025.html", text);

    await sock.sendMessage(from, { 
      image: { url: data.image }, 
      caption: '*Logo by HORLA POOKIE*' 
    }, { quoted: msg });
  } catch (e) {
    await sock.sendMessage(from, {
      text: "🥵🥵 " + e.message
    }, { quoted: msg });
  }
});

// Foggyglass command
export const foggyglass = horla({ 
  nomCom: "foggyglass", 
  categorie: "Logo", 
  reaction: "🪟" 
}, async (msg, { sock, args }) => {
  const from = msg.key.remoteJid;
  const userName = msg.pushName || "User";

  if (!args || args.length === 0) {
    await sock.sendMessage(from, {
      text: `Example: ?foggyglass ${userName}`
    }, { quoted: msg });
    return;
  }

  try {
    await sock.sendMessage(from, {
      text: "*Processing...*"
    }, { quoted: msg });

    const text = args.join(" ");
    let data = await mumaker.textpro("https://textpro.me/write-text-on-foggy-window-online-free-1015.html", text);

    await sock.sendMessage(from, { 
      image: { url: data.image }, 
      caption: '*Logo by HORLA POOKIE*' 
    }, { quoted: msg });
  } catch (e) {
    await sock.sendMessage(from, {
      text: "🥵🥵 " + e.message
    }, { quoted: msg });
  }
});

// Whitegold command
export const whitegold = horla({ 
  nomCom: "whitegold", 
  categorie: "Logo", 
  reaction: "💫" 
}, async (msg, { sock, args }) => {
  const from = msg.key.remoteJid;
  const userName = msg.pushName || "User";

  if (!args || args.length === 0) {
    await sock.sendMessage(from, {
      text: `Example: ?whitegold ${userName}`
    }, { quoted: msg });
    return;
  }

  try {
    await sock.sendMessage(from, {
      text: "*Processing...*"
    }, { quoted: msg });

    const text = args.join(" ");
    let data = await mumaker.textpro("https://textpro.me/elegant-white-gold-3d-text-effect-online-free-1070.html", text);

    await sock.sendMessage(from, { 
      image: { url: data.image }, 
      caption: '*Logo by HORLA POOKIE*' 
    }, { quoted: msg });
  } catch (e) {
    await sock.sendMessage(from, {
      text: "🥵🥵 " + e.message
    }, { quoted: msg });
  }
});

// Lightglow command
export const lightglow = horla({ 
  nomCom: "lightglow", 
  categorie: "Logo", 
  reaction: "🌟" 
}, async (msg, { sock, args }) => {
  const from = msg.key.remoteJid;
  const userName = msg.pushName || "User";

  if (!args || args.length === 0) {
    await sock.sendMessage(from, {
      text: `Example: ?lightglow ${userName}`
    }, { quoted: msg });
    return;
  }

  try {
    await sock.sendMessage(from, {
      text: "*Processing...*"
    }, { quoted: msg });

    const text = args.join(" ");
    let data = await mumaker.textpro("https://textpro.me/create-light-glow-sliced-text-effect-online-1068.html", text);

    await sock.sendMessage(from, { 
      image: { url: data.image }, 
      caption: '*Logo by HORLA POOKIE*' 
    }, { quoted: msg });
  } catch (e) {
    await sock.sendMessage(from, {
      text: "🥵🥵 " + e.message
    }, { quoted: msg });
  }
});

// Thor command
export const thor = horla({
  nomCom: "thor",
  categorie: "Logo",
  reaction: "🔨"
}, async (msg, { sock, args }) => {
  const from = msg.key.remoteJid;
  const userName = msg.pushName || "User";

  try {
    if (!args || args.length === 0) {
      await sock.sendMessage(from, {
        text: `Example: ?thor ${userName}`
      }, { quoted: msg });
      return;
    }

    await sock.sendMessage(from, {
      text: "*Processing...*"
    }, { quoted: msg });

    var lien = "https://textpro.me/create-thor-logo-style-text-effect-online-1064.html";
    var img = await mumaker.textpro(lien, args.join(' '));

    await sock.sendMessage(from, {
      image: { url: img.image },
      caption: "*Logo by HORLA POOKIE*"
    }, { quoted: msg });
  } catch (e) {
    await sock.sendMessage(from, {
      text: "🥵🥵 " + e.message
    }, { quoted: msg });
  }
});

// Purple command
export const purple = horla({
  nomCom: "purple",
  categorie: "Logo",
  reaction: "🧳"
}, async (msg, { sock, args }) => {
  const from = msg.key.remoteJid;
  const userName = msg.pushName || "User";

  try {
    if (!args || args.length === 0) {
      await sock.sendMessage(from, {
        text: `Example: ?purple ${userName}`
      }, { quoted: msg });
      return;
    }

    await sock.sendMessage(from, {
      text: "*Processing...*"
    }, { quoted: msg });

    const lien = "https://en.ephoto360.com/purple-text-effect-online-100.html";
    var img = await mumaker.ephoto(lien, args.join(' '));

    await sock.sendMessage(from, {
      image: { url: img.image },
      caption: "*Logo by HORLA POOKIE*"
    }, { quoted: msg });
  } catch (e) {
    await sock.sendMessage(from, {
      text: "🥵🥵 " + e.message
    }, { quoted: msg });
  }
});

// Gold command
export const gold = horla({
  nomCom: "gold",
  categorie: "Logo",
  reaction: "🧚🏿‍♀️"
}, async (msg, { sock, args }) => {
  const from = msg.key.remoteJid;
  const userName = msg.pushName || "User";

  try {
    if (!args || args.length === 0) {
      await sock.sendMessage(from, {
        text: `Example: ?gold ${userName}`
      }, { quoted: msg });
      return;
    }

    await sock.sendMessage(from, {
      text: "*Processing...*"
    }, { quoted: msg });

    var lien = "https://en.ephoto360.com/modern-gold-4-213.html";
    var img = await mumaker.ephoto(lien, args.join(' '));

    await sock.sendMessage(from, {
      image: { url: img.image },
      caption: "*Logo by HORLA POOKIE*"
    }, { quoted: msg });
  } catch (e) {
    await sock.sendMessage(from, {
      text: "🥵🥵 " + e.message
    }, { quoted: msg });
  }
});

// Arena command
export const arena = horla({
  nomCom: "arena",
  categorie: "Logo",
  reaction: "🥵"
}, async (msg, { sock, args }) => {
  const from = msg.key.remoteJid;
  const userName = msg.pushName || "User";

  try {
    if (!args || args.length === 0) {
      await sock.sendMessage(from, {
        text: `Example: ?arena ${userName}`
      }, { quoted: msg });
      return;
    }

    await sock.sendMessage(from, {
      text: "*Processing...*"
    }, { quoted: msg });

    var lien = "https://en.ephoto360.com/create-cover-arena-of-valor-by-mastering-360.html";
    var img = await mumaker.ephoto(lien, args.join(' '));

    await sock.sendMessage(from, {
      image: { url: img.image },
      caption: "*Logo by HORLA POOKIE*"
    }, { quoted: msg });
  } catch (e) {
    await sock.sendMessage(from, {
      text: "🥵🥵 " + e.message
    }, { quoted: msg });
  }
});

// Incandescent command
export const incandescent = horla({
  nomCom: "incandescent",
  categorie: "Logo",
  reaction: "😋"
}, async (msg, { sock, args }) => {
  const from = msg.key.remoteJid;
  const userName = msg.pushName || "User";

  try {
    if (!args || args.length === 0) {
      await sock.sendMessage(from, {
        text: `Example: ?incandescent ${userName}`
      }, { quoted: msg });
      return;
    }

    await sock.sendMessage(from, {
      text: "*Processing...*"
    }, { quoted: msg });

    var lien = "https://en.ephoto360.com/text-effects-incandescent-bulbs-219.html";
    var img = await mumaker.ephoto(lien, args.join(' '));

    await sock.sendMessage(from, {
      image: { url: img.image },
      caption: "*Logo by HORLA POOKIE*"
    }, { quoted: msg });
  } catch (e) {
    await sock.sendMessage(from, {
      text: "🥵🥵 " + e.message
    }, { quoted: msg });
  }
});

// Export all commands as an array
export default [
  hacker,
  dragonball,
  naruto,
  didong,
  wall,
  summer,
  neonlight,
  greenneon,
  glitch,
  devil,
  boom,
  water,
  snow,
  transformer,
  thunder,
  harrypotter,
  foggyglass,
  whitegold,
  lightglow,
  thor,
  purple,
  gold,
  arena,
  incandescent
];
