const insults = [
  "You're as bright as a black hole, and twice as dense.",
  "You have something on your chin... no, the third one down.",
  "If I wanted to kill myself, I’d climb your ego and jump to your IQ.",
  "You’re the reason the gene pool needs a lifeguard.",
  "You bring everyone so much joy... when you leave the room.",
  "You’re like a cloud. When you disappear, it’s a beautiful day.",
  "You have something on your chin... no, the third one down.",
  "Your secrets are safe with me. I never even listen when you tell me them.",
  "You are proof that even evolution can take a step backwards.",
  "Brains aren’t everything. In your case, they’re nothing.",
  "You’re as useless as the 'ueue' in 'queue'.",
  "You’re the human version of a participation trophy.",
  "You have the right to remain silent because whatever you say will probably be stupid anyway.",
  "You’re like a software update. Whenever I see you, I think, 'Not now.'",
  "You bring everyone so much happiness... when you leave the room.",
  "You are as sharp as a marble.",
  "Your face makes onions cry.",
  "You are the reason they put directions on shampoo bottles.",
  "You’re as useless as a screen door on a submarine.",
  "You have something on your chin... no, the third one down."
];
export default {
  name: "insult",
  description: "Send a playful insult to a tagged user",
  async execute(msg, { sock }) {
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (mentioned.length === 0) {
      return await sock.sendMessage(msg.key.remoteJid, { text: "❌ Please tag someone to insult.\nExample: $insult @1234567890" }, { quoted: msg });
    }
    const insult = insults[Math.floor(Math.random() * insults.length)];
    const mention = mentioned[0];
    const replyText = `👊 Hey @${mention.split('@')[0]}, ${insult}`;
    await sock.sendMessage(msg.key.remoteJid, { text: replyText, mentions: [mention] }, { quoted: msg });
  },
};
