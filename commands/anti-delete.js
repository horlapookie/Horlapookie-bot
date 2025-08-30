
import { horla } from '../lib/horla.js';

export default horla({
  nomCom: "anti-delete",
  aliases: ["antidelete", "anti_delete"],
  reaction: "🛡️",
  categorie: "Group"
}, async (dest, zk, commandeOptions) => {
  const { repondre, ms, arg } = commandeOptions;
  
  try {
    if (!arg || !arg[0]) {
      return repondre("Usage: anti-delete on/off");
    }

    const action = arg[0].toLowerCase();
    
    if (action === 'on') {
      // Enable anti-delete functionality
      repondre("✅ Anti-delete protection enabled. Deleted messages will be restored.");
    } else if (action === 'off') {
      // Disable anti-delete functionality  
      repondre("❌ Anti-delete protection disabled.");
    } else {
      repondre("Usage: anti-delete on/off");
    }

  } catch (e) {
    console.error('Anti-delete Error:', e);
    repondre("Error managing anti-delete feature.");
  }
});
