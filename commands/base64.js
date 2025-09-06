
export default {
    name: 'base64',
    description: 'Encode or decode base64 text',
    async execute(msg, { sock, args }) {
        if (args.length < 2) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: '❌ Please provide action and text.\nUsage:\n?base64 encode your text here\n?base64 decode eW91ciB0ZXh0IGhlcmU=' 
            }, { quoted: msg });
            return;
        }

        const action = args[0].toLowerCase();
        const text = args.slice(1).join(' ');

        try {
            let result;
            
            if (action === 'encode') {
                result = Buffer.from(text).toString('base64');
                
                await sock.sendMessage(msg.key.remoteJid, {
                    text: result
                }, { quoted: msg });
                
            } else if (action === 'decode') {
                result = Buffer.from(text, 'base64').toString('utf8');
                
                await sock.sendMessage(msg.key.remoteJid, {
                    text: result
                }, { quoted: msg });
                
            } else {
                await sock.sendMessage(msg.key.remoteJid, { 
                    text: '❌ Invalid action. Use "encode" or "decode".' 
                }, { quoted: msg });
            }

        } catch (error) {
            console.error('Base64 operation error:', error);
            await sock.sendMessage(msg.key.remoteJid, { 
                text: '❌ Failed to process base64 operation. Please check your input.' 
            }, { quoted: msg });
        }
    }
};
