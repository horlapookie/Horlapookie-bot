import fs from 'fs';
import path from 'path';

const DATA_DIR = path.resolve('./data');
const TRIVIA_FILE = path.join(DATA_DIR, 'trivia.json');
const SCORES_FILE = path.join(DATA_DIR, 'scores.json');

function loadJSON(file) {
  if (!fs.existsSync(file)) return {};
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch {
    return {};
  }
}

function saveJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

export default {
  name: 'answer',
  description: 'Answer the current trivia question',
  async execute(msg, { sock, args }) {
    if (!args.length) {
      await sock.sendMessage(msg.key.remoteJid, { text: '❗ Please provide an answer.\nUsage: .answer your_answer' }, { quoted: msg });
      return;
    }

    const trivia = loadJSON(TRIVIA_FILE);
    const scores = loadJSON(SCORES_FILE);
    const user = msg.key.participant || msg.key.remoteJid;

    if (!trivia[user]) {
      await sock.sendMessage(msg.key.remoteJid, { text: '❌ You have no active trivia question. Use .trivia to start one.' }, { quoted: msg });
      return;
    }

    const userQuestion = trivia[user];
    const timePassed = Date.now() - userQuestion.askedAt;
    const oneMinute = 60 * 1000;

    if (timePassed > oneMinute) {
      delete trivia[user];
      saveJSON(TRIVIA_FILE, trivia);
      await sock.sendMessage(msg.key.remoteJid, { text: '⏰ Time is up! Use .trivia to get a new question.' }, { quoted: msg });
      return;
    }

    const userAnswer = args.join(' ').toLowerCase().trim();
    const correctAnswer = userQuestion.answer.toLowerCase().trim();

    if (userAnswer === correctAnswer) {
      scores[user] = (scores[user] || 0) + 1;
      delete trivia[user];
      saveJSON(TRIVIA_FILE, trivia);
      saveJSON(SCORES_FILE, scores);

      await sock.sendMessage(msg.key.remoteJid, {
        text: `✅ Correct! Well done.\nYour current score is *${scores[user]}* point(s).`,
      }, { quoted: msg });

    } else {
      // Deduct a chance
      trivia[user].chancesLeft -= 1;

      if (trivia[user].chancesLeft <= 0) {
        // No chances left, remove question
        delete trivia[user];
        saveJSON(TRIVIA_FILE, trivia);
        await sock.sendMessage(msg.key.remoteJid, {
          text: `❌ No chances left! The correct answer was *${userQuestion.answer}*.\nUse .trivia to try a new question.`,
        }, { quoted: msg });
      } else {
        // Save updated chances
        saveJSON(TRIVIA_FILE, trivia);
        await sock.sendMessage(msg.key.remoteJid, {
          text: `❌ Incorrect answer. You have *${trivia[user].chancesLeft}* chance(s) left. Try again!`,
        }, { quoted: msg });
      }
    }
  }
};
