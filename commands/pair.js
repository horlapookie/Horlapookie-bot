
import PastebinAPI from 'pastebin-js';
import { makeid } from './id.js';
import express from 'express';
import fs from 'fs';
import pino from 'pino';
import { 
    default as Horlapookie,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore,
    Browsers
} from '@whiskeysockets/baileys';

const pastebin = new PastebinAPI('EMWTMkQAVfJa9kM-MRUrxd5Oku1U7pgL');
let router = express.Router();


router.get('/', async (req, res) => {
    const id = makeid();
    let num = req.query.number;
    
    async function Horlapookie_PAIR_CODE() {
        const { state, saveCreds } = await useMultiFileAuthState('./temp/' + id);
        try {
            let Pair_Code_By_Horlapookie = Horlapookie({
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'fatal' }).child({ level: 'fatal' })),
                },
                printQRInTerminal: false,
                logger: pino({ level: 'fatal' }).child({ level: 'fatal' }),
                browser: Browsers.macOS('Chrome')
            });

            if (!Pair_Code_By_Horlapookie.authState.creds.registered) {
                await delay(1500);
                num = num.replace(/[^0-9]/g, '');
                const code = await Pair_Code_By_Horlapookie.requestPairingCode(num);
                if (!res.headersSent) {
                    await res.send({ code });
                }
            }

            Pair_Code_By_Horlapookie.ev.on('creds.update', saveCreds);
            Pair_Code_By_Horlapookie.ev.on('connection.update', async (s) => {
                const { connection, lastDisconnect } = s;
                if (connection === 'open') {
                    await delay(5000);
                    let data = fs.readFileSync(new URL('./temp/' + id + '/creds.json', import.meta.url));
                    await delay(800);
                    let b64data = Buffer.from(data).toString('base64');
                    let session = await Pair_Code_By_Horlapookie.sendMessage(Pair_Code_By_Horlapookie.user.id, { text: b64data });

                    let Star_MD_TEXT = `

╭─═━⌬━═─⊹⊱✦⊰⊹─═━⌬━═─ 
╎   『 𝐒𝐄𝐒𝐒𝐈𝐎𝐍 𝐂𝐎𝐍𝐍𝐄𝐂𝐓𝐄𝐃 』   
╎  ✦ ʜᴏʀʟᴀᴘᴏᴏᴋɪᴇ sᴇssɪᴏɴ
╎  ✦  ʙʏ ʜᴏʀʟᴀᴘᴏᴏᴋɪᴇ
╰╴╴╴╴

▌   『 🔐 𝐒𝐄𝐋𝐄𝐂𝐓𝐄𝐃 𝐒𝐄𝐒𝐒𝐈𝐎𝐍 』   
▌  • Session ID:  
▌  ⛔ [ Please set your SESSION_ID ] 

╔═
╟   『 𝐂𝐎𝐍𝐓𝐀𝐂𝐓 & 𝐒𝐔𝐏𝐏𝐎𝐑𝐓 』  
╟  🎥 𝐘𝐨𝐮𝐓𝐮𝐛𝐞:  https://youtube.com/@olamilekanidowu-zf2yb?si=yqS_0CyNcC-fyTG_ 
╟  👑 𝐎𝐰𝐧𝐞𝐫: 2349122222622 & 2347049044897  
╟  💻 Github: github.com/horlapookie
╟  💻 𝐑𝐞𝐩𝐨: github.com/horlapookie/Horlapookie-bot   
╟  👥 𝐖𝐚𝐆𝐫𝐨𝐮𝐩: https://chat.whatsapp.com/GceMJ4DG4aW2n12dGrH20A?mode=ac_t
╟  📢 𝐖𝐚𝐂𝐡𝐚𝐧𝐧𝐞𝐥:  https://whatsapp.com/channel/0029Vb6AZrY2f3EMgD8kRQ01
╟  📸 telegram: t.me/horlapookie  
╰  
✦⋅⋆⋅⋆⋅⋆⋅⋆⋅⋆⋅⋆⋅⋆⋅⋆⋅⋆⋅⋆⋅✦  
   𝐄𝐍𝐉𝐎𝐘 Horlapookie!  
✦⋅⋆⋅⋆⋅⋆⋅⋆⋅⋆⋅⋆⋅⋆⋅⋆⋅⋆⋅⋆⋅✦  
______________________________
★彡[ᴅᴏɴ'ᴛ ғᴏʀɢᴇᴛ ᴛᴏ sᴛᴀʀ ᴛʜᴇ ʀᴇᴘᴏ!]彡★
`;

                    await Pair_Code_By_Horlapookie.sendMessage(Pair_Code_By_Horlapookie.user.id, { text: Star_MD_TEXT }, { quoted: session });

                    await delay(100);
                    await Pair_Code_By_Horlapookie.ws.close();
                    return await removeFile('./temp/' + id);
                } else if (connection === 'close' && lastDisconnect && lastDisconnect.error && lastDisconnect.error.output.statusCode != 401) {
                    await delay(10000);
                    Horlapookie_PAIR_CODE();
                }
            });
        } catch (err) {
            console.log('Service restarted');
            await removeFile('./temp/' + id);
            if (!res.headersSent) {
                await res.send({ code: 'Service Currently Unavailable' });
            }
        }
    }
    
    return await Horlapookie_PAIR_CODE();
});

