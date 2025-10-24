const quotes = [
  "The best way to get started is to quit talking and begin doing. – Walt Disney",
  "Don't let yesterday take up too much of today. – Will Rogers",
  "It's not whether you get knocked down, it's whether you get up. – Vince Lombardi",
  "If you are working on something exciting, it will keep you motivated. – Unknown",
  "Success is not in what you have, but who you are. – Bo Bennett",
  "Your limitation—it's only your imagination.",
  "Push yourself, because no one else is going to do it for you.",
  "Sometimes later becomes never. Do it now.",
  "Great things never come from comfort zones.",
  "Dream it. Wish it. Do it.",
  "Stay focused and never give up.",
  "Hard work beats talent when talent doesn’t work hard.",
  "Don’t watch the clock; do what it does. Keep going. – Sam Levenson",
  "Success usually comes to those who are too busy to be looking for it. – Henry David Thoreau",
  "Don’t be afraid to give up the good to go for the great. – John D. Rockefeller",
  "I find that the harder I work, the more luck I seem to have. – Thomas Jefferson",
  "Success is not the key to happiness. Happiness is the key to success. – Albert Schweitzer",
  "Motivation is what gets you started. Habit is what keeps you going.",
  "Believe you can and you're halfway there. – Theodore Roosevelt",
  "Act as if what you do makes a difference. It does. – William James",
  "What you get by achieving your goals is not as important as what you become by achieving your goals. – Zig Ziglar",
  "The harder the battle, the sweeter the victory.",
  "Don’t limit your challenges, challenge your limits.",
  "It always seems impossible until it’s done. – Nelson Mandela",
  "The secret of getting ahead is getting started. – Mark Twain",
  "Keep your eyes on the stars, and your feet on the ground. – Theodore Roosevelt",
  "The future belongs to those who believe in the beauty of their dreams. – Eleanor Roosevelt",
  "You are never too old to set another goal or to dream a new dream. – C.S. Lewis",
  "If you want to achieve greatness stop asking for permission.",
  "Dream bigger. Do bigger.",
  "Little things make big days.",
];

export default {
  name: "quote",
  execute: async (msg, { sock }) => {
    const jid = msg.key.remoteJid;
    const quote = quotes[Math.floor(Math.random() * quotes.length)];
    await sock.sendMessage(jid, { text: "💡 Here's a quote for you:\n\n" + quote }, { quoted: msg });
  },
};
