import fs from 'fs';
import path from 'path';

const DATA_DIR = path.resolve('./data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

const TRIVIA_FILE = path.join(DATA_DIR, 'trivia_data.json');
const SCORES_FILE = path.join(DATA_DIR, 'scores.json');

const triviaQuestions = [
  { question: "What is the capital city of Australia?", answer: "Canberra" },
  { question: "Which planet is known as the Red Planet?", answer: "Mars" },
  { question: "What year did the Titanic sink?", answer: "1912" },
  { question: "Who wrote the play 'Romeo and Juliet'?", answer: "William Shakespeare" },
  { question: "What is the largest mammal in the world?", answer: "Blue whale" },
  { question: "In what country would you find the ancient city of Petra?", answer: "Jordan" },
  { question: "Which element has the chemical symbol 'O'?", answer: "Oxygen" },
  { question: "Who painted the Mona Lisa?", answer: "Leonardo da Vinci" },
  { question: "What is the hardest natural substance on Earth?", answer: "Diamond" },
  { question: "Which ocean is the largest on Earth?", answer: "Pacific Ocean" },
];

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
  name: 'trivia',
  description: 'Ask a trivia question. You have 1 minute and 3 chances to answer!',
  async execute(msg, { sock }) {
    const trivia = loadJSON(TRIVIA_FILE);
    const user = msg.key.participant || msg.key.remoteJid;

    if (trivia[user]) {
      await sock.sendMessage(msg.key.remoteJid, {
        text: '❗ You already have an active trivia question. Use $answer to respond.',
      }, { quoted: msg });
      return;
    }

    const randomQ = triviaQuestions[Math.floor(Math.random() * triviaQuestions.length)];

    // Save question, answer, timestamp, and chances (3)
    trivia[user] = {
      question: randomQ.question,
      answer: randomQ.answer,
      askedAt: Date.now(),
      chancesLeft: 3,
    };
    saveJSON(TRIVIA_FILE, trivia);

    await sock.sendMessage(msg.key.remoteJid, {
      text: `🧠 *Trivia Time!*\n\n*Question:* ${randomQ.question}\n\nYou have 1 minute and 3 chances to answer.\nUse *$answer your_answer*`,
    }, { quoted: msg });
  },
};