
import axios from 'axios';

export default {
    name: 'shorten',
    description: 'Shorten a URL using TinyURL',
    async execute(msg, { sock, args }) {
        if (!args.length) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: '❌ Please provide a URL to shorten.\nUsage: ?shorten https://example.com' 
            }, { quoted: msg });
            return;
        }

        const url = args[0];
        
        // Basic URL validation
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: '❌ Please provide a valid URL starting with http:// or https://' 
            }, { quoted: msg });
            return;
        }

        try {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: '🔗 Shortening URL...' 
            }, { quoted: msg });

            const response = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`);
            const shortUrl = response.data;

            if (shortUrl && shortUrl.startsWith('https://tinyurl.com/')) {
                const urlInfo = `🔗 **URL Shortened Successfully!**

📎 **Original URL:**
${url}

✂️ **Shortened URL:**
${shortUrl}

📊 **Saved Characters:** ${url.length - shortUrl.length}
⏰ **Created:** ${new Date().toLocaleString()}`;

                await sock.sendMessage(msg.key.remoteJid, {
                    text: urlInfo
                }, { quoted: msg });
            } else {
                throw new Error('Invalid response from TinyURL');
            }

        } catch (error) {
            console.error('URL shortening error:', error);
            await sock.sendMessage(msg.key.remoteJid, { 
                text: '❌ Failed to shorten URL. Please check if the URL is valid and accessible.' 
            }, { quoted: msg });
        }
    }
};
