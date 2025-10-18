
import crypto from 'crypto';

export default {
  name: "decrypt",
  description: "Decrypt encrypted text",
  category: "Utility Tools",
  async execute(msg, { sock, args, settings }) {
    const from = msg.key.remoteJid;

    try {
      if (!args || args.length < 2) {
        return await sock.sendMessage(from, {
          text: `Usage: ${settings.prefix}decrypt <algorithm> <encrypted_text> [key]`
        }, { quoted: msg });
      }

      const algorithm = args[0].toLowerCase();
      const encryptedText = args[1];
      const key = args[2] || 'defaultkey';

      let decryptedText;

      switch (algorithm) {
        case 'base64':
          decryptedText = Buffer.from(encryptedText, 'base64').toString('utf8');
          break;
        case 'hex':
          decryptedText = Buffer.from(encryptedText, 'hex').toString('utf8');
          break;
        case 'aes':
          try {
            const decipher = crypto.createDecipher('aes-256-cbc', key);
            decryptedText = decipher.update(encryptedText, 'hex', 'utf8');
            decryptedText += decipher.final('utf8');
          } catch (e) {
            throw new Error('Invalid AES encrypted text or key');
          }
          break;
        default:
          return await sock.sendMessage(from, {
            text: 'Supported algorithms: base64, hex, aes'
          }, { quoted: msg });
      }

      await sock.sendMessage(from, {
        text: `🔓 *Decryption Result*\n\n*Algorithm:* ${algorithm}\n*Decrypted Text:* ${decryptedText}`
      }, { quoted: msg });

    } catch (error) {
      await sock.sendMessage(from, {
        text: `❌ Decryption failed: ${error.message}`
      }, { quoted: msg });
    }
  }
};
