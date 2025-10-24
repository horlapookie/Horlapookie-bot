
export default {
  name: 'debinary',
  aliases: ['decode', 'decodebinary'],
  description: 'Decode binary text to string',
  async execute(msg, { sock, args }) {
    const from = msg.key.remoteJid;
    const text = args.join(" ").trim();

    if (!text) {
      return await sock.sendMessage(from, { 
        text: 'Please provide binary text to decode.' 
      }, { quoted: msg });
    }

    try {
      // Remove spaces and validate binary
      const binaryString = text.replace(/\s/g, '');
      if (!/^[01]+$/.test(binaryString)) {
        return await sock.sendMessage(from, { 
          text: 'Please provide valid binary (only 0s and 1s).' 
        }, { quoted: msg });
      }

      // Convert binary to text
      let decodedText = '';
      for (let i = 0; i < binaryString.length; i += 8) {
        const byte = binaryString.substr(i, 8);
        if (byte.length === 8) {
          decodedText += String.fromCharCode(parseInt(byte, 2));
        }
      }

      await sock.sendMessage(from, { 
        text: `Decoded text: ${decodedText}` 
      }, { quoted: msg });
    } catch (error) {
      await sock.sendMessage(from, { 
        text: 'An error occurred while decoding the binary data.' 
      }, { quoted: msg });
    }
  }
};
