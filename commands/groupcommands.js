
import fs from 'fs';
import path from 'path';

export default {
  name: 'groupcommands',
  description: 'Group management commands collection',
  async execute(msg, { sock, args, settings }) {
    // This file contains multiple group commands
    // Individual commands will be loaded separately
  }
};

// Export individual commands for group management
export const warn = {
  name: 'warn',
  description: '⚠️ Warn group members',
  async execute(msg, { sock, args }) {
    const from = msg.key.remoteJid;
    
    if (!msg.key.remoteJid.endsWith('@g.us')) {
      return await sock.sendMessage(from, {
        text: '❌ This is a group command only!'
      }, { quoted: msg });
    }

    // Get group metadata to check admin status
    try {
      const groupMetadata = await sock.groupMetadata(from);
      const participants = groupMetadata.participants;
      const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
      const senderNumber = msg.key.participant || msg.key.remoteJid;
      
      const botAdmin = participants.find(p => p.id === botNumber)?.admin;
      const senderAdmin = participants.find(p => p.id === senderNumber)?.admin;

      if (!senderAdmin) {
        return await sock.sendMessage(from, {
          text: '❌ You are not an admin!'
        }, { quoted: msg });
      }

      if (!botAdmin) {
        return await sock.sendMessage(from, {
          text: '❌ I need admin rights to warn members!'
        }, { quoted: msg });
      }

      // Check if replying to a message
      if (!msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
        return await sock.sendMessage(from, {
          text: '❌ Please reply to a user\'s message to warn them!\n\nUsage: Reply to message + ?warn'
        }, { quoted: msg });
      }

      const targetUser = msg.message.extendedTextMessage.contextInfo.participant;
      
      await sock.sendMessage(from, {
        text: `⚠️ *Warning Issued*\n\n👤 User: @${targetUser.split('@')[0]}\n📝 Reason: ${args.join(' ') || 'No reason provided'}\n⏰ Time: ${new Date().toLocaleString()}\n\n*Please follow group rules!*`,
        mentions: [targetUser]
      }, { quoted: msg });

    } catch (error) {
      await sock.sendMessage(from, {
        text: '❌ Error issuing warning. Please try again.'
      }, { quoted: msg });
    }
  }
};

export const getallmembers = {
  name: 'getallmembers',
  description: '📋 Get list of all group members',
  async execute(msg, { sock }) {
    const from = msg.key.remoteJid;
    
    if (!msg.key.remoteJid.endsWith('@g.us')) {
      return await sock.sendMessage(from, {
        text: '❌ This is a group command only!'
      }, { quoted: msg });
    }

    try {
      const groupMetadata = await sock.groupMetadata(from);
      const participants = groupMetadata.participants;
      const senderNumber = msg.key.participant || msg.key.remoteJid;
      
      const senderAdmin = participants.find(p => p.id === senderNumber)?.admin;

      if (!senderAdmin) {
        return await sock.sendMessage(from, {
          text: '❌ Command reserved for admins!'
        }, { quoted: msg });
      }

      let membersList = `🌟 *GROUP MEMBERS LIST* 🌟\n\n`;
      membersList += `👥 *Group:* ${groupMetadata.subject}\n`;
      membersList += `📊 *Total Members:* ${participants.length}\n\n`;
      membersList += `┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n\n`;

      const emojis = ['💡', '☢️', '🗡️', '🖌️', '🪫', '🔋', '⚙️', '🕶️', '🌡️', '✏️', '📌', '©️'];
      
      participants.forEach((member, index) => {
        const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
        const role = member.admin ? (member.admin === 'superadmin' ? '👑 Owner' : '⭐ Admin') : '👤 Member';
        membersList += `${index + 1}. ${randomEmoji} @${member.id.split('@')[0]} (${role})\n`;
      });

      membersList += `\n*© HORLA POOKIE Bot*`;

      await sock.sendMessage(from, {
        text: membersList,
        mentions: participants.map(p => p.id)
      }, { quoted: msg });

    } catch (error) {
      await sock.sendMessage(from, {
        text: '❌ Error getting group members!'
      }, { quoted: msg });
    }
  }
};

export const grouplink = {
  name: 'link',
  description: '🔗 Get group invite link',
  async execute(msg, { sock }) {
    const from = msg.key.remoteJid;
    
    if (!msg.key.remoteJid.endsWith('@g.us')) {
      return await sock.sendMessage(from, {
        text: '❌ This is a group command only!'
      }, { quoted: msg });
    }

    try {
      const groupMetadata = await sock.groupMetadata(from);
      const participants = groupMetadata.participants;
      const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
      const senderNumber = msg.key.participant || msg.key.remoteJid;
      
      const botAdmin = participants.find(p => p.id === botNumber)?.admin;
      const senderAdmin = participants.find(p => p.id === senderNumber)?.admin;

      if (!senderAdmin) {
        return await sock.sendMessage(from, {
          text: '❌ You are not an admin!'
        }, { quoted: msg });
      }

      if (!botAdmin) {
        return await sock.sendMessage(from, {
          text: '❌ I need admin rights to get group link!'
        }, { quoted: msg });
      }

      const inviteCode = await sock.groupInviteCode(from);
      const inviteLink = `https://chat.whatsapp.com/${inviteCode}`;

      await sock.sendMessage(from, {
        text: `🔗 *Group Invite Link*\n\n👥 *Group:* ${groupMetadata.subject}\n🔗 *Link:* ${inviteLink}\n\n⚠️ *Warning:* Share responsibly!\n\n*© HORLA POOKIE Bot*`
      }, { quoted: msg });

    } catch (error) {
      await sock.sendMessage(from, {
        text: '❌ Error getting group link. Make sure I have admin rights!'
      }, { quoted: msg });
    }
  }
};
