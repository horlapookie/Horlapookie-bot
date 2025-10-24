
import { horla } from '../lib/horla.js';
import traduire from '../lib/traduire.js';

export default horla({
  nomCom: "trt2",
  categorie: "Conversion",
  reaction: "👨🏿‍💻"
}, async (msg, { sock, args }) => {
  const from = msg.key.remoteJid;

  // Check if replying to a message
  if (!msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
    await sock.sendMessage(from, {
      text: 'Mention a text Message'
    }, { quoted: msg });
    return;
  }

  const quotedMsg = msg.message.extendedTextMessage.contextInfo.quotedMessage;

  try {
    if (!args || !args[0]) {
      await sock.sendMessage(from, {
        text: 'Please specify language code (eg: trt2 en)'
      }, { quoted: msg });
      return;
    }

    const textToTranslate = quotedMsg.conversation || quotedMsg.extendedTextMessage?.text;
    
    if (!textToTranslate) {
      await sock.sendMessage(from, {
        text: 'No text found to translate'
      }, { quoted: msg });
      return;
    }

    let texttraduit = await traduire(textToTranslate, { to: args[0] });
    
    await sock.sendMessage(from, {
      text: texttraduit
    }, { quoted: msg });

  } catch (error) {
    console.error('Translation error:', error);
    await sock.sendMessage(from, {
      text: 'Translation failed. Please try again.'
    }, { quoted: msg });
  }
});
