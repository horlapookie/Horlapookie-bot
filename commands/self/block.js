
import { horla } from '../../lib/horla.js';
import fs from 'fs';
import path from 'path';

export default horla({
  nomCom: "block",
  reaction: "🚫",
  categorie: "Self"
}, async (dest, zk, commandeOptions) => {
  const { repondre, ms, arg, sock } = commandeOptions;
  
  try {
    // Only work in private messages
    if (dest.endsWith('@g.us')) {
      return repondre("❌ This command only works in private messages.");
    }

    const userToBlock = dest;
    const userNumber = dest.replace('@s.whatsapp.net', '');
    
    // Block user on WhatsApp
    await sock.updateBlockStatus(userToBlock, 'block');
    
    // Also add to local banned list for tracking
    const bannedFile = path.join(process.cwd(), 'data', 'banned.json');
    
    // Create banned.json if it doesn't exist
    if (!fs.existsSync(bannedFile)) {
      fs.writeFileSync(bannedFile, JSON.stringify([], null, 2));
    }

    let bannedData = JSON.parse(fs.readFileSync(bannedFile, 'utf8'));
    
    // Convert object to array if needed
    if (!Array.isArray(bannedData)) {
      bannedData = Object.values(bannedData);
    }

    // Check if user is already in local list
    const isInList = bannedData.some(user => 
      (typeof user === 'string' ? user : user.number) === userNumber
    );

    if (!isInList) {
      // Add user to local blocked list
      bannedData.push({
        number: userNumber,
        timestamp: new Date().toISOString(),
        jid: userToBlock
      });

      fs.writeFileSync(bannedFile, JSON.stringify(bannedData, null, 2));
    }
    
    repondre("✅ User has been blocked on WhatsApp successfully.");

  } catch (e) {
    console.error('Block Error:', e);
    repondre("❌ Error blocking user on WhatsApp.");
  }
});