// Export the router for external use
export { router };

// Export the command for the bot
const pairCommand = {
  name: 'pair',
  description: 'Generate pairing code for WhatsApp Web',
  category: 'Utility',
  aliases: ['getcode', 'paircode'],
  async execute(msg, { sock, args, settings }) {
    const from = msg.key.remoteJid;
    
    if (!args[0]) {
      return await sock.sendMessage(from, {
        text: `*📱 WhatsApp Pairing*\n\nTo get a pairing code, please provide your phone number:\n\nExample: ${settings.prefix}pair 2349122222622\n\n⚠️ *Important:*\n• Include country code\n• No spaces or symbols\n• Example: 234 for Nigeria`
      }, { quoted: msg });
    }

    const phoneNumber = args[0].replace(/[^0-9]/g, '');
    
    if (phoneNumber.length < 10) {
      return await sock.sendMessage(from, {
        text: '❌ Invalid phone number. Please include country code.\n\nExample: 2349122222622'
      }, { quoted: msg });
    }

    try {
      await sock.sendMessage(from, {
        text: '🔄 Generating pairing code...\n\nThis may take a few moments. Please wait...'
      }, { quoted: msg });

      // Generate actual pairing code using Baileys
      const tempId = makeid();
      const tempDir = `./temp_pair_${tempId}`;
      
      try {
        const { state, saveCreds } = await useMultiFileAuthState(tempDir);
        
        const pairSocket = Horlapookie({
          auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'fatal' }).child({ level: 'fatal' })),
          },
          printQRInTerminal: false,
          logger: pino({ level: 'fatal' }).child({ level: 'fatal' }),
          browser: Browsers.macOS('Chrome')
        });

        if (!pairSocket.authState.creds.registered) {
          await delay(1500);
          const pairingCode = await pairSocket.requestPairingCode(phoneNumber);
          
          const codeMessage = `*📱 WhatsApp Pairing Code Generated*\n\n*Phone Number:* +${phoneNumber}\n*Pairing Code:* \`${pairingCode}\`\n\n*Instructions:*\n1. Open WhatsApp on your phone\n2. Go to Settings > Linked Devices\n3. Tap "Link a Device"\n4. Enter this code: \`${pairingCode}\`\n\n⚠️ *Important:*\n• Code expires in 20 seconds\n• Keep this code private\n• Only use on your own device\n\n*Need help?* Contact: 2349122222622`;
          
          await sock.sendMessage(from, {
            text: codeMessage
          }, { quoted: msg });
          
          // Clean up immediately after pairing code is generated
          setTimeout(() => {
            try {
              if (pairSocket && pairSocket.ws) {
                pairSocket.ws.close();
              }
              removeFile(tempDir);
            } catch (e) {
              console.log('Cleanup error:', e.message);
            }
          }, 5000); // Reduced timeout to 5 seconds
          
        } else {
          await sock.sendMessage(from, {
            text: '❌ Unable to generate pairing code. The session may already be registered.'
          }, { quoted: msg });
          removeFile(tempDir);
        }
        
      } catch (pairError) {
        console.log('Pairing generation error:', pairError.message);
        await sock.sendMessage(from, {
          text: `❌ Error generating pairing code: ${pairError.message}\n\nPlease try again or contact support.`
        }, { quoted: msg });
        removeFile(tempDir);
      }

    } catch (error) {
      console.log('Pair command error:', error.message);
      await sock.sendMessage(from, {
        text: '❌ Error generating pairing code. Please try again later or contact support.'
      }, { quoted: msg });
    }
  }
};

// Helper function to remove temporary files
function removeFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.rmSync(filePath, { recursive: true, force: true });
    }
  } catch (error) {
    console.log('File removal error:', error.message);
  }
}

export default pairCommand;
