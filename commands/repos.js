
export default {
  name: 'repos',
  description: '📚 Show bot repositories and important links',
  async execute(msg, { sock, settings }) {
    const from = msg.key.remoteJid;
    
    try {
      const repoInfo = `𝙍𝙚𝙥𝙤𝙨 𝙤𝙛 "𝙔𝙤𝙪𝙧 𝙃𝙞𝙜𝙝𝙣𝙚𝙨𝙨" 𝘽𝙤𝙩:

1. *𝘗𝘶𝘳𝘦 𝘝1 (𝘖𝘳𝘪𝘨𝘪𝘯𝘢𝘭)*  
   🔗 http://github.com/horlapookie/WhisperRoyalty

2. *𝘝1 𝘉𝘦𝘵𝘢 (𝘞𝘩𝘪𝘴𝘱𝘦𝘳𝘙𝘰𝘺𝘢𝘭𝘵𝘺𝘉)*  
   🔗 https://github.com/horlapookie/WhisperRoyaltyB

3. *𝙈𝙖𝙞𝙣 𝙃𝙤𝙧𝙡𝙖𝙥𝙤𝙤𝙠𝙞𝙚-𝘽𝙤𝙩*  
   🔗 http://Github.com/horlapookie/Horlapookie-bot

---

*𝙐𝙣𝙡𝙤𝙘𝙠 𝙏𝙝𝙚 𝙋𝙤𝙬𝙚𝙧 𝙤𝙛 𝙔𝙤𝙪𝙧 𝙃𝙞𝙜𝙝𝙣𝙚𝙨𝙨! 👑🚀*

🔓 𝙂𝙚𝙩 𝙔𝙤𝙪𝙧 𝙎𝙚𝙨𝙨𝙞𝙤𝙣 𝙄𝘿 𝙉𝙤𝙬:  
👉 https://horlapookie-session.onrender.com

👥 𝙅𝙤𝙞𝙣 𝙤𝙪𝙧 𝙒𝙝𝙖𝙩𝙨𝙖𝙥𝙥 𝘾𝙝𝙖𝙣𝙣𝙚𝙡:  
🔗 https://whatsapp.com/channel/0029Vb6AZrY2f3EMgD8kRQ01

🌐 𝙃𝙤𝙧𝙡𝙖𝙥𝙤𝙤𝙠𝙞𝙚-𝘽𝙤𝙩 𝙒𝙚𝙗 𝙋𝙤𝙧𝙩𝙖𝙡:  
🔗 https://horlapookie-botweb-deploy.onrender.com

📢 𝙏𝙚𝙡𝙚𝙜𝙧𝙖𝙢 𝘾𝙝𝙖𝙣𝙣𝙚𝙡:  
🔗 https://t.me/+WHL-cThMVYtjOTI8

👑 𝙁𝙖𝙨𝙩 𝙐𝙥𝙙𝙖𝙩𝙚𝙨 𝙂𝙧𝙤𝙪𝙥:  
🔗 https://chat.whatsapp.com/GceMJ4DG4aW2n12dGrH20A?mode=ac_t

---

*ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʜᴏʀʟᴀ-ᴘᴏᴏᴋɪᴇ-ʙᴏᴛ©*`;

      await sock.sendMessage(from, { text: repoInfo }, { quoted: msg });
      console.log(`[INFO] Repository info sent to: ${from}`);
      
    } catch (error) {
      console.error(`[ERROR] Failed to send repo info to ${from}:`, error.message);
      await sock.sendMessage(from, { text: 'Failed to fetch repository information. Please try again later.' }, { quoted: msg });
    }
  }
};
