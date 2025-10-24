
import fs from 'fs';
import path from 'path';

export default {
  name: "fullpp",
  description: "Update your profile picture to full size without cropping",
  aliases: ["updatepp", "ppfull"],
  category: "Profile",
  async execute(msg, { sock }) {
    const from = msg.key.remoteJid;

    try {
      // Check if there's a quoted message with an image
      const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      if (!quotedMsg?.imageMessage) {
        return await sock.sendMessage(from, {
          text: '❌ Please reply to an image to set it as your profile picture.'
        }, { quoted: msg });
      }

      await sock.sendMessage(from, {
        text: "🔄 Processing image and updating profile picture..."
      }, { quoted: msg });

      // Get context info
      const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
      
      // Create message object for download with proper structure
      const imageMsg = {
        key: {
          remoteJid: from,
          id: contextInfo?.stanzaId || msg.key.id,
          participant: contextInfo?.participant
        },
        message: quotedMsg
      };

      // Download the image using the correct method
      let buffer;
      try {
        // Try using downloadMediaMessage first
        buffer = await sock.downloadMediaMessage(imageMsg, 'buffer');
      } catch (downloadError) {
        console.log('Download method 1 failed, trying alternative:', downloadError.message);
        
        // Alternative method using downloadContentFromMessage
        try {
          const { downloadContentFromMessage } = await import('@whiskeysockets/baileys');
          const stream = await downloadContentFromMessage(quotedMsg.imageMessage, 'image');
          
          // Convert stream to buffer
          let chunks = [];
          for await (const chunk of stream) {
            chunks.push(chunk);
          }
          buffer = Buffer.concat(chunks);
        } catch (altError) {
          console.log('Alternative download method also failed:', altError.message);
          throw new Error('Failed to download image with both methods');
        }
      }

      if (!buffer || buffer.length === 0) {
        return await sock.sendMessage(from, {
          text: "❌ Failed to download the image. Please try again."
        }, { quoted: msg });
      }

      // Update profile picture
      await sock.updateProfilePicture(sock.user.id, buffer);

      await sock.sendMessage(from, {
        text: "✅ Profile picture updated successfully! The image has been set to full size without cropping."
      }, { quoted: msg });

    } catch (error) {
      console.error('FullPP error:', error);
      await sock.sendMessage(from, {
        text: "❌ Failed to update profile picture. Please try again or check if the image is valid."
      }, { quoted: msg });
    }
  }
};
