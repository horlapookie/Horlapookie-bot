const reactions = {
  slap: [
    'https://media.giphy.com/media/Gf3AUz3eBNbTW/giphy.gif',
    'https://media.giphy.com/media/RXGNsyRb1hDJm/giphy.gif',
  ],
  kiss: [
    'https://media.giphy.com/media/FqBTvSNjNzeZG/giphy.gif',
    'https://media.giphy.com/media/bGm9FuBCGg4SY/giphy.gif',
  ],
  love: [
    'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',
    'https://media.giphy.com/media/od5H3PmEG5EVq/giphy.gif',
  ],
  punch: [
    'https://media.giphy.com/media/xT0GqssRweIhlz209i/giphy.gif',
    'https://media.giphy.com/media/11tTNkNy1SdXGg/giphy.gif',
  ],
  kick: [
    'https://media.giphy.com/media/3o6ZtpxSZbQRRnwCKQ/giphy.gif',
    'https://media.giphy.com/media/3o7aD2saalBwwftBIY/giphy.gif',
  ],
  yeet: [
    'https://media.giphy.com/media/qgQUggAC3Pfv687qPC/giphy.gif',
    'https://media.giphy.com/media/l46CkATpdyLwLI7vi/giphy.gif',
  ],
  yeep: [
    'https://media.giphy.com/media/1rNW4wi1Yq2Nq/giphy.gif',
  ],
  fuck: [
    'https://media.giphy.com/media/3o6gbbuLW76jkt8vIc/giphy.gif',
  ],
  hug: [
    'https://media.giphy.com/media/l2QDM9Jnim1YVILXa/giphy.gif',
    'https://media.giphy.com/media/xT9IgG50Fb7Mi0prBC/giphy.gif',
  ],
  cry: [
    'https://media.giphy.com/media/ROF8OQvDmxytW/giphy.gif',
  ],
  laugh: [
    'https://media.giphy.com/media/5GoVLqeAOo6PK/giphy.gif',
  ],
  dance: [
    'https://media.giphy.com/media/3o7aCTfyhYawdOXcFW/giphy.gif',
  ],
  wink: [
    'https://media.giphy.com/media/10SvWCbt1ytWCc/giphy.gif',
  ],
  bye: [
    'https://media.giphy.com/media/ASd0Ukj0y3qMM/giphy.gif',
  ],
  blush: [
    'https://media.giphy.com/media/WYdPvTNrL2xS8/giphy.gif',
  ],
  stare: [
    'https://media.giphy.com/media/3o6ZsZ6cd9vKr0v9sI/giphy.gif',
  ],
  facepalm: [
    'https://media.giphy.com/media/l3q2K5jinAlChoCLS/giphy.gif',
  ],
  shrug: [
    'https://media.giphy.com/media/l2JhLzM9zDTaVtJTG/giphy.gif',
  ],
  sleepy: [
    'https://media.giphy.com/media/3o6ozzTRdeJmKxvT4Q/giphy.gif',
  ],
  angry: [
    'https://media.giphy.com/media/9J7tdYltWyXIY/giphy.gif',
  ],
  confused: [
    'https://media.giphy.com/media/26BRv0ThflsHCqDrG/giphy.gif',
  ],
  bored: [
    'https://media.giphy.com/media/l41lFw057lAJQMwg0/giphy.gif',
  ],
  shocked: [
    'https://media.giphy.com/media/3o6gbbuLW76jkt8vIc/giphy.gif',
  ],
  bored: [
    'https://media.giphy.com/media/13HgwGsXF0aiGY/giphy.gif',
  ],
  tired: [
    'https://media.giphy.com/media/l4JyOCNEfXvVYEqB2/giphy.gif',
  ],
  excited: [
    'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',
  ],
  party: [
    'https://media.giphy.com/media/3o7aD6pYxN2lLe5I3W/giphy.gif',
  ],
  coffee: [
    'https://media.giphy.com/media/26uTt19rwGqH8N0Ok/giphy.gif',
  ],
  shocked: [
    'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',
  ],
  kiss2: [ // alternate kiss reaction
    'https://media.giphy.com/media/3o6ZtpxSZbQRRnwCKQ/giphy.gif'
  ],
};

export default {
  name: 'reaction',
  description: 'Send reaction gifs like slap, kiss, love, punch, etc. Usage: $r<reaction> @user or reply',
  async execute(msg, { sock }) {
    try {
      const fullCmd = msg.message.conversation || 
                      msg.message.extendedTextMessage?.text || '';
      const args = fullCmd.trim().split(/\s+/);

      // command is like rslap, rkiss, etc.
      const cmd = args[0].toLowerCase();

      if (!cmd.startsWith('r')) {
        return; // not a reaction command
      }

      const reactionName = cmd.slice(1); // remove 'r' prefix

      if (!reactions[reactionName]) {
        return sock.sendMessage(msg.key.remoteJid, {
          text: `❌ Unknown reaction: ${reactionName}\nUse $reactions to see all.`,
        }, { quoted: msg });
      }

      // get mentioned user or replied user
      let targetJid = null;
      const context = msg.message.extendedTextMessage?.contextInfo;

      if (context?.mentionedJid && context.mentionedJid.length > 0) {
        targetJid = context.mentionedJid[0];
      } else if (context?.quotedMessage) {
        targetJid = context.participant || msg.key.remoteJid;
      }

      if (!targetJid) {
        return sock.sendMessage(msg.key.remoteJid, {
          text: `❗ Please tag or reply to a user to react.`,
        }, { quoted: msg });
      }

      const senderJid = msg.key.participant || msg.key.remoteJid;

      // Pick a random GIF for the reaction
      const gifList = reactions[reactionName];
      const gif = gifList[Math.floor(Math.random() * gifList.length)];

      const textResponse = `*${senderJid.split('@')[0]}* reacted with *${reactionName}* to *${targetJid.split('@')[0]}*`;

      await sock.sendMessage(msg.key.remoteJid, {
        image: { url: gif },
        caption: textResponse,
        mentions: [senderJid, targetJid],
      }, { quoted: msg });

    } catch (e) {
      console.error('Reaction command error:', e);
    }
  }
};
