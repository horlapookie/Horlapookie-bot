export default {
  name: "roll",
  description: "Roll a dice with customizable sides",
  async execute(msg, { sock, args }) {
    let sides = 6; // Default dice sides
    if (args.length > 0) {
      const parsed = parseInt(args[0], 10);
      if (!isNaN(parsed) && parsed > 1 && parsed <= 1000) {
        sides = parsed;
      } else {
        return await sock.sendMessage(msg.key.remoteJid, { text: "❌ Please provide a valid number between 2 and 1000.\nExample: $roll 20" }, { quoted: msg });
      }
    }
    const roll = Math.floor(Math.random() * sides) + 1;
    await sock.sendMessage(msg.key.remoteJid, { text: `🎲 You rolled a *${roll}* on a ${sides}-sided dice.` }, { quoted: msg });
  },
};
