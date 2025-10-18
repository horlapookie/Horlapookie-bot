import fs from 'fs';
import path from 'path';

const wordsFile = path.join(process.cwd(), 'words.txt');
const dataFile = path.join(process.cwd(), 'data/hangmanData.json');

const hangmanImages = [
  'https://telegra.ph/file/7c4f66a5cd140a8b0b88f.png', // Base
  'https://telegra.ph/file/8e1c4e85d5b76c3ad8e4c.png', // Head
  'https://telegra.ph/file/4f8b7c6e9d5e8b3c2a1d6.png', // Body
  'https://telegra.ph/file/6b9c8f7e2a4d5c8b1e3f9.png', // Arm 1
  'https://telegra.ph/file/9e2f6b8c5a7d4e1c8b6f3.png', // Arm 2
  'https://telegra.ph/file/2c8e5b9f6a3d7c4e1b8f6.png', // Legs
  'https://telegra.ph/file/5f7c9e2b8a4d6c1e3b9f7.png', // Dead
];


// Load words from words.txt
function getRandomWord() {
  const words = fs.readFileSync(wordsFile, 'utf-8').split('\n').map(w => w.trim()).filter(Boolean);
  return words[Math.floor(Math.random() * words.length)].toLowerCase();
}

// Load or initialize user data
function loadData() {
  if (!fs.existsSync(dataFile)) return {};
  return JSON.parse(fs.readFileSync(dataFile));
}

function saveData(data) {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

function renderHangman(wrongGuesses) {
  const stages = [
    '',
    '😵',
    '😵👕',
    '😵👕👖',
    '😵👕👖🦶',
    '💀👕👖🦶',
  ];
  return stages[wrongGuesses] || stages[stages.length - 1];
}

export default {
  name: 'hangman',
  description: 'Play hangman game',
  async execute(msg, { sock, args }) {
    const from = msg.key.remoteJid;
    const sender = (msg.key.participant || msg.key.remoteJid).split('@')[0];
    let data = loadData();

    if (!data[sender]) {
      data[sender] = {
        word: '',
        guessed: [],
        wrongGuesses: 0,
        wins: 0,
        losses: 0,
        revealed: [],
      };
    }

    const userData = data[sender];

    if (args.length === 0) {
      await sock.sendMessage(from, { text: 'Use `$hangman start` to start a game, `$hangman guess <letter>` to guess, `$hangman data` to see your stats.' }, { quoted: msg });
      return;
    }

    const cmd = args[0].toLowerCase();

    if (cmd === 'start') {
      if (userData.word && userData.wrongGuesses < 5 && userData.revealed.includes('_')) {
        await sock.sendMessage(from, { text: 'You already have a game in progress. Use `$hangman guess <letter>` to continue.' }, { quoted: msg });
        return;
      }

      userData.word = getRandomWord();
      userData.guessed = [];
      userData.wrongGuesses = 0;
      userData.revealed = Array(userData.word.length).fill('_');

      saveData(data);

      await sock.sendMessage(from, { text: `🎮 Hangman started!\n${userData.revealed.join(' ')}\nGuess a letter with \`$hangman guess <letter>\`` }, { quoted: msg });
      return;
    }

    if (cmd === 'guess') {
      if (!userData.word) {
        await sock.sendMessage(from, { text: 'No active game. Start one with `$hangman start`.' }, { quoted: msg });
        return;
      }
      if (args.length < 2) {
        await sock.sendMessage(from, { text: 'Please guess a letter: `$hangman guess <letter>`' }, { quoted: msg });
        return;
      }

      const letter = args[1].toLowerCase();
      if (!letter.match(/^[a-z]$/)) {
        await sock.sendMessage(from, { text: 'Please guess a valid single letter.' }, { quoted: msg });
        return;
      }
      if (userData.guessed.includes(letter)) {
        await sock.sendMessage(from, { text: `You already guessed "${letter}". Try another letter.` }, { quoted: msg });
        return;
      }

      userData.guessed.push(letter);

      if (userData.word.includes(letter)) {
        for (let i = 0; i < userData.word.length; i++) {
          if (userData.word[i] === letter) {
            userData.revealed[i] = letter;
          }
        }
      } else {
        userData.wrongGuesses++;
      }

      if (!userData.revealed.includes('_')) {
        userData.wins++;
        const wonWord = userData.word;
        userData.word = '';
        userData.guessed = [];
        userData.wrongGuesses = 0;
        userData.revealed = [];

        saveData(data);
        await sock.sendMessage(from, { text: `🎉 Congratulations! You guessed the word: *${wonWord}*\nWins: ${userData.wins}\nLosses: ${userData.losses}` }, { quoted: msg });
        return;
      }

      if (userData.wrongGuesses >= 5) {
        userData.losses++;
        const lostWord = userData.word;
        userData.word = '';
        userData.guessed = [];
        userData.wrongGuesses = 0;
        userData.revealed = [];

        saveData(data);
        await sock.sendMessage(from, { text: `☠️ You are hanged! The word was: *${lostWord}*\nLosses: ${userData.losses}\nWins: ${userData.wins}` }, { quoted: msg });
        return;
      }

      saveData(data);

      const displayWord = userData.revealed.join(' ');
      const guessedLetters = userData.guessed;
      const wrongGuesses = userData.wrongGuesses;
      
      const hangmanArt = [
        '```\n  +---+\n  |   |\n      |\n      |\n      |\n      |\n=========\n```',
        '```\n  +---+\n  |   |\n  O   |\n      |\n      |\n      |\n=========\n```',
        '```\n  +---+\n  |   |\n  O   |\n  |   |\n      |\n      |\n=========\n```',
        '```\n  +---+\n  |   |\n  O   |\n /|   |\n      |\n      |\n=========\n```',
        '```\n  +---+\n  |   |\n  O   |\n /|\\  |\n      |\n      |\n=========\n```',
        '```\n  +---+\n  |   |\n  O   |\n /|\\  |\n /    |\n      |\n=========\n```',
        '```\n  +---+\n  |   |\n  O   |\n /|\\  |\n / \\  |\n      |\n=========\n```'
      ];
      
      const gameText = `🎮 *HANGMAN GAME* 🎮

${hangmanArt[wrongGuesses]}

*Word:* ${displayWord}
*Guessed:* ${guessedLetters.join(', ') || 'None'}
*Wrong guesses:* ${wrongGuesses}/6

Guess a letter with: \`?hangman guess <letter>\``;

      await sock.sendMessage(from, {
        text: gameText
      }, { quoted: msg });

      return;
    }

    if (cmd === 'data') {
      await sock.sendMessage(from, {
        text: `📊 Your Hangman stats:\nWins: ${userData.wins}\nLosses: ${userData.losses}`
      }, { quoted: msg });
      return;
    }

    await sock.sendMessage(from, { text: 'Unknown hangman command. Use start, guess, or data.' }, { quoted: msg });
  }
};