import moment from 'moment-timezone';
import config from '../config.js';
import { horla, cm } from '../lib/horla.js';
import { format } from '../lib/mesfonctions.js';
import { mediaUrls } from '../lib/mediaUrls.js';

export default horla({
  nomCom: 'bugmenu',
  categorie: 'Menu',
  reaction: '🐛',
  description: '📜 Display the HORLA POOKIE Bot bug command menu'
}, async (msg, context) => {
  const { sock, repondre, prefixe, nomAuteurMessage } = context;
  console.log(`[INFO] Executing bugmenu command for message ID: ${msg.key.id}, from: ${msg.key.remoteJid}`);

  try {
    moment.tz.setDefault("Africa/Lagos");
    const time = moment().format('HH:mm:ss');
    const date = moment().format('DD/MM/YYYY');

    // Group commands by category
    let coms = {};
    let mode = (config.MODE && config.MODE.toLowerCase() === 'yes') ? 'public' : 'self';

    cm.forEach(com => {
      if (!coms[com.categorie]) {
        coms[com.categorie] = [];
      }
      coms[com.categorie].push(com.nomCom);
    });

    // Build menu message
    let infoMsg = `
━━━━✺ *${config.botName} BUG🐛 MENU* ✺━━━━
╭─────────────────────❍
│☆ bug
│☆ crash
│☆ loccrash
│☆ amountbug <amount>
│☆ crashbug 2541726XXXX
│☆ pmbug 25471726XXXX
│☆ delaybug 25471726XXX
│☆ trollybug 255XXXX
│☆ docubug 254XXXX
│☆ unlimitedbug 25471726XXXX
│☆ bombug 25471726XXXX
│☆ lagbug 25471726XXXX
│☆ gcbug <grouplink>
│☆ delaygcbug <grouplink>
│☆ trollygcbug <grouplink>
│☆ laggcbug <grouplink>
│☆ bomgcbug <grouplink>
│☆ unlimitedgcbug <grouplink>
│☆ docugcbug <grouplink>
╰─────────────────────❍

╭────────────────────⊷
┊╭──> *TIME*: ${time}
┊╭──> *DATE*: ${date}
┊╭──> *MODE*: ${mode}
╰────────────────────⊷`;

    let menuMsg = `
╭──────────────────••
┊ ${config.botName}
┊ [${mediaUrls.channelUrl}]
╰──────────────────••

> ©${config.ownerName}
`;

    // Select random image from mediaUrls.bugImages
    const lien = mediaUrls.bugImages[Math.floor(Math.random() * mediaUrls.bugImages.length)];
    console.log(`[INFO] Sending bugmenu to: ${msg.key.remoteJid}, image: ${lien}`);

    // Send image (all URLs in bugImages are .jpeg)
    try {
      await sock.sendMessage(msg.key.remoteJid, {
        image: { url: lien },
        caption: infoMsg + menuMsg,
        footer: `Je suis *${config.botName}*, déveloper ${config.ownerName}`,
        contextInfo: {
          externalAdReply: {
            title: `*${config.botName}* BUG MENU`,
            body: "Explore the bug commands!",
            thumbnailUrl: lien,
            sourceUrl: mediaUrls.channelUrl,
            mediaType: 1,
            renderLargerThumbnail: true
          }
        }
      }, { quoted: msg });
      console.log(`[INFO] Bugmenu (image) sent successfully to: ${msg.key.remoteJid}`);
    } catch (error) {
      console.error(`[ERROR] Failed to send image bugmenu to ${msg.key.remoteJid}:`, error.message);
      // Fallback to text
      try {
        await sock.sendMessage(msg.key.remoteJid, {
          text: infoMsg + menuMsg,
          contextInfo: {
            externalAdReply: {
              title: `*${config.botName}* BUG MENU`,
              body: "Explore the bug commands!",
              thumbnailUrl: lien,
              sourceUrl: mediaUrls.channelUrl,
              mediaType: 1,
              renderLargerThumbnail: true
            }
          }
        }, { quoted: msg });
        console.log(`[INFO] Bugmenu (text) sent successfully to: ${msg.key.remoteJid}`);
      } catch (textError) {
        console.error(`[ERROR] Failed to send text bugmenu to ${msg.key.remoteJid}:`, textError.message);
        if (repondre && typeof repondre === 'function') {
          await repondre(`🥵🥵 Menu erreur: ${textError.message}`);
        }
      }
    }
  } catch (error) {
    console.error(`[ERROR] Critical error in bugmenu for ${msg.key.remoteJid}:`, error.message);
    if (repondre && typeof repondre === 'function') {
      await repondre(`🥵🥵 Menu erreur: ${error.message}`);
    } else {
      // Fallback to direct message sending
      try {
        await sock.sendMessage(msg.key.remoteJid, {
          text: `🥵🥵 Menu erreur: ${error.message}`
        }, { quoted: msg });
      } catch (sendError) {
        console.error(`[ERROR] Failed to send error message:`, sendError.message);
      }
    }
  }
});