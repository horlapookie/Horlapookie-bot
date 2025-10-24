
import axios from 'axios';

export default {
    name: 'qrcode',
    description: 'Generate QR code for text or URL',
    async execute(msg, { sock, args }) {
        if (!args.length) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: '❌ Please provide text or URL to generate QR code.\nUsage: ?qrcode https://example.com' 
            }, { quoted: msg });
            return;
        }

        const text = args.join(' ');

        try {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: '⏳ Generating QR code...' 
            }, { quoted: msg });

            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(text)}`;
            
            const response = await axios.get(qrUrl, { responseType: 'arraybuffer' });
            const qrBuffer = Buffer.from(response.data);

            await sock.sendMessage(msg.key.remoteJid, {
                image: qrBuffer,
                caption: `📱 **QR Code Generated**\n\n📝 **Content:** ${text}\n📏 **Size:** 500x500px\n⏰ **Generated:** ${new Date().toLocaleString()}`
            }, { quoted: msg });

        } catch (error) {
            console.error('QR code generation error:', error);
            await sock.sendMessage(msg.key.remoteJid, { 
                text: '❌ Failed to generate QR code. Please try again.' 
            }, { quoted: msg });
        }
    }
};
