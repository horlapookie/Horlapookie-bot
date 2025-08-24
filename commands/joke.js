const jokes = [
  "Why don’t scientists trust atoms? Because they make up everything!",
  "Why did the chicken join a band? Because it had the drumsticks!",
  "Why don’t programmers like nature? It has too many bugs.",
  "What do you call fake spaghetti? An impasta!",
  "Why was the math book sad? Because it had too many problems.",
  "Why did the scarecrow win an award? Because he was outstanding in his field!",
  "Why don’t some couples go to the gym? Because some relationships don’t work out.",
  "Why do bees have sticky hair? Because they use a honeycomb!",
  "What do you call cheese that isn't yours? Nacho cheese.",
  "Why did the coffee file a police report? It got mugged.",
  "Why was the stadium so cool? It was filled with fans.",
  "What did one ocean say to the other ocean? Nothing, they just waved.",
  "Why don’t skeletons fight each other? They don’t have the guts.",
  "What do you call an alligator in a vest? An investigator.",
  "Why did the bicycle fall over? Because it was two-tired!",
  "Why can’t your nose be 12 inches long? Because then it would be a foot.",
  "What do you call a snowman with a six-pack? An abdominal snowman.",
  "Why did the golfer bring two pairs of pants? In case he got a hole in one.",
  "What’s orange and sounds like a parrot? A carrot.",
  "Why did the tomato turn red? Because it saw the salad dressing!",
];

export default {
  name: "joke",
  execute: async (msg, { sock }) => {
    const jid = msg.key.remoteJid;
    const joke = jokes[Math.floor(Math.random() * jokes.length)];
    await sock.sendMessage(jid, { text: "😂 Here's a joke for you:\n\n" + joke }, { quoted: msg });
  },
};
