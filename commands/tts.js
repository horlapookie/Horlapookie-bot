
import fs from 'fs';
import path from 'path';
import { randomBytes } from 'crypto';
import https from 'https';
import axios from 'axios';

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

        // Clean and prepare text
        text = text.replace(/[?]/g, '').trim(); // Remove question marks that cause issues
        
        // Split long text into manageable chunks
        const maxChunkLength = 150; // Shorter chunks for better reliability
        const textChunks = [];
        
        if (text.length > maxChunkLength) {
            // Split by sentences first, then by words if needed
            const sentences = text.match(/[^.!?]+[.!?]+/g) || text.split(/\s+/);
            let currentChunk = '';
            
            for (const part of sentences) {
                const cleanPart = part.trim();
                if ((currentChunk + ' ' + cleanPart).length <= maxChunkLength) {
                    currentChunk = currentChunk ? currentChunk + ' ' + cleanPart : cleanPart;
                } else {
                    if (currentChunk) textChunks.push(currentChunk);
                    // If single part is too long, split by words
                    if (cleanPart.length > maxChunkLength) {
                        const words = cleanPart.split(/\s+/);
                        let wordChunk = '';
                        for (const word of words) {
                            if ((wordChunk + ' ' + word).length <= maxChunkLength) {
                                wordChunk = wordChunk ? wordChunk + ' ' + word : word;
                            } else {
                                if (wordChunk) textChunks.push(wordChunk);
                                wordChunk = word;
                            }
                        }
                        if (wordChunk) currentChunk = wordChunk;
                    } else {
                        currentChunk = cleanPart;
                    }
                }
            }
            if (currentChunk) textChunks.push(currentChunk);
        } else {
            textChunks.push(text);
        }

        const processingMsg = textChunks.length > 1 
            ? `🎤 Converting ${textChunks.length} parts to speech... Please wait!`
            : '🎤 Converting text to speech... Please wait!';

        await sock.sendMessage(from, { text: processingMsg }, { quoted: msg });

        try {
            // Create temp directory
            const tempDir = './temp';
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            const timestamp = randomBytes(3).toString('hex');
            const audioFiles = [];

            // Process each chunk with multiple TTS services
            for (let i = 0; i < textChunks.length; i++) {
                const chunk = textChunks[i];
                const audioPath = path.join(tempDir, `tts_${timestamp}_${i}.mp3`);
                
                let success = false;
                const ttsServices = [
                    // Service 1: Google TTS (original)
                    async (text) => {
                        const cleanText = encodeURIComponent(text);
                        const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=en&client=tw-ob&q=${cleanText}`;
                        
                        return new Promise((resolve, reject) => {
                            const file = fs.createWriteStream(audioPath);
                            const request = https.get(url, {
                                headers: {
                                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                                    'Accept': 'audio/mpeg,audio/*,*/*',
                                    'Accept-Language': 'en-US,en;q=0.9'
                                }
                            }, (response) => {
                                if (response.statusCode === 200) {
                                    response.pipe(file);
                                    file.on('finish', () => {
                                        file.close();
                                        resolve();
                                    });
                                } else {
                                    reject(new Error(`HTTP ${response.statusCode}`));
                                }
                            });
                            request.setTimeout(10000, () => {
                                request.destroy();
                                reject(new Error('Timeout'));
                            });
                            request.on('error', reject);
                        });
                    },
                    
                    // Service 2: Alternative Google TTS
                    async (text) => {
                        const cleanText = encodeURIComponent(text);
                        const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=en&client=gtx&q=${cleanText}`;
                        
                        const response = await axios.get(url, {
                            responseType: 'stream',
                            timeout: 10000,
                            headers: {
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                            }
                        });
                        
                        return new Promise((resolve, reject) => {
                            const file = fs.createWriteStream(audioPath);
                            response.data.pipe(file);
                            file.on('finish', resolve);
                            file.on('error', reject);
                        });
                    },
                    
                    // Service 3: Fallback service
                    async (text) => {
                        const cleanText = encodeURIComponent(text.substring(0, 100)); // Limit to 100 chars for fallback
                        const url = `https://api.streamelements.com/kappa/v2/speech?voice=Brian&text=${cleanText}`;
                        
                        const response = await axios.get(url, {
                            responseType: 'stream',
                            timeout: 10000
                        });
                        
                        return new Promise((resolve, reject) => {
                            const file = fs.createWriteStream(audioPath);
                            response.data.pipe(file);
                            file.on('finish', resolve);
                            file.on('error', reject);
                        });
                    }
                ];

                // Try each service until one works
                for (let serviceIndex = 0; serviceIndex < ttsServices.length; serviceIndex++) {
                    try {
                        await ttsServices[serviceIndex](chunk);
                        
                        // Verify file was created and has content
                        if (fs.existsSync(audioPath) && fs.statSync(audioPath).size > 100) {
                            audioFiles.push({ path: audioPath, text: chunk });
                            success = true;
                            break;
                        }
                    } catch (serviceError) {
                        console.log(`TTS Service ${serviceIndex + 1} failed:`, serviceError.message);
                        if (fs.existsSync(audioPath)) {
                            fs.unlinkSync(audioPath);
                        }
                    }
                }
                
                if (!success) {
                    throw new Error(`All TTS services failed for chunk ${i + 1}`);
                }
            }

            // Send all audio files
            for (let i = 0; i < audioFiles.length; i++) {
                const audioFile = audioFiles[i];
                const partText = textChunks.length > 1 ? ` (Part ${i + 1}/${audioFiles.length})` : '';
                
                await sock.sendMessage(from, {
                    audio: fs.readFileSync(audioFile.path),
                    mimetype: 'audio/mpeg',
                    ptt: true,
                    contextInfo: {
                        externalAdReply: {
                            title: `🎤 Text-to-Speech${partText}`,
                            body: audioFile.text.length > 50 ? audioFile.text.substring(0, 50) + '...' : audioFile.text,
                            thumbnailUrl: 'https://i.imgur.com/tts-thumb.jpg',
                            sourceUrl: '',
                            mediaType: 1,
                            renderLargerThumbnail: false
                        }
                    }
                }, { quoted: msg });

                // Delay between parts
                if (i < audioFiles.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1500));
                }
            }

            const totalLength = text.length;
            const partsText = textChunks.length > 1 ? ` in ${textChunks.length} parts` : '';
            
            await sock.sendMessage(from, { 
                text: `✅ *Text converted to speech${partsText}!*\n\n📝 *Text Length:* ${totalLength} characters\n🎤 *Language:* English\n🎯 *Quality:* HD Audio\n\n💡 *Tip:* Reply to any text message with ${settings.prefix}tts to convert it!` 
            }, { quoted: msg });

            // Clean up files after delay
            setTimeout(() => {
                audioFiles.forEach(audioFile => {
                    try {
                        if (fs.existsSync(audioFile.path)) {
                            fs.unlinkSync(audioFile.path);
                        }
                    } catch (cleanupError) {
                        console.log('File cleanup error:', cleanupError.message);
                    }
                });
            }, 15000);

        } catch (error) {
            console.error('TTS conversion error:', error);
            await sock.sendMessage(from, { 
                text: `❌ *Text-to-Speech conversion failed*\n\n🔍 *Possible reasons:*\n• Text contains unsupported characters\n• All TTS services are temporarily unavailable\n• Network connectivity issues\n\n💡 *Solutions:*\n• Try with simpler text (avoid special characters)\n• Use shorter text (under 150 characters)\n• Try again in a few moments\n\n📝 *Current text length:* ${text.length} characters` 
            }, { quoted: msg });
        }
    }
};
