
import fs from 'fs';

const riddles = [
  {
    question: "What has keys but no locks, space but no room, and you can enter but not go inside?",
    answer: "keyboard",
    options: ["A) Computer", "B) Keyboard", "C) Piano", "D) House"]
  },
  {
    question: "I'm tall when I'm young, and short when I'm old. What am I?",
    answer: "candle",
    options: ["A) Tree", "B) Candle", "C) Person", "D) Building"]
  },
  {
    question: "What gets wet while drying?",
    answer: "towel",
    options: ["A) Towel", "B) Hair", "C) Clothes", "D) Soap"]
  },
  {
    question: "What has one eye but can't see?",
    answer: "needle",
    options: ["A) Cyclops", "B) Needle", "C) Camera", "D) Storm"]
  },
  {
    question: "What goes up but never comes down?",
    answer: "age",
    options: ["A) Balloon", "B) Age", "C) Airplane", "D) Smoke"]
  }
];

let activeRiddles = {};

export default {
  name: 'riddle',
  description: 'Start a riddle game. Answer with ?riddle A/B/C/D',
  async execute(msg, { sock, args }) {
    const from = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;

    if (args[0] && args[0].toUpperCase().match(/[ABCD]/)) {
      // Answer attempt
      const activeRiddle = activeRiddles[from];
      if (!activeRiddle) {
        return await sock.sendMessage(from, { text: "No active riddle. Start one with ?riddle" }, { quoted: msg });
      }

      const userAnswer = args[0].toUpperCase();
      const correctOption = activeRiddle.options.find(opt => 
        opt.toLowerCase().includes(activeRiddle.answer.toLowerCase())
      );
      const correctLetter = correctOption ? correctOption.charAt(0) : 'B';

      if (userAnswer === correctLetter) {
        delete activeRiddles[from];
        await sock.sendMessage(from, { 
          text: `🎉 Correct! The answer is ${activeRiddle.answer}!\n\nStart another riddle with ?riddle` 
        }, { quoted: msg });
      } else {
        await sock.sendMessage(from, { 
          text: `❌ Wrong! The correct answer was ${correctLetter}) ${activeRiddle.answer}\n\nTry another riddle with ?riddle` 
        }, { quoted: msg });
        delete activeRiddles[from];
      }
      return;
    }

    // Start new riddle
    const randomRiddle = riddles[Math.floor(Math.random() * riddles.length)];
    activeRiddles[from] = randomRiddle;

    const riddleText = `🧩 **RIDDLE TIME** 🧩\n\n${randomRiddle.question}\n\n${randomRiddle.options.join('\n')}\n\nAnswer with: ?riddle A/B/C/D`;

    await sock.sendMessage(from, { text: riddleText }, { quoted: msg });
  }
};
