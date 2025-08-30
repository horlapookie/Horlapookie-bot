
import { randomBytes } from 'crypto';
import express from 'express';
import fs from 'fs';
import pino from 'pino';
import pkg from '@whiskeysockets/baileys';
const { default: makeWASocket, useMultiFileAuthState, delay, makeCacheableSignalKeyStore, Browsers } = pkg;

const router = express.Router();

function makeid(length = 8) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

function removeFile(filePath) {
    if (!fs.existsSync(filePath)) return false;
    fs.rmSync(filePath, { recursive: true, force: true });
}

router.get('/', async (req, res) => {
    const id = makeid();
    let num = req.query.number;
    
    // Validate number
    if (!num) {
        return res.status(400).json({ 
            code: 'Please provide a valid WhatsApp number',
            error: 'Missing number parameter'
        });
    }

    // Clean and validate number
    const cleanNumber = num.replace(/[^0-9]/g, '');
    if (cleanNumber.length < 10 || cleanNumber.length > 15) {
        return res.status(400).json({ 
            code: 'Invalid number format',
            error: 'Number must be 10-15 digits'
        });
    }
    
    async function generatePairCode() {
        const { state, saveCreds } = await useMultiFileAuthState('./temp/' + id);
        
        let sock;
        let connectionTimeout;
        
        try {
            sock = makeWASocket({
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }).child({ level: 'silent' })),
                },
                printQRInTerminal: false,
                logger: pino({ level: 'silent' }).child({ level: 'silent' }),
                browser: Browsers.macOS('Chrome'),
                connectTimeoutMs: 30000,
                defaultQueryTimeoutMs: 30000,
                keepAliveIntervalMs: 10000,
                generateHighQualityLinkPreview: false,
                syncFullHistory: false,
                markOnlineOnConnect: false
            });

            // Set connection timeout
            connectionTimeout = setTimeout(() => {
                if (sock && sock.ws) {
                    sock.ws.close();
                }
                removeFile('./temp/' + id);
                if (!res.headersSent) {
                    res.status(503).json({ 
                        code: 'Connection timeout',
                        error: 'Service temporarily unavailable'
                    });
                }
            }, 45000);

            // Check if already registered
            if (!sock.authState.creds.registered) {
                await delay(2000);
                
                // Validate WhatsApp number exists
                try {
                    const whatsappID = cleanNumber + '@s.whatsapp.net';
                    const result = await sock.onWhatsApp(whatsappID);
                    
                    if (!result || !result[0] || !result[0].exists) {
                        clearTimeout(connectionTimeout);
                        removeFile('./temp/' + id);
                        return res.status(400).json({ 
                            code: 'Number not registered on WhatsApp',
                            error: 'Invalid WhatsApp number'
                        });
                    }
                } catch (checkError) {
                    console.log('WhatsApp check error:', checkError.message);
                }
                
                const code = await sock.requestPairingCode(cleanNumber);
                
                if (code && !res.headersSent) {
                    clearTimeout(connectionTimeout);
                    await res.json({ code: code });
                }
            } else {
                clearTimeout(connectionTimeout);
                removeFile('./temp/' + id);
                return res.status(400).json({ 
                    code: 'Already registered',
                    error: 'Session already exists'
                });
            }

            sock.ev.on('creds.update', saveCreds);
            
            sock.ev.on('connection.update', async (s) => {
                const { connection, lastDisconnect } = s;
                
                if (connection === 'open') {
                    clearTimeout(connectionTimeout);
                    await delay(3000);
                    
                    try {
                        const data = fs.readFileSync(`./temp/${id}/creds.json`);
                        await delay(800);
                        const b64data = Buffer.from(data).toString('base64');
                        const session = await sock.sendMessage(sock.user.id, { text: 'horlapookie~' + b64data });

                        const sessionText = `
╭─═━⌬━═─⊹⊱✦⊰⊹─═━⌬━═─ 
╎   『 𝐒𝐄𝐒𝐒𝐈𝐎𝐍 𝐂𝐎𝐍𝐍𝐄𝐂𝐓𝐄𝐃 』   
╎  ✦ ʜᴏʀʟᴀᴘᴏᴏᴋɪᴇ sᴇssɪᴏɴ
╎  ✦  ʙʏ ʜᴏʀʟᴀᴘᴏᴏᴋɪᴇ
╰╴╴╴╴

▌   『 🔐 𝐒𝐄𝐋𝐄𝐂𝐓𝐄𝐃 𝐒𝐄𝐒𝐒𝐈𝐎𝐍 』   
▌  • Session ID: ${b64data.substring(0, 20)}...
▌  ✅ Successfully Generated

╔═══════════════════════════
╟   『 𝐂𝐎𝐍𝐓𝐀𝐂𝐓 & 𝐒𝐔𝐏𝐏𝐎𝐑𝐓 』  
╟  🎥 𝐘𝐨𝐮𝐓𝐮𝐛𝐞: https://youtube.com/@olamilekanidowu-zf2yb
╟  👑 𝐎𝐰𝐧𝐞𝐫: 2349122222622 & 2347049044897  
╟  💻 Github: github.com/horlapookie
╟  💻 𝐑𝐞𝐩𝐨: github.com/horlapookie/Horlapookie-bot   
╟  👥 𝐖𝐚𝐆𝐫𝐨𝐮𝐩: https://chat.whatsapp.com/GceMJ4DG4aW2n12dGrH20A
╟  📢 𝐖𝐚𝐂𝐡𝐚𝐧𝐧𝐞𝐥: https://whatsapp.com/channel/0029Vb6AZrY2f3EMgD8kRQ01
╟  📸 Telegram: t.me/horlapookie  
╰═══════════════════════════
✦⋅⋆⋅⋆⋅⋆⋅⋆⋅⋆⋅⋆⋅⋆⋅⋆⋅⋆⋅⋆⋅✦  
   𝐄𝐍𝐉𝐎𝐘 Horlapookie!  
✦⋅⋆⋅⋆⋅⋆⋅⋆⋅⋆⋅⋆⋅⋆⋅⋆⋅⋆⋅⋆⋅✦  
______________________________
★彡[ᴅᴏɴ'ᴛ ғᴏʀɢᴇᴛ ᴛᴏ sᴛᴀʀ ᴛʜᴇ ʀᴇᴘᴏ!]彡★
`;

                        await sock.sendMessage(sock.user.id, { text: sessionText }, { quoted: session });
                        await delay(100);
                        await sock.ws.close();
                        return await removeFile('./temp/' + id);
                    } catch (err) {
                        console.error('Session error:', err);
                        await removeFile('./temp/' + id);
                    }
                } else if (connection === 'close' && lastDisconnect && lastDisconnect.error) {
                    const statusCode = lastDisconnect.error.output?.statusCode;
                    if (statusCode !== 401 && statusCode !== 403) {
                        await delay(5000);
                        generatePairCode();
                    } else {
                        clearTimeout(connectionTimeout);
                        await removeFile('./temp/' + id);
                    }
                }
            });
            
        } catch (err) {
            console.log('Service error:', err.message);
            clearTimeout(connectionTimeout);
            await removeFile('./temp/' + id);
            
            if (!res.headersSent) {
                const errorMessage = err.message.includes('timeout') 
                    ? 'Connection timeout. Please try again.'
                    : 'Service temporarily unavailable. Please try again later.';
                    
                await res.status(503).json({ 
                    code: 'Service Error',
                    error: errorMessage 
                });
            }
        }
    }
    
    return await generatePairCode();
});

export default router;
