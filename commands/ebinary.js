
export default {
  name: 'ebinary',
  aliases: ['encode', 'encodebinary'],
  description: 'Encode text to binary',
  async execute(msg, { sock, args }) {
    const from = msg.key.remoteJid;
    const text = args.join(" ").trim();

    if (!text) {
      return await sock.sendMessage(from, { 
        text: 'Please provide text to encode.' 
      }, { quoted: msg });
    }

    try {
      // Convert text to binary
      let binaryResult = '';
      for (let i = 0; i < text.length; i++) {
        const binary = text.charCodeAt(i).toString(2).padStart(8, '0');
        binaryResult += binary + ' ';
      }

      await sock.sendMessage(from, { 
        text: `Binary encoded: ${binaryResult.trim()}` 
      }, { quoted: msg });
    } catch (error) {
      await sock.sendMessage(from, { 
        text: 'Error encoding the text to binary.' 
      }, { quoted: msg });
    }
  }
};
