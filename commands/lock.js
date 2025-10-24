
export default {
  name: 'lock',
  description: 'Lock or unlock the group chat (admin only)',
  adminOnly: true,
  execute: async (msg, { sock, args }) => {
    const jid = msg.key.remoteJid;
    if (!jid.endsWith('@g.us')) {
      return await sock.sendMessage(jid, { text: '❌ This command works only in groups.' });
    }

    if (!args[0] || !['lock', 'unlock'].includes(args[0].toLowerCase())) {
      return await sock.sendMessage(jid, { text: 'Usage: $lock lock | $lock unlock' });
    }

    const locked = args[0].toLowerCase() === 'lock';

    try {
      await sock.groupSettingUpdate(jid, locked ? 'announcement' : 'not_announcement');
      await sock.sendMessage(jid, { text: `🔒 Group is now ${locked ? 'locked (only admins can send messages)' : 'unlocked (everyone can send messages)'}.` });
    } catch (err) {
      await sock.sendMessage(jid, { text: `❌ Failed to update group settings: ${err.message}` });
    }
  }
};
