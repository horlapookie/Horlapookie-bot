
import axios from 'axios';

export default {
    name: 'expand',
    description: 'Expand a shortened URL to see the original destination',
    async execute(msg, { sock, args }) {
        if (!args.length) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: '❌ Please provide a shortened URL to expand.\nUsage: ?expand https://tinyurl.com/example' 
            }, { quoted: msg });
            return;
        }

        const shortUrl = args[0];
        
        if (!shortUrl.startsWith('http://') && !shortUrl.startsWith('https://')) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: '❌ Please provide a valid URL starting with http:// or https://' 
            }, { quoted: msg });
            return;
        }

        try {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: '🔍 Expanding URL...' 
            }, { quoted: msg });

            const response = await axios.head(shortUrl, { 
                maxRedirects: 5,
                validateStatus: () => true
            });

            const finalUrl = response.request.res.responseUrl || shortUrl;
            
            const urlInfo = `🔍 **URL Expanded Successfully!**

✂️ **Shortened URL:**
${shortUrl}

📎 **Original URL:**
${finalUrl}

🔒 **Status:** ${response.status} ${response.statusText}
⏰ **Checked:** ${new Date().toLocaleString()}`;

            await sock.sendMessage(msg.key.remoteJid, {
                text: urlInfo
            }, { quoted: msg });

        } catch (error) {
            console.error('URL expansion error:', error);
            await sock.sendMessage(msg.key.remoteJid, { 
                text: '❌ Failed to expand URL. The URL might be invalid or inaccessible.' 
            }, { quoted: msg });
        }
    }
};
