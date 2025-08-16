import fs from 'fs';
import path from 'path';

const wordsFile = path.join(process.cwd(), 'words.txt');
const dataFile = path.join(process.cwd(), 'data/hangmanData.json');

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

      await sock.sendMessage(from, {
        text: `\`\`\`${renderHangman(userData.wrongGuesses)}\`\`\`\n${userData.revealed.join(' ')}\nWrong guesses: ${userData.wrongGuesses}\nGuessed letters: ${userData.guessed.join(', ')}\nGuess a letter with \`$hangman guess <letter>\``
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