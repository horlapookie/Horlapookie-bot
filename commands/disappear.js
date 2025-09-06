
export default [
  {
    name: 'disap',
    description: 'Show disappearing messages options',
    category: 'Group',
    async execute(msg, { sock, args }) {
      const from = msg.key.remoteJid;
      const isGroup = from.endsWith('@g.us');

      if (!isGroup) {
        return await sock.sendMessage(from, {
          text: "❌ This command works in groups only"
        }, { quoted: msg });
      }

      try {
        const groupMeta = await sock.groupMetadata(from);
        const botIsAdmin = groupMeta.participants.find(p => p.id === sock.user.id && p.admin);
        
        if (!botIsAdmin) {
          return await sock.sendMessage(from, {
            text: "❌ Bot needs to be admin to manage disappearing messages!"
          }, { quoted: msg });
        }

        const senderIsAdmin = groupMeta.participants.find(p => p.id === msg.key.participant && p.admin);
        
        if (!senderIsAdmin) {
          return await sock.sendMessage(from, {
            text: "❌ You are not an admin here!"
          }, { quoted: msg });
        }

        await sock.sendMessage(from, {
          text: "*Do you want to turn on disappearing messages?*\n\nType one of the following:\n*disap1* for 1 day\n*disap7* for 7 days\n*disap90* for 90 days\nOr type *disap-off* to turn it off."
        }, { quoted: msg });

      } catch (error) {
        await sock.sendMessage(from, {
          text: "❌ Error: " + error.message
        }, { quoted: msg });
      }
    }
  },
  {
    name: 'disap1',
    description: 'Enable disappearing messages for 1 day',
    category: 'Group',
    async execute(msg, { sock, args }) {
      await handleDisapCommand(msg, sock, 86400);
    }
  },
  {
    name: 'disap7',
    description: 'Enable disappearing messages for 7 days',
    category: 'Group',
    async execute(msg, { sock, args }) {
      await handleDisapCommand(msg, sock, 604800);
    }
  },
  {
    name: 'disap90',
    description: 'Enable disappearing messages for 90 days',
    category: 'Group',
    async execute(msg, { sock, args }) {
      await handleDisapCommand(msg, sock, 7776000);
    }
  },
  {
    name: 'disap-off',
    description: 'Disable disappearing messages',
    category: 'Group',
    async execute(msg, { sock, args }) {
      await handleDisapCommand(msg, sock, 0);
    }
  }
];

async function handleDisapCommand(msg, sock, duration) {
  const from = msg.key.remoteJid;
  const isGroup = from.endsWith('@g.us');

  if (!isGroup) {
    return await sock.sendMessage(from, {
      text: "❌ This command works in groups only"
    }, { quoted: msg });
  }

  try {
    const groupMeta = await sock.groupMetadata(from);
    const botIsAdmin = groupMeta.participants.find(p => p.id === sock.user.id && p.admin);
    
    if (!botIsAdmin) {
      return await sock.sendMessage(from, {
        text: "❌ Bot needs to be admin to manage disappearing messages!"
      }, { quoted: msg });
    }

    const senderIsAdmin = groupMeta.participants.find(p => p.id === msg.key.participant && p.admin);
    
    if (!senderIsAdmin) {
      return await sock.sendMessage(from, {
        text: "❌ You are not an admin here!"
      }, { quoted: msg });
    }

    await sock.groupToggleEphemeral(from, duration);
    
    if (duration === 0) {
      await sock.sendMessage(from, {
        text: "✅ Disappearing messages successfully turned off!"
      }, { quoted: msg });
    } else {
      const days = duration / 86400;
      await sock.sendMessage(from, {
        text: `✅ Disappearing messages successfully turned on for ${days} day(s)!`
      }, { quoted: msg });
    }

  } catch (error) {
    await sock.sendMessage(from, {
      text: "❌ Error: " + error.message
    }, { quoted: msg });
  }
}
