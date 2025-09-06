
import axios from 'axios';
import * as cheerio from 'cheerio';

export default {
    name: 'urlpreview',
    description: 'Get preview information from a URL',
    async execute(msg, { sock, args }) {
        if (!args.length) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: '❌ Please provide a URL to preview.\nUsage: ?urlpreview https://example.com' 
            }, { quoted: msg });
            return;
        }

        const url = args[0];
        
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: '❌ Please provide a valid URL starting with http:// or https://' 
            }, { quoted: msg });
            return;
        }

        try {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: '🔍 Getting URL preview...' 
            }, { quoted: msg });

            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                timeout: 10000
            });

            const $ = cheerio.load(response.data);
            
            const title = $('title').text() || $('meta[property="og:title"]').attr('content') || 'No title found';
            const description = $('meta[name="description"]').attr('content') || 
                              $('meta[property="og:description"]').attr('content') || 
                              'No description available';
            const image = $('meta[property="og:image"]').attr('content') || null;
            const siteName = $('meta[property="og:site_name"]').attr('content') || new URL(url).hostname;

            let previewText = `🌐 **URL Preview**\n\n📝 **Title:** ${title}\n\n📄 **Description:** ${description}\n\n🏷️ **Site:** ${siteName}\n\n🔗 **URL:** ${url}`;

            if (image) {
                try {
                    const imageResponse = await axios.get(image, { responseType: 'arraybuffer' });
                    const imageBuffer = Buffer.from(imageResponse.data);
                    
                    await sock.sendMessage(msg.key.remoteJid, {
                        image: imageBuffer,
                        caption: previewText
                    }, { quoted: msg });
                } catch (imgError) {
                    await sock.sendMessage(msg.key.remoteJid, {
                        text: previewText
                    }, { quoted: msg });
                }
            } else {
                await sock.sendMessage(msg.key.remoteJid, {
                    text: previewText
                }, { quoted: msg });
            }

        } catch (error) {
            console.error('URL preview error:', error);
            await sock.sendMessage(msg.key.remoteJid, { 
                text: '❌ Failed to get URL preview. The URL might be inaccessible or invalid.' 
            }, { quoted: msg });
        }
    }
};
