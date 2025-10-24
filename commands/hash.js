
import crypto from 'crypto';

export default {
    name: 'hash',
    description: 'Generate hash from text using various algorithms',
    async execute(msg, { sock, args }) {
        if (args.length < 2) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: '❌ Please provide algorithm and text.\nUsage:\n?hash md5 your text here\n?hash sha256 your text here\n\nSupported: md5, sha1, sha256, sha512' 
            }, { quoted: msg });
            return;
        }

        const algorithm = args[0].toLowerCase();
        const text = args.slice(1).join(' ');
        
        const supportedAlgorithms = ['md5', 'sha1', 'sha256', 'sha512'];
        
        if (!supportedAlgorithms.includes(algorithm)) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: '❌ Unsupported algorithm. Supported: md5, sha1, sha256, sha512' 
            }, { quoted: msg });
            return;
        }

        try {
            const hash = crypto.createHash(algorithm).update(text).digest('hex');
            
            await sock.sendMessage(msg.key.remoteJid, {
                text: `🔐 **${algorithm.toUpperCase()} Hash**\n\n📝 **Text:** ${text}\n🔑 **Hash:** ${hash}`
            }, { quoted: msg });

        } catch (error) {
            console.error('Hash generation error:', error);
            await sock.sendMessage(msg.key.remoteJid, { 
                text: '❌ Failed to generate hash. Please try again.' 
            }, { quoted: msg });
        }
    }
};
