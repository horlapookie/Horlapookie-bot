
import { horla } from '../../lib/horla.js';
import { generateProfilePicture } from '../../fredi/dl/Function.js';
import fs from 'fs';

export default horla({
  nomCom: "fullpp",
  aliases: ["updatepp", "ppfull"],
  reaction: '🍂',
  categorie: "Self"
}, async (dest, zk, commandeOptions) => {
  const { repondre, ms } = commandeOptions;

  // Check if message is quoted/replied to
  const quotedMessage = ms.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  
  if (!quotedMessage) {
    return repondre('❌ Please reply to an image to update bot profile picture.');
  }

  if (!quotedMessage.imageMessage) {
    return repondre('❌ The quoted message is not an image. Please quote an image.');
  }

  try {
    repondre('📸 Processing image for profile picture update...');

    // Download the quoted image using the correct method
    const media = quotedMessage.imageMessage;
    
    let buffer;
    try {
      // Use downloadContentFromMessage method
      const { downloadContentFromMessage } = await import('@whiskeysockets/baileys');
      const stream = await downloadContentFromMessage(media, 'image');
      
      // Convert stream to buffer
      let chunks = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      buffer = Buffer.concat(chunks);
    } catch (downloadError) {
      console.log('Download failed:', downloadError.message);
      
      // Alternative method - try to construct download message
      try {
        const contextInfo = ms.message?.extendedTextMessage?.contextInfo;
        const downloadMsg = {
          key: {
            remoteJid: dest,
            id: contextInfo?.stanzaId || ms.key.id,
            participant: contextInfo?.participant
          },
          message: quotedMessage
        };
        
        buffer = await zk.downloadMediaMessage(downloadMsg, 'buffer');
      } catch (altError) {
        console.log('Alternative download also failed:', altError.message);
        throw new Error('Failed to download image');
      }
    }

    if (!buffer || buffer.length === 0) {
      return repondre('❌ Failed to download the image. Please try with a different image.');
    }

    // Generate profile picture using the buffer
    const { img } = await generateProfilePicture(buffer);

    // Update bot profile picture
    await zk.updateProfilePicture(zk.user.id, img);

    repondre("✅ Bot Profile Picture Updated Successfully!");

  } catch (error) {
    console.error('Profile picture update error:', error);
    repondre("❌ An error occurred while updating bot profile photo: " + error.message);
  }
});
