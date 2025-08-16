export default {
  name: 'reactions',
  description: 'List all available reaction commands with emojis',
  async execute(msg, { sock }) {
    const reactionList = [
      { cmd: 'rslap', emoji: '👋', desc: 'Slap' },
      { cmd: 'rkiss', emoji: '😘', desc: 'Kiss' },
      { cmd: 'rkick', emoji: '🦵', desc: 'Kick' },
      { cmd: 'rpunch', emoji: '👊', desc: 'Punch' },
      { cmd: 'ryeet', emoji: '💨', desc: 'Yeet' },
      { cmd: 'ryeep', emoji: '🏃', desc: 'Yeep (run)' },
      { cmd: 'rhug', emoji: '🤗', desc: 'Hug' },
      { cmd: 'rcry', emoji: '😢', desc: 'Cry' },
      { cmd: 'rlaugh', emoji: '😂', desc: 'Laugh' },
      { cmd: 'rwink', emoji: '😉', desc: 'Wink' },
      { cmd: 'rangry', emoji: '😠', desc: 'Angry' },
      { cmd: 'rdance', emoji: '💃', desc: 'Dance' },
      { cmd: 'rfacepalm', emoji: '🤦', desc: 'Facepalm' },
      { cmd: 'rpoke', emoji: '👉', desc: 'Poke' },
      { cmd: 'rbite', emoji: '🦷', desc: 'Bite' },
      { cmd: 'rrun', emoji: '🏃‍♂️', desc: 'Run' },
      { cmd: 'rstare', emoji: '👀', desc: 'Stare' },
      { cmd: 'rshrug', emoji: '🤷', desc: 'Shrug' },
      { cmd: 'rsleepy', emoji: '😴', desc: 'Sleepy' },
      { cmd: 'rsmile', emoji: '😊', desc: 'Smile' },
      { cmd: 'rbored', emoji: '😐', desc: 'Bored' },
      { cmd: 'rcrylaugh', emoji: '🤣', desc: 'Cry Laugh' },
      { cmd: 'rblush', emoji: '😊', desc: 'Blush' },
      { cmd: 'rconfused', emoji: '😕', desc: 'Confused' },
      { cmd: 'rdepressed', emoji: '😞', desc: 'Depressed' },
      { cmd: 'rscared', emoji: '😱', desc: 'Scared' },
      { cmd: 'rshock', emoji: '😲', desc: 'Shock' },
      { cmd: 'rlove', emoji: '❤️', desc: 'Love' },
      { cmd: 'rfuck', emoji: '🤬', desc: 'F***' },
      { cmd: 'ryeey', emoji: '🙌', desc: 'Yeey' }
    ];

    let message = '🤖 *Available Reaction Commands:*\n\n';
    for (const r of reactionList) {
      message += `${r.emoji} *${r.cmd}* - ${r.desc}\n`;
    }

    await sock.sendMessage(msg.key.remoteJid, { text: message }, { quoted: msg });
  }
};
