import { downloadMediaMessage } from '@whiskeysockets/baileys';
import fs from 'fs';
import path from 'path';
import { randomBytes } from 'crypto';

export default {
    name: 'stt',
    description: 'Convert speech/audio to text',
    aliases: ['speech', 'transcribe'],
    async execute(msg, { sock, args, settings }) {
        const from = msg.key.remoteJid;

        try {
            let audioMessage = null;
            let targetMessage = null;

            // Check if replying to a message
            if (msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
                const quotedMsg = msg.message.extendedTextMessage.contextInfo.quotedMessage;

                if (quotedMsg.audioMessage) {
                    audioMessage = quotedMsg.audioMessage;
                    targetMessage = {
                        key: {
                            remoteJid: from,
                            id: msg.message.extendedTextMessage.contextInfo.stanzaId,
                            participant: msg.message.extendedTextMessage.contextInfo.participant
                        },
                        message: quotedMsg
                    };
                }
            }
            // Check if current message has audio
            else if (msg.message?.audioMessage) {
                audioMessage = msg.message.audioMessage;
                targetMessage = msg;
            }

            if (!audioMessage || !targetMessage) {
                await sock.sendMessage(from, {
                    text: `❌ Please reply to an audio message!\n\n📝 **Usage:**\n• Reply to voice note: ${settings.prefix}stt\n• Reply to audio file: ${settings.prefix}stt\n\n💡 **Tip:** This will convert speech to text`
                }, { quoted: msg });
                return;
            }

            await sock.sendMessage(from, {
                text: '🎤 Converting speech to text... Please wait!'
            }, { quoted: msg });

            try {
                // Download the audio
                const buffer = await downloadMediaMessage(targetMessage, 'buffer', {});

                if (!buffer) {
                    throw new Error('Failed to download audio');
                }

                // Create temp directory if it doesn't exist
                const tempDir = './temp';
                if (!fs.existsSync(tempDir)) {
                    fs.mkdirSync(tempDir, { recursive: true });
                }

                const timestamp = randomBytes(3).toString('hex');
                const audioPath = path.join(tempDir, `audio_${timestamp}.ogg`);

                // Save audio file
                fs.writeFileSync(audioPath, buffer);

                // Try to transcribe using available tools
                let transcriptionText = '';

                try {
                    // Method 1: Try using speech recognition if available
                    const { exec } = await import('child_process');
                    const util = await import('util');
                    const execPromise = util.promisify(exec);

                    // Convert to wav format first for better compatibility
                    const wavPath = audioPath.replace('.ogg', '.wav');

                    try {
                        // Use ffmpeg-static for better compatibility
                        const ffmpegPath = require('ffmpeg-static');
                        if (!ffmpegPath) {
                            throw new Error('FFmpeg not available');
                        }

                        await execPromise(`"${ffmpegPath}" -i "${audioPath}" -ar 16000 -ac 1 -y "${wavPath}"`);

                        // Try using available STT tools
                        try {
                            // Try Whisper first
                            const { stdout } = await execPromise(`whisper "${wavPath}" --model tiny --output_format txt --language auto --output_dir "${tempDir}"`);

                            // Read the output file
                            const outputFile = path.join(tempDir, `audio_${timestamp}.txt`);
                            if (fs.existsSync(outputFile)) {
                                transcriptionText = fs.readFileSync(outputFile, 'utf8').trim() || 'Could not transcribe audio clearly';
                                fs.unlinkSync(outputFile);
                            } else {
                                transcriptionText = stdout.trim() || 'Could not transcribe audio clearly';
                            }
                        } catch (whisperError) {
                            console.log('Whisper not available, trying alternative methods...');

                            // Alternative: Use speech-to-text if available
                            try {
                                const speech = await import('@google-cloud/speech');
                                const client = new speech.SpeechClient();

                                const audioBytes = fs.readFileSync(wavPath).toString('base64');
                                const request = {
                                    audio: { content: audioBytes },
                                    config: {
                                        encoding: 'LINEAR16',
                                        sampleRateHertz: 16000,
                                        languageCode: 'en-US',
                                    },
                                };

                                const [response] = await client.recognize(request);
                                const transcription = response.results
                                    .map(result => result.alternatives[0].transcript)
                                    .join('\n');
                                transcriptionText = transcription || 'Could not transcribe audio clearly';
                            } catch (googleError) {
                                transcriptionText = '[Audio detected. Please note: For accurate transcription, install Whisper (pip install openai-whisper) or configure Google Cloud Speech API.]';
                            }
                        }

                        // Clean up wav file
                        if (fs.existsSync(wavPath)) {
                            fs.unlinkSync(wavPath);
                        }

                    } catch (ffmpegError) {
                        console.log('FFmpeg processing failed:', ffmpegError);
                        if (ffmpegError.message.includes('FFmpeg not found')) {
                            transcriptionText = '[FFmpeg is required for audio processing. Please install FFmpeg to use this feature.]';
                        } else {
                            transcriptionText = '[Audio format conversion failed. Please try with a different audio format.]';
                        }
                    }

                } catch (sttError) {
                    console.log('STT processing error:', sttError);
                    transcriptionText = '[Speech-to-text processing failed. Please try with a clearer audio.]';
                }

                await sock.sendMessage(from, {
                    text: `🎤 *Speech-to-Text*\n\n📄 *Transcribed Text:*\n"${transcriptionText}"\n\n🔧 *Audio Info:*\n• Duration: ${audioMessage.seconds || 'Unknown'} seconds\n• Size: ${(buffer.length/1024).toFixed(2)} KB\n\n💡 *Tip:* For better results, ensure clear speech and minimal background noise`
                }, { quoted: msg });

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

            } catch (downloadError) {
                console.error('Speech-to-text processing error:', downloadError);
                await sock.sendMessage(from, {
                    text: '❌ Failed to process audio. The audio might be corrupted or in an unsupported format.'
                }, { quoted: msg });
            }

        } catch (error) {
            console.error('STT command error:', error);
            await sock.sendMessage(from, {
                text: '❌ Error processing speech-to-text. Please try again.'
            }, { quoted: msg });
        }
    }
};