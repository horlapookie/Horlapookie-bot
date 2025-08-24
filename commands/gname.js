
export default {
  name: 'gname',
  description: '✏️ Change group name',
  async execute(msg, { sock, args, settings }) {
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
          text: '❌ I need admin rights to change group name!'
        }, { quoted: msg });
      }

      if (!args[0]) {
        return await sock.sendMessage(from, {
          text: '❌ Please enter the new group name!\n\nUsage: ?gname <new name>'
        }, { quoted: msg });
      }

      const newName = args.join(' ');
      await sock.groupUpdateSubject(from, newName);

      await sock.sendMessage(from, {
        text: `✅ Group name updated to: *${newName}*`
      }, { quoted: msg });

    } catch (error) {
      await sock.sendMessage(from, {
        text: '❌ Error changing group name!'
      }, { quoted: msg });
    }
  }
};
