
import axios from 'axios';

export default {
    name: 'gpt4',
    description: 'Ask GPT-4 a question using scraper',
    aliases: ['gpt-4', 'ai'],
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
                text: `❓ Please provide a question or prompt!\n\nUsage:\n• ${settings.prefix}gpt4 How are you?\n• Reply to a message with ${settings.prefix}gpt4` 
            }, { quoted: msg });
        }

        if (text.length > 2000) {
            return await sock.sendMessage(from, { 
                text: '❌ Text is too long! Maximum 2000 characters allowed.' 
            }, { quoted: msg });
        }

        try {
            await sock.sendMessage(from, { 
                text: '🤖 GPT-4 is thinking... Please wait!' 
            }, { quoted: msg });

            async function SupunAi(text) {
                let response = await axios.post("https://chateverywhere.app/api/chat/", {
                    model: {
                        id: "gpt-4",
                        name: "GPT-4",
                        maxLength: 32000,
                        tokenLimit: 8000,
                        completionTokenLimit: 5000,
                        deploymentName: "gpt-4"
                    },
                    messages: [{
                        pluginId: null,
                        content: text,
                        role: "user"
                    }],
                    prompt: "ඔයාගෙ නම = මම HORLA POOKIEAI කෙනෙක්,කෑවද බන් = මම කෑවා ඔයා කෑවද?, බිව්ව ද බන් = මම බිව්වා ඔයා බිව්වද?, නම = SUPUN-MD-AI",
                    temperature: 0.5
                }, {
                    headers: {
                        Accept: "*/*",
                        "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
                    }
                });
                return response.data;
            }

            const result = await SupunAi(text);
            
            if (result && result.length > 0) {
                await sock.sendMessage(from, { 
                    text: `🤖 *GPT-4 Response:*\n\n${result}\n\n💡 *Tip:* You can reply to any message with ${settings.prefix}gpt4 to analyze it!` 
                }, { quoted: msg });
            } else {
                throw new Error('Empty response from GPT-4');
            }

        } catch (error) {
            console.error('GPT-4 error:', error);
            
            let errorMessage = '❌ Sorry, GPT-4 is currently unavailable. Please try again later.';
            
            if (error.response?.status === 429) {
                errorMessage = '❌ GPT-4 is busy. Please try again in a few minutes.';
            } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
                errorMessage = '❌ GPT-4 service is currently down. Please try again later.';
            } else if (error.response?.status === 400) {
                errorMessage = '❌ Invalid request. Please try with different text.';
            }
            
            await sock.sendMessage(from, { 
                text: errorMessage 
            }, { quoted: msg });
        }
    }
};
