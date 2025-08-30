
import axios from 'axios';

export default {
    name: 'urlcheck',
    description: 'Check if a URL is safe and accessible',
    async execute(msg, { sock, args }) {
        if (!args.length) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: '❌ Please provide a URL to check.\nUsage: ?urlcheck https://example.com' 
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
                text: '🔍 Checking URL safety and accessibility...' 
            }, { quoted: msg });

            const startTime = Date.now();
            const response = await axios.head(url, {
                timeout: 10000,
                validateStatus: () => true,
                maxRedirects: 5
            });
            const responseTime = Date.now() - startTime;

            const finalUrl = response.request.res.responseUrl || url;
            const isRedirect = finalUrl !== url;
            
            let safetyStatus = '✅ Appears Safe';
            if (response.status >= 400) {
                safetyStatus = '⚠️ Error Response';
            } else if (isRedirect) {
                safetyStatus = '🔄 Redirected';
            }

            const checkResult = `🔍 **URL Safety Check**

🔗 **Original URL:** ${url}
${isRedirect ? `🔄 **Final URL:** ${finalUrl}` : ''}

🛡️ **Safety Status:** ${safetyStatus}
📊 **HTTP Status:** ${response.status} ${response.statusText}
⚡ **Response Time:** ${responseTime}ms
🔒 **Protocol:** ${new URL(finalUrl).protocol}
🌐 **Domain:** ${new URL(finalUrl).hostname}

⏰ **Checked:** ${new Date().toLocaleString()}`;

            await sock.sendMessage(msg.key.remoteJid, {
                text: checkResult
            }, { quoted: msg });

        } catch (error) {
            console.error('URL check error:', error);
            
            let errorMessage = '❌ **URL Check Failed**\n\n';
            if (error.code === 'ENOTFOUND') {
                errorMessage += '🚫 **Status:** Domain not found\n💡 **Tip:** Check if the URL is spelled correctly';
            } else if (error.code === 'ECONNREFUSED') {
                errorMessage += '🚫 **Status:** Connection refused\n💡 **Tip:** The server might be down';
            } else if (error.code === 'ETIMEDOUT') {
                errorMessage += '🚫 **Status:** Connection timeout\n💡 **Tip:** The server is taking too long to respond';
            } else {
                errorMessage += `🚫 **Status:** ${error.message}`;
            }
            
            await sock.sendMessage(msg.key.remoteJid, { 
                text: errorMessage 
            }, { quoted: msg });
        }
    }
};
