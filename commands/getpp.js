import axios from "axios";
import fs from 'fs';
import path from 'path';
import { horla } from '../lib/horla.js';

// Load emojis
const emojisPath = path.join(process.cwd(), 'data', 'emojis.json');
const emojis = JSON.parse(fs.readFileSync(emojisPath, 'utf8'));

export default horla({
    nomCom: "getpp",
    aliases: ["profilepic", "pp", "avatar"],
    categorie: "User",
    reaction: "📸"
  }, async (msg, { sock, args }) => {
    try {
      const jid = msg.key.remoteJid;
      const senderJid = msg.key.participant || msg.key.remoteJid;
      let targetJid = senderJid; // Default to sender
      let isTargetingSelf = true;

      // React with processing emoji
      await sock.sendMessage(jid, {
        react: { text: emojis.processing, key: msg.key }
      });

      // Check if user mentioned someone
      if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
        targetJid = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
        isTargetingSelf = false;
      }
      // Check if user replied to someone's message
      else if (msg.message?.extendedTextMessage?.contextInfo?.participant) {
        targetJid = msg.message.extendedTextMessage.contextInfo.participant;
        isTargetingSelf = false;
      }
      // Check for quoted message (another way to handle replies)
      else if (msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
        const quotedParticipant = msg.message.extendedTextMessage.contextInfo.participant;
        if (quotedParticipant) {
          targetJid = quotedParticipant;
          isTargetingSelf = false;
        }
      }

      console.log("Target JID:", targetJid);
      console.log("Is targeting self:", isTargetingSelf);

      const targetNumber = targetJid.split('@')[0];

      // Get profile picture
      let profilePicUrl;
      try {
        profilePicUrl = await sock.profilePictureUrl(targetJid, "image");
      } catch (error) {
        console.log("No profile picture found:", error.message);
        profilePicUrl = null;
      }

      // Get user's status/bio
      let userBio = "Not available";
      try {
        const statusObj = await sock.fetchStatus(targetJid);
        if (statusObj && statusObj.status) {
          userBio = statusObj.status;
        }
      } catch (error) {
        console.log("Failed to get user status:", error.message);
      }

      // Get contact info with better methods
      let contactName = "Unknown";
      let isOnWhatsApp = false;

      try {
        // First try to get from WhatsApp verification
        const contact = await sock.onWhatsApp(targetJid);
        if (contact && contact[0]) {
          isOnWhatsApp = contact[0].exists || false;
          if (contact[0].notify) contactName = contact[0].notify;
        }

        // If in a group, try to get participant info
        if (jid.endsWith("@g.us")) {
          try {
            const groupMetadata = await sock.groupMetadata(jid);
            const participant = groupMetadata.participants.find(p => p.id === targetJid);
            if (participant) {
              // Try to get name from participant data
              if (participant.notify) {
                contactName = participant.notify;
              }
            }
          } catch (groupError) {
            console.log("Failed to get group participant info:", groupError.message);
          }
        }

        // If we're getting info for the sender (self)
        if (isTargetingSelf && msg.pushName) {
          contactName = msg.pushName;
        }

        // If still unknown and we have pushName for the target
        if (contactName === "Unknown") {
          // For replies/mentions, try to extract name from message context
          if (!isTargetingSelf) {
            // Try to get the quoted message's pushName if available
            const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            if (quotedMsg && msg.message.extendedTextMessage.contextInfo.participant === targetJid) {
              // Look for pushName in the quoted context
              contactName = `User${targetNumber.slice(-4)}`;
            }
          } else {
            contactName = msg.pushName || `User${targetNumber.slice(-4)}`;
          }
        }

      } catch (error) {
        console.log("Failed to get contact info:", error.message);

        // Final fallback
        if (isTargetingSelf) {
          contactName = msg.pushName || `User${targetNumber.slice(-4)}`;
        } else {
          contactName = `User${targetNumber.slice(-4)}`;
        }
      }

      // Build info text
      let infoText = `${emojis.info} *User Profile Information*\n\n`;
      infoText += `📱 *Number:* wa.me/${targetNumber}\n`;
      infoText += `📛 *Name:* ${contactName}\n`;
      infoText += `📝 *Bio:* ${userBio}\n`;
      infoText += `✅ *On WhatsApp:* ${isOnWhatsApp ? 'Yes' : 'No'}\n\n`;
      infoText += `*Powered by HORLA POOKIE Bot*`;

      if (!profilePicUrl) {
        await sock.sendMessage(jid, {
          text: `${emojis.warning} *No profile picture found.*\n\n${infoText}`,
        }, { quoted: msg });

        // React with warning emoji
        await sock.sendMessage(jid, {
          react: { text: emojis.warning, key: msg.key }
        });
        return;
      }

      // Fetch profile picture
      let response;
      try {
        response = await axios.get(profilePicUrl, { responseType: "arraybuffer" });
      } catch (axiosError) {
        console.error("Failed to fetch profile picture:", axiosError.message);
        const senderName = msg.pushName || "User";
        return await sock.sendMessage(
          jid,
          { text: `${emojis.error} *Failed to fetch profile picture, ${senderName}.*\n\n${infoText}` },
          { quoted: msg }
        );
      }

      const buffer = Buffer.from(response.data);

      // Send profile picture with info
      await sock.sendMessage(jid, {
        image: buffer,
        caption: `${emojis.success} *Profile Picture for ${contactName} Fetched Successfully!*\n\n${infoText}`,
        mentions: [targetJid]
      }, { quoted: msg });

      // React with success emoji
      await sock.sendMessage(jid, {
        react: { text: emojis.success, key: msg.key }
      });

    } catch (err) {
      console.error("General error in getpp command:", err);
      const senderName = msg.pushName || "User";
      await sock.sendMessage(msg.key.remoteJid, {
        text: `${emojis.error} *Error, ${senderName}:* ${err.message}`,
      }, { quoted: msg });

      // React with error emoji
      await sock.sendMessage(msg.key.remoteJid, {
        react: { text: emojis.error, key: msg.key }
      });
    }
  });