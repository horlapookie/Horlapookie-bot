
import { horla } from '../lib/horla.js';
import fs from 'fs';
import path from 'path';

export default horla({
  nomCom: "blocklist",
  aliases: ["listblock", "blacklist", "blocked"],
  reaction: "🚫",
  categorie: "Utility"
}, async (dest, zk, commandeOptions) => {
  const { repondre, ms, arg, sock } = commandeOptions;
  
  try {
    // Get WhatsApp blocked users
    let whatsappBlocked = [];
    try {
      const blockedUsers = await sock.fetchBlocklist();
      whatsappBlocked = blockedUsers || [];
    } catch (e) {
      console.log('Could not fetch WhatsApp blocklist:', e.message);
    }

    // Also check local banned file
    const bannedFile = path.join(process.cwd(), 'data', 'banned.json');
    let localBlocked = [];
    
    if (fs.existsSync(bannedFile)) {
      const bannedData = JSON.parse(fs.readFileSync(bannedFile, 'utf8'));
      localBlocked = Array.isArray(bannedData) ? bannedData : Object.values(bannedData);
    }

    // Combine WhatsApp blocked and local blocked
    const allBlocked = new Set();
    
    // Add WhatsApp blocked users
    whatsappBlocked.forEach(jid => {
      const number = jid.replace('@s.whatsapp.net', '');
      allBlocked.add(number);
    });
    
    // Add local blocked users
    localBlocked.forEach(user => {
      const number = typeof user === 'string' ? user : user.number;
      if (number) allBlocked.add(number);
    });

    if (allBlocked.size === 0) {
      return repondre("🚫 *BLOCKED USERS*\n\nNo users are currently blocked.");
    }

    let blocklistText = "🚫 *BLOCKED USERS*\n\n";
    const blockedArray = Array.from(allBlocked);
    blockedArray.forEach((number, index) => {
      const isWhatsAppBlocked = whatsappBlocked.some(jid => jid.includes(number));
      const status = isWhatsAppBlocked ? "📵 WhatsApp Blocked" : "📝 Local Only";
      blocklistText += `${index + 1}. +${number}\n   ${status}\n\n`;
    });

    blocklistText += `\n*Total: ${blockedArray.length} blocked users*`;

    repondre(blocklistText);

  } catch (e) {
    console.error('Blocklist Error:', e);
    repondre("❌ Error retrieving blocklist.");
  }
});
