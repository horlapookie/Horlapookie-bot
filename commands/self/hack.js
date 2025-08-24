
import moment from 'moment-timezone';
import config from '../../config.js';

export default {
  name: 'hack',
  description: '😈 Simulate a prank hacking process',
  category: 'Fun',
  
  async execute(msg, { sock }) {
    console.log(`[INFO] Executing hack command for message ID: ${msg.key.id}, from: ${msg.key.remoteJid}`);

    try {
      moment.tz.setDefault("Africa/Lagos");
      const time = moment().format('HH:mm:ss');
      const date = moment().format('DD/MM/YYYY');

      const loadingMessages = [
        "```⚡ HORLAPOOKIE-XMD Injecting malware⚡```",
        "```🔐 HORLAPOOKIE-XMD into device \n 0%```",
        "```♻️ transfering photos \n █ 10%```",
        "```♻️ transfer successful \n █ █ 20%```",
        "```♻️ transfering videos \n █ █ █ 30%```",
        "```♻️ transfer successful \n █ █ █ █ 40%```",
        "```♻️ transfering audio \n █ █ █ █ █ 50%```",
        "```♻️ transfer successful \n █ █ █ █ █ █ 60%```",
        "```♻️ transfering hidden files \n █ █ █ █ █ █ █ 70%```",
        "```♻️ transfer successful \n █ █ █ █ █ █ █ █ 80%```",
        "```♻️ transfering whatsapp chat \n █ █ █ █ █ █ █ █ █ 90%```",
        "```♻️ transfer successful \n █ █ █ █ █ █ █ █ █ █ 100%```",
        "```📲 System hyjacking on process.. \n Conecting to Server```",
        "```🔌 HORLAPOOKIE-XMD successfully connected... \n Riciving data...```",
        "```💡 Data hyjacked from divice 100% completed \n killing all evidence killing all malwares...```",
        "```🔋 HACKING COMPLETED ```",
        "```📤 SENDING ALL PHONE DOCUMENTS```"
      ];

      for (const message of loadingMessages) {
        try {
          console.log(`[INFO] Sending hack progress message to: ${msg.key.remoteJid}`);
          await sock.sendMessage(msg.key.remoteJid, { text: message }, { quoted: msg });
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          console.error(`[ERROR] Failed to send hack progress message to ${msg.key.remoteJid}:`, error.message);
        }
      }

      const transferMessage = "```🗂️ ALL FILES TRANSFERRED```";
      try {
        console.log(`[INFO] Sending transfer completed message to: ${msg.key.remoteJid}`);
        await sock.sendMessage(msg.key.remoteJid, { text: transferMessage }, { quoted: msg });
      } catch (error) {
        console.error(`[ERROR] Failed to send transfer completed message to ${msg.key.remoteJid}:`, error.message);
        await sock.sendMessage(msg.key.remoteJid, {
          text: "_🙏 An error occurred while sending the main prank message 🤨_"
        }, { quoted: msg }).catch((err) => {
          console.error('[ERROR] Failed to send error message:', err.message);
        });
        return;
      }

      const countdownMessages = ['10', '9', '8', '7', '6', '5', '4', '3', '2', '1'];
      for (const _ of countdownMessages) {
        try {
          console.log(`[INFO] Sending countdown message to: ${msg.key.remoteJid}`);
          await sock.sendMessage(msg.key.remoteJid, {
            text: "```❇️ SUCCESSFULLY SENT DATA AND Connection disconnected 📤```"
          }, { quoted: msg });
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`[ERROR] Failed to send countdown message to ${msg.key.remoteJid}:`, error.message);
        }
      }

      const finalMessage = `
😏 *VICTIM SYSTEM HORLAPOOKIE-XMD DEMOLISHED!* 🤔

📜 BY *${config.botName}* ⚪
*Date*: ${date} | *Time*: ${time} (WAT)

> *POWERED BY ${config.botName.toUpperCase()}*
> ©ᴘᴏᴡᴇʀᴇᴅ ʙʏ ${config.ownerName}
`;

      try {
        console.log(`[INFO] Sending final hack message to: ${msg.key.remoteJid}`);
        await sock.sendMessage(msg.key.remoteJid, {
          text: finalMessage,
          contextInfo: {
            externalAdReply: {
              title: `*${config.botName}* HACK PRANK`,
              body: "Just a prank, bro! Keep your device safe!",
              thumbnailUrl: "https://i.imgur.com/hackimage.jpg",
              sourceUrl: "https://whatsapp.com/channel/0029Vb6AZrY2f3EMgD8kRQ01",
              mediaType: 1,
              renderLargerThumbnail: true
            }
          }
        }, { quoted: msg });
        console.log(`[INFO] Hack prank completed successfully for: ${msg.key.remoteJid}`);
      } catch (error) {
        console.error(`[ERROR] Failed to send final hack message to ${msg.key.remoteJid}:`, error.message);
        await sock.sendMessage(msg.key.remoteJid, {
          text: "_😊 A critical error occurred during the prank 🤗_"
        }, { quoted: msg }).catch((err) => {
          console.error('[ERROR] Failed to send error message:', err.message);
        });
      }
    } catch (error) {
      console.error(`[ERROR] Critical error in hack script for ${msg.key.remoteJid}:`, error.message);
      await sock.sendMessage(msg.key.remoteJid, {
        text: "_😊 A critical error occurred during the prank 🤗_"
      }, { quoted: msg }).catch((err) => {
        console.error('[ERROR] Failed to send error message:', err.message);
      });
    }
  }
};
