import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  name: 'groupinfo',
  description: 'ℹ️ Display group metadata, admins, and profile picture.',
  async execute(msg, { sock }) {
    console.log(`[INFO] Executing groupinfo command for message ID: ${msg.key.id}, from: ${msg.key.remoteJid}`);
    try {
      const chatId = msg.key.remoteJid;
      if (!chatId.endsWith('@g.us')) {
        console.log('[INFO] Command used in non-group chat');
        await sock.sendMessage(chatId, { text: 'This command can only be used in groups!' }, { quoted: msg });
        return;
      }

      // Retry logic for API calls
      const retry = async (fn, maxRetries = 3, delay = 1000) => {
        for (let i = 0; i < maxRetries; i++) {
          try {
            return await fn();
          } catch (err) {
            if (err.response?.status === 429 && i < maxRetries - 1) {
              console.log(`[INFO] Rate limit (429) hit, retrying in ${delay}ms`);
              await new Promise(resolve => setTimeout(resolve, delay));
              delay *= 2; // Exponential backoff
            } else {
              throw err;
            }
          }
        }
      };

      // Get group metadata with retry
      const groupMetadata = await retry(() => sock.groupMetadata(chatId));

      // Get group profile picture with retry
      let pp;
      try {
        pp = await retry(() => sock.profilePictureUrl(chatId, 'image'));
      } catch {
        pp = 'https://i.imgur.com/2wzGhpF.jpeg';
        console.log('[INFO] Using default profile picture');
      }

      // Get admins and owner
      const participants = groupMetadata.participants;
      const groupAdmins = participants.filter(p => p.admin);
      const listAdmin = groupAdmins.map((v, i) => `${i + 1}. @${v.id.split('@')[0]}`).join('\n');
      const owner = groupMetadata.owner || groupAdmins.find(p => p.admin === 'superadmin')?.id || chatId.split('-')[0] + '@s.whatsapp.net';

      // Create info text
      const text = `
┌──「 *INFO GROUP* 」
▢ *♻️ID:*
   • ${groupMetadata.id}
▢ *🔖NAME* : 
   • ${groupMetadata.subject}
▢ *👥Members* :
   • ${participants.length}
▢ *🤿Group Owner:*
   • @${owner.split('@')[0]}
▢ *🕵🏻‍♂️Admins:*
   ${listAdmin}
▢ *📌Description* :
   • ${groupMetadata.desc?.toString() || 'No description'}
`.trim();

      console.log(`[INFO] Sending group info to: ${chatId}`);
      await sock.sendMessage(chatId, {
        image: { url: pp },
        caption: text,
        mentions: [...groupAdmins.map(v => v.id), owner]
      }, { quoted: msg });
      console.log(`[INFO] Group info sent successfully to: ${chatId}`);

    } catch (error) {
      console.error(`[ERROR] Failed to execute groupinfo command:`, error.message);
      await sock.sendMessage(msg.key.remoteJid, {
        text: `Failed to get group info: ${error.message}`,
      }, { quoted: msg }).catch((err) => {
        console.error('[ERROR] Failed to send error message:', err.message);
      });
    }
  }
};
