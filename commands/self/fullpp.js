
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
    
    // Use downloadContentFromMessage instead of downloadAndSaveMediaMessage
    const { downloadContentFromMessage } = await import('@whiskeysockets/baileys');
    const stream = await downloadContentFromMessage(media, 'image');
    
    // Convert stream to buffer
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk]);
    }

    // Generate profile picture using the buffer
    const { img } = await generateProfilePicture(buffer);

    // Update bot profile picture
    await zk.updateProfilePicture(zk.user.id, img);

    // No file cleanup needed as we used streams

    repondre("✅ Bot Profile Picture Updated Successfully!");

  } catch (error) {
    console.error('Profile picture update error:', error);
    repondre("❌ An error occurred while updating bot profile photo: " + error.message);
  }
});
