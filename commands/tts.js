
import fs from 'fs';
import path from 'path';
import { randomBytes } from 'crypto';
import https from 'https';

export default {
    name: 'tts',
    description: 'Convert text to speech',
    aliases: ['speak', 'voice'],
    async execute(msg, { sock, args, settings }) {
        const from = msg.key.remoteJid;

        let text = '';
        
        // Check if replying to a message
        if (msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
            const quotedMsg = msg.message.extendedTextMessage.contextInfo.quotedMessage;
            if (quotedMsg.conversation) {
                text = quotedMsg.conversation;
            } else if (quotedMsg.extendedTextMessage?.text) {
                text = quotedMsg.extendedTextMessage.text;
            }
        }
        
        // If no quoted text, use command arguments
        if (!text && args.length > 0) {
            text = args.join(' ');
        }

        if (!text) {
            return await sock.sendMessage(from, { 
                text: `❌ Please provide text to convert to speech!\n\nUsage:\n• ${settings.prefix}tts Hello world\n• Reply to a text message with ${settings.prefix}tts` 
            }, { quoted: msg });
        }

        if (text.length > 200) {
            return await sock.sendMessage(from, { 
                text: '❌ Text is too long! Maximum 200 characters allowed.' 
            }, { quoted: msg });
        }

        try {
            await sock.sendMessage(from, { 
                text: '🎤 Converting text to speech... Please wait!' 
            }, { quoted: msg });

            // Create temp directory if it doesn't exist
            const tempDir = './temp';
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            const timestamp = randomBytes(3).toString('hex');
            const audioPath = path.join(tempDir, `tts_${timestamp}.mp3`);

            // Clean text for URL
            const cleanText = encodeURIComponent(text);
            
            // Use Google Translate TTS API (free alternative)
            const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=en&client=tw-ob&q=${cleanText}`;
            
            // Download TTS audio
            await new Promise((resolve, reject) => {
                const file = fs.createWriteStream(audioPath);
                
                const request = https.get(ttsUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                    }
                }, (response) => {
                    if (response.statusCode !== 200) {
                        reject(new Error(`HTTP ${response.statusCode}`));
                        return;
                    }
                    
                    response.pipe(file);
                    
                    file.on('finish', () => {
                        file.close();
                        resolve();
                    });
                    
                    file.on('error', (err) => {
                        fs.unlink(audioPath, () => {});
                        reject(err);
                    });
                });
                
                request.on('error', (err) => {
                    reject(err);
                });
                
                request.setTimeout(30000, () => {
                    request.destroy();
                    reject(new Error('Request timeout'));
                });
            });

            // Check if file exists and has content
            if (fs.existsSync(audioPath) && fs.statSync(audioPath).size > 0) {
                // Send as voice note
                await sock.sendMessage(from, {
                    audio: fs.readFileSync(audioPath),
                    mimetype: 'audio/mpeg',
                    ptt: true, // Send as voice note
                    contextInfo: {
                        externalAdReply: {
                            title: '🎤 Text-to-Speech',
                            body: text.length > 50 ? text.substring(0, 50) + '...' : text,
                            thumbnailUrl: 'https://picsum.photos/300/300?random=tts',
                            sourceUrl: '',
                            mediaType: 1,
                            renderLargerThumbnail: false
                        }
                    }
                }, { quoted: msg });

                await sock.sendMessage(from, { 
                    text: `✅ *Text converted to speech!*\n\n📝 *Text:* ${text}\n🎤 *Language:* English\n\n💡 *Tip:* You can reply to any text message with ${settings.prefix}tts to convert it!` 
                }, { quoted: msg });
            } else {
                throw new Error('TTS file is empty or failed to generate');
            }

            // Clean up temp file
            setTimeout(() => {
                try {
                    if (fs.existsSync(audioPath)) {
                        fs.unlinkSync(audioPath);
                    }
                } catch (cleanupError) {
                    console.log('Cleanup error:', cleanupError);
                }
            }, 5000);

        } catch (error) {
            console.error('TTS error:', error);
            await sock.sendMessage(from, { 
                text: '❌ Failed to convert text to speech. This might be due to:\n• Network issues\n• Text contains unsupported characters\n• TTS service unavailable\n\nPlease try again with simpler text.' 
            }, { quoted: msg });
        }
    }
};
