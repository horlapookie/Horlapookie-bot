
export default [
  {
    name: 'req',
    description: 'Show pending join requests',
    aliases: ['requests'],
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
            text: "❌ Bot needs to be admin to manage join requests!"
          }, { quoted: msg });
        }

        const senderIsAdmin = groupMeta.participants.find(p => p.id === msg.key.participant && p.admin);
        
        if (!senderIsAdmin) {
          return await sock.sendMessage(from, {
            text: "❌ You are not an admin here!"
          }, { quoted: msg });
        }

        const pendingRequests = await sock.groupRequestParticipantsList(from);
        
        if (pendingRequests.length === 0) {
          return await sock.sendMessage(from, {
            text: "✅ There are no pending join requests."
          }, { quoted: msg });
        }

        let requestList = pendingRequests.map(request => '+' + request.jid.split('@')[0]).join("\n");
        
        await sock.sendMessage(from, {
          text: `📋 **Pending Join Requests** 🕓\n\n${requestList}\n\n💡 Use *approve* or *reject* to manage these requests.`
        }, { quoted: msg });

      } catch (error) {
        await sock.sendMessage(from, {
          text: "❌ Error: " + error.message
        }, { quoted: msg });
      }
    }
  },
  {
    name: 'approve',
    description: 'Approve all pending join requests',
    category: 'Group',
    async execute(msg, { sock, args }) {
      await handleRequestCommand(msg, sock, 'approve');
    }
  },
  {
    name: 'reject',
    description: 'Reject all pending join requests',
    category: 'Group',
    async execute(msg, { sock, args }) {
      await handleRequestCommand(msg, sock, 'reject');
    }
  }
];

async function handleRequestCommand(msg, sock, action) {
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
        text: "❌ Bot needs to be admin to manage join requests!"
      }, { quoted: msg });
    }

    const senderIsAdmin = groupMeta.participants.find(p => p.id === msg.key.participant && p.admin);
    
    if (!senderIsAdmin) {
      return await sock.sendMessage(from, {
        text: "❌ You are not an admin here!"
      }, { quoted: msg });
    }

    const pendingRequests = await sock.groupRequestParticipantsList(from);
    
    if (pendingRequests.length === 0) {
      return await sock.sendMessage(from, {
        text: "✅ There are no pending join requests for this group."
      }, { quoted: msg });
    }

    for (const request of pendingRequests) {
      await sock.groupRequestParticipantsUpdate(from, [request.jid], action);
    }

    await sock.sendMessage(from, {
      text: `✅ All pending join requests have been ${action === 'approve' ? 'approved' : 'rejected'}.`
    }, { quoted: msg });

  } catch (error) {
    await sock.sendMessage(from, {
      text: "❌ Error: " + error.message
    }, { quoted: msg });
  }
}
