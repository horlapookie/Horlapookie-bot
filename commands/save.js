
import { downloadMediaMessage } from '@whiskeysockets/baileys';

export default {
    name: 'save',
    description: 'Save status when replying to it (Linked account only)',
    async execute(msg, { sock, args, settings }) {
        const from = msg.key.remoteJid;
        
        try {
            // Check if replying to a message
            if (!msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
                await sock.sendMessage(from, {
                    text: `❌ Please reply to a status message to save it!\n\n📝 **Usage:**\n• Reply to status: ${settings.prefix}save\n\n💡 **Tip:** This will save the status to bot's personal chat`
                }, { quoted: msg });
                return;
            }

            const quotedMsg = msg.message.extendedTextMessage.contextInfo.quotedMessage;
            let mediaType = '';
            let mediaMessage = null;
            
            // Determine media type
            if (quotedMsg.imageMessage) {
                mediaType = 'image';
                mediaMessage = quotedMsg.imageMessage;
            } else if (quotedMsg.videoMessage) {
                mediaType = 'video';
                mediaMessage = quotedMsg.videoMessage;
            } else if (quotedMsg.conversation || quotedMsg.extendedTextMessage?.text) {
                mediaType = 'text';
            } else {
                await sock.sendMessage(from, {
                    text: '❌ Unsupported media type. Please reply to an image, video, or text status.'
                }, { quoted: msg });
                return;
            }
            
            // Send to the same chat (bot's personal chat with user)
            if (mediaType === 'text') {
                // Handle text status
                const textContent = quotedMsg.conversation || quotedMsg.extendedTextMessage?.text || 'No text content';
                
                await sock.sendMessage(from, {
                    text: `💾 **Status Saved**\n\n📝 **Content:**\n${textContent}\n\n📍 **From:** ${from}\n⏰ **Time:** ${new Date().toLocaleString()}`
                });
                
                await sock.sendMessage(from, {
                    text: '✅ Text status saved!'
                }, { quoted: msg });
            } else {
                // Handle media status
                try {
                    const quotedMessage = {
                        key: {
                            remoteJid: from,
                            id: msg.message.extendedTextMessage.contextInfo.stanzaId,
                            participant: msg.message.extendedTextMessage.contextInfo.participant
                        },
                        message: quotedMsg
                    };
                    
                    const buffer = await downloadMediaMessage(quotedMessage, 'buffer', {});
                    
                    if (!buffer) {
                        throw new Error('Failed to download media');
                    }
                    
                    const caption = `💾 **Status Saved**\n\n📍 **From:** ${from}\n⏰ **Time:** ${new Date().toLocaleString()}`;
                    
                    if (mediaType === 'image') {
                        await sock.sendMessage(from, {
                            image: buffer,
                            caption: caption
                        });
                    } else if (mediaType === 'video') {
                        await sock.sendMessage(from, {
                            video: buffer,
                            caption: caption
                        });
                    }
                    
                    await sock.sendMessage(from, {
                        text: '✅ Status media saved!'
                    }, { quoted: msg });
                    
                } catch (downloadError) {
                    console.error('Status save error:', downloadError);
                    await sock.sendMessage(from, {
                        text: '❌ Failed to save status media. The media might be expired or corrupted.'
                    }, { quoted: msg });
                }
            }
            
        } catch (error) {
            console.error('Save command error:', error);
            await sock.sendMessage(from, {
                text: '❌ Error saving status. Please try again.'
            }, { quoted: msg });
        }
    }
};
