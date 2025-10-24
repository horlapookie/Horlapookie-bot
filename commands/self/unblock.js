
import { horla } from '../../lib/horla.js';
import fs from 'fs';
import path from 'path';

export default horla({
  nomCom: "unblock",
  reaction: "✅",
  categorie: "Self"
}, async (dest, zk, commandeOptions) => {
  const { repondre, ms, arg, sock } = commandeOptions;
  
  try {
    // Only work in private messages
    if (dest.endsWith('@g.us')) {
      return repondre("❌ This command only works in private messages.");
    }

    const userToUnblock = dest;
    const userNumber = dest.replace('@s.whatsapp.net', '');
    
    // Unblock user on WhatsApp
    await sock.updateBlockStatus(userToUnblock, 'unblock');
    
    // Also remove from local banned list
    const bannedFile = path.join(process.cwd(), 'data', 'banned.json');
    
    if (!fs.existsSync(bannedFile)) {
      return repondre("✅ User has been unblocked on WhatsApp successfully.");
    }

    let bannedData = JSON.parse(fs.readFileSync(bannedFile, 'utf8'));
    
    // Convert object to array if needed
    if (!Array.isArray(bannedData)) {
      bannedData = Object.values(bannedData);
    }

    // Find and remove user from local blocked list
    const initialLength = bannedData.length;
    bannedData = bannedData.filter(user => 
      (typeof user === 'string' ? user : user.number) !== userNumber
    );

    if (bannedData.length !== initialLength) {
      fs.writeFileSync(bannedFile, JSON.stringify(bannedData, null, 2));
    }
    
    repondre("✅ User has been unblocked on WhatsApp successfully.");

  } catch (e) {
    console.error('Unblock Error:', e);
    repondre("❌ Error unblocking user on WhatsApp.");
  }
});
