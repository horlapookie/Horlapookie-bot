import fs from 'fs';
import path from 'path';

const DATA_DIR = path.resolve('./data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

const QUIZ_FILE = path.join(DATA_DIR, 'quiz.json');
const QUIZ_SCORES_FILE = path.join(DATA_DIR, 'quiz_scores.json');

// Load emojis
const emojisPath = path.join(process.cwd(), 'data', 'emojis.json');
const emojis = JSON.parse(fs.readFileSync(emojisPath, 'utf8'));

const quizQuestions = [
  { 
    question: "What is the largest planet in our solar system?", 
    options: ["A) Earth", "B) Jupiter", "C) Saturn", "D) Mars"],
    answer: "B"
  },
  { 
    question: "What is the speed of light?", 
    options: ["A) 300,000 km/s", "B) 150,000 km/s", "C) 450,000 km/s", "D) 200,000 km/s"],
    answer: "A"
  },
  { 
    question: "Who painted the Starry Night?", 
    options: ["A) Pablo Picasso", "B) Leonardo da Vinci", "C) Vincent van Gogh", "D) Claude Monet"],
    answer: "C"
  },
  { 
    question: "What is the capital of Japan?", 
    options: ["A) Seoul", "B) Beijing", "C) Bangkok", "D) Tokyo"],
    answer: "D"
  },
  { 
    question: "Which programming language is known as the 'language of the web'?", 
    options: ["A) Python", "B) JavaScript", "C) Java", "D) C++"],
    answer: "B"
  },
  { 
    question: "What is the smallest unit of life?", 
    options: ["A) Atom", "B) Molecule", "C) Cell", "D) Organ"],
    answer: "C"
  },
  { 
    question: "In which year did World War II end?", 
    options: ["A) 1943", "B) 1944", "C) 1945", "D) 1946"],
    answer: "C"
  },
  { 
    question: "What is the chemical symbol for gold?", 
    options: ["A) Go", "B) Au", "C) Gd", "D) Ag"],
    answer: "B"
  },
  { 
    question: "How many continents are there?", 
    options: ["A) 5", "B) 6", "C) 7", "D) 8"],
    answer: "C"
  },
  { 
    question: "What is the tallest mountain in the world?", 
    options: ["A) K2", "B) Mount Everest", "C) Kilimanjaro", "D) Mont Blanc"],
    answer: "B"
  },
  { 
    question: "What is H2O commonly known as?", 
    options: ["A) Oxygen", "B) Hydrogen", "C) Water", "D) Carbon dioxide"],
    answer: "C"
  },
  { 
    question: "Who wrote 'Romeo and Juliet'?", 
    options: ["A) Charles Dickens", "B) William Shakespeare", "C) Jane Austen", "D) Mark Twain"],
    answer: "B"
  },
  { 
    question: "What is the largest ocean on Earth?", 
    options: ["A) Atlantic Ocean", "B) Indian Ocean", "C) Arctic Ocean", "D) Pacific Ocean"],
    answer: "D"
  },
  { 
    question: "What does CPU stand for?", 
    options: ["A) Central Processing Unit", "B) Computer Personal Unit", "C) Central Program Utility", "D) Computer Processing Utility"],
    answer: "A"
  },
  { 
    question: "What is the boiling point of water?", 
    options: ["A) 90°C", "B) 100°C", "C) 110°C", "D) 120°C"],
    answer: "B"
  },
  { 
    question: "Which planet is known as the Red Planet?", 
    options: ["A) Venus", "B) Mars", "C) Jupiter", "D) Saturn"],
    answer: "B"
  },
  { 
    question: "How many bones are in the human body?", 
    options: ["A) 186", "B) 206", "C) 226", "D) 246"],
    answer: "B"
  },
  { 
    question: "What is the capital of France?", 
    options: ["A) London", "B) Berlin", "C) Paris", "D) Rome"],
    answer: "C"
  },
  { 
    question: "What does HTML stand for?", 
    options: ["A) Hyper Text Markup Language", "B) High Tech Modern Language", "C) Home Tool Markup Language", "D) Hyperlinks and Text Markup Language"],
    answer: "A"
  },
  { 
    question: "Who discovered gravity?", 
    options: ["A) Albert Einstein", "B) Isaac Newton", "C) Galileo Galilei", "D) Stephen Hawking"],
    answer: "B"
  },
  { 
    question: "What is the capital of Australia?", 
    options: ["A) Sydney", "B) Melbourne", "C) Canberra", "D) Brisbane"],
    answer: "C"
  },
  { 
    question: "Which gas do plants absorb from the atmosphere?", 
    options: ["A) Oxygen", "B) Nitrogen", "C) Carbon Dioxide", "D) Hydrogen"],
    answer: "C"
  },
  { 
    question: "What is the smallest country in the world?", 
    options: ["A) Monaco", "B) Vatican City", "C) San Marino", "D) Liechtenstein"],
    answer: "B"
  },
  { 
    question: "How many hearts does an octopus have?", 
    options: ["A) 1", "B) 2", "C) 3", "D) 4"],
    answer: "C"
  },
  { 
    question: "What is the largest mammal in the world?", 
    options: ["A) African Elephant", "B) Blue Whale", "C) Giraffe", "D) Polar Bear"],
    answer: "B"
  },
  { 
    question: "Who invented the telephone?", 
    options: ["A) Thomas Edison", "B) Nikola Tesla", "C) Alexander Graham Bell", "D) Benjamin Franklin"],
    answer: "C"
  },
  { 
    question: "What does RAM stand for?", 
    options: ["A) Random Access Memory", "B) Rapid Access Memory", "C) Read Access Memory", "D) Real Access Memory"],
    answer: "A"
  },
  { 
    question: "Which element has the atomic number 1?", 
    options: ["A) Helium", "B) Hydrogen", "C) Oxygen", "D) Carbon"],
    answer: "B"
  },
  { 
    question: "In which country is the Great Pyramid of Giza?", 
    options: ["A) Mexico", "B) Peru", "C) Egypt", "D) Sudan"],
    answer: "C"
  },
  { 
    question: "What is the hardest natural substance on Earth?", 
    options: ["A) Gold", "B) Iron", "C) Diamond", "D) Platinum"],
    answer: "C"
  },
  { 
    question: "What does HTTP stand for?", 
    options: ["A) Hyper Text Transfer Protocol", "B) High Tech Transfer Protocol", "C) Hyper Transfer Text Protocol", "D) Home Text Transfer Protocol"],
    answer: "A"
  },
  { 
    question: "Who wrote 'To Kill a Mockingbird'?", 
    options: ["A) Harper Lee", "B) F. Scott Fitzgerald", "C) Ernest Hemingway", "D) John Steinbeck"],
    answer: "A"
  },
  { 
    question: "What is the freezing point of water in Fahrenheit?", 
    options: ["A) 0°F", "B) 32°F", "C) -32°F", "D) 100°F"],
    answer: "B"
  },
  { 
    question: "Which planet is closest to the Sun?", 
    options: ["A) Venus", "B) Mars", "C) Mercury", "D) Earth"],
    answer: "C"
  },
  { 
    question: "What is the longest river in the world?", 
    options: ["A) Amazon River", "B) Nile River", "C) Yangtze River", "D) Mississippi River"],
    answer: "B"
  },
  { 
    question: "How many sides does a hexagon have?", 
    options: ["A) 5", "B) 6", "C) 7", "D) 8"],
    answer: "B"
  },
  { 
    question: "What is the capital of Canada?", 
    options: ["A) Toronto", "B) Vancouver", "C) Ottawa", "D) Montreal"],
    answer: "C"
  },
  { 
    question: "Who painted the Mona Lisa?", 
    options: ["A) Michelangelo", "B) Leonardo da Vinci", "C) Raphael", "D) Donatello"],
    answer: "B"
  },
  { 
    question: "What does DNA stand for?", 
    options: ["A) Deoxyribonucleic Acid", "B) Dynamic Nuclear Acid", "C) Dual Nitrogen Acid", "D) Direct Nucleic Acid"],
    answer: "A"
  },
  { 
    question: "Which is the fastest land animal?", 
    options: ["A) Lion", "B) Cheetah", "C) Leopard", "D) Gazelle"],
    answer: "B"
  },
  { 
    question: "What year did the first iPhone release?", 
    options: ["A) 2005", "B) 2006", "C) 2007", "D) 2008"],
    answer: "C"
  },
  { 
    question: "Which ocean is the deepest?", 
    options: ["A) Atlantic Ocean", "B) Indian Ocean", "C) Arctic Ocean", "D) Pacific Ocean"],
    answer: "D"
  },
  { 
    question: "What is the main ingredient in guacamole?", 
    options: ["A) Tomato", "B) Avocado", "C) Pepper", "D) Onion"],
    answer: "B"
  },
  { 
    question: "How many legs does a spider have?", 
    options: ["A) 6", "B) 8", "C) 10", "D) 12"],
    answer: "B"
  },
  { 
    question: "What is the largest desert in the world?", 
    options: ["A) Sahara Desert", "B) Arabian Desert", "C) Antarctic Desert", "D) Gobi Desert"],
    answer: "C"
  },
  { 
    question: "Which vitamin is produced when skin is exposed to sunlight?", 
    options: ["A) Vitamin A", "B) Vitamin C", "C) Vitamin D", "D) Vitamin E"],
    answer: "C"
  },
  { 
    question: "What does AI stand for?", 
    options: ["A) Artificial Intelligence", "B) Automated Intelligence", "C) Advanced Interface", "D) Automatic Integration"],
    answer: "A"
  },
  { 
    question: "How many teeth does an adult human have?", 
    options: ["A) 28", "B) 30", "C) 32", "D) 34"],
    answer: "C"
  },
  { 
    question: "What is the smallest bone in the human body?", 
    options: ["A) Femur", "B) Stapes", "C) Radius", "D) Tibia"],
    answer: "B"
  },
  { 
    question: "Which country invented pizza?", 
    options: ["A) France", "B) Greece", "C) Spain", "D) Italy"],
    answer: "D"
  },
  { 
    question: "What is the study of weather called?", 
    options: ["A) Geology", "B) Biology", "C) Meteorology", "D) Astrology"],
    answer: "C"
  },
  { 
    question: "How many strings does a standard guitar have?", 
    options: ["A) 4", "B) 5", "C) 6", "D) 7"],
    answer: "C"
  },
  { 
    question: "What is the largest organ in the human body?", 
    options: ["A) Heart", "B) Brain", "C) Liver", "D) Skin"],
    answer: "D"
  },
  { 
    question: "Which country is known as the Land of the Rising Sun?", 
    options: ["A) China", "B) Japan", "C) Thailand", "D) South Korea"],
    answer: "B"
  },
  { 
    question: "What does URL stand for?", 
    options: ["A) Uniform Resource Locator", "B) Universal Resource Link", "C) Unified Resource Location", "D) Universal Reference Link"],
    answer: "A"
  },
  { 
    question: "How many players are on a soccer team?", 
    options: ["A) 9", "B) 10", "C) 11", "D) 12"],
    answer: "C"
  },
  { 
    question: "What is the currency of the United Kingdom?", 
    options: ["A) Euro", "B) Dollar", "C) Pound Sterling", "D) Franc"],
    answer: "C"
  },
  { 
    question: "Which bird is a symbol of peace?", 
    options: ["A) Eagle", "B) Dove", "C) Parrot", "D) Sparrow"],
    answer: "B"
  },
  { 
    question: "What is the chemical symbol for silver?", 
    options: ["A) Si", "B) Ag", "C) Au", "D) S"],
    answer: "B"
  },
  { 
    question: "How many hours are in a week?", 
    options: ["A) 148", "B) 156", "C) 164", "D) 168"],
    answer: "D"
  },
  { 
    question: "What is the capital of Italy?", 
    options: ["A) Venice", "B) Milan", "C) Rome", "D) Florence"],
    answer: "C"
  },
  { 
    question: "Which programming language was created by Guido van Rossum?", 
    options: ["A) Java", "B) Python", "C) Ruby", "D) C++"],
    answer: "B"
  },
  { 
    question: "What is the largest island in the world?", 
    options: ["A) Madagascar", "B) Greenland", "C) New Guinea", "D) Borneo"],
    answer: "B"
  },
  { 
    question: "How many minutes are in a day?", 
    options: ["A) 1200", "B) 1320", "C) 1440", "D) 1560"],
    answer: "C"
  },
  { 
    question: "What does USB stand for?", 
    options: ["A) Universal Serial Bus", "B) Unified System Bus", "C) Universal System Base", "D) Unified Serial Base"],
    answer: "A"
  },
  { 
    question: "Which country has the most population?", 
    options: ["A) India", "B) United States", "C) China", "D) Indonesia"],
    answer: "C"
  },
  { 
    question: "What is the square root of 144?", 
    options: ["A) 10", "B) 11", "C) 12", "D) 13"],
    answer: "C"
  },
  { 
    question: "Which organ pumps blood throughout the body?", 
    options: ["A) Lungs", "B) Heart", "C) Liver", "D) Kidneys"],
    answer: "B"
  },
  { 
    question: "What does GPS stand for?", 
    options: ["A) Global Positioning System", "B) General Position System", "C) Global Position Service", "D) General Positioning Service"],
    answer: "A"
  },
  { 
    question: "How many colors are in a rainbow?", 
    options: ["A) 5", "B) 6", "C) 7", "D) 8"],
    answer: "C"
  },
  { 
    question: "What is the capital of Spain?", 
    options: ["A) Barcelona", "B) Madrid", "C) Valencia", "D) Seville"],
    answer: "B"
  },
  { 
    question: "Which metal is liquid at room temperature?", 
    options: ["A) Iron", "B) Lead", "C) Mercury", "D) Copper"],
    answer: "C"
  },
  { 
    question: "How many months have 31 days?", 
    options: ["A) 5", "B) 6", "C) 7", "D) 8"],
    answer: "C"
  },
  { 
    question: "What does PDF stand for?", 
    options: ["A) Portable Document Format", "B) Public Document File", "C) Private Data Format", "D) Portable Data File"],
    answer: "A"
  },
  { 
    question: "Which planet is known for its rings?", 
    options: ["A) Jupiter", "B) Mars", "C) Saturn", "D) Neptune"],
    answer: "C"
  },
  { 
    question: "What is the most spoken language in the world?", 
    options: ["A) English", "B) Spanish", "C) Mandarin Chinese", "D) Hindi"],
    answer: "C"
  },
  { 
    question: "How many degrees are in a right angle?", 
    options: ["A) 45", "B) 60", "C) 90", "D) 180"],
    answer: "C"
  },
  { 
    question: "What is the capital of Germany?", 
    options: ["A) Munich", "B) Hamburg", "C) Frankfurt", "D) Berlin"],
    answer: "D"
  },
  { 
    question: "Which animal is known as the 'King of the Jungle'?", 
    options: ["A) Tiger", "B) Lion", "C) Elephant", "D) Gorilla"],
    answer: "B"
  },
  { 
    question: "What does Wi-Fi stand for?", 
    options: ["A) Wireless Fidelity", "B) Wireless Finder", "C) Wide Fidelity", "D) Wire Free"],
    answer: "A"
  },
  { 
    question: "How many seconds are in one hour?", 
    options: ["A) 3000", "B) 3200", "C) 3400", "D) 3600"],
    answer: "D"
  },
  { 
    question: "What is the smallest prime number?", 
    options: ["A) 0", "B) 1", "C) 2", "D) 3"],
    answer: "C"
  },
  { 
    question: "Which country gifted the Statue of Liberty to the USA?", 
    options: ["A) England", "B) France", "C) Spain", "D) Italy"],
    answer: "B"
  },
  { 
    question: "What does NASA stand for?", 
    options: ["A) National Aeronautics and Space Administration", "B) North American Space Agency", "C) National Air and Space Association", "D) National Aerospace and Science Administration"],
    answer: "A"
  },
  { 
    question: "How many zeros are in one million?", 
    options: ["A) 4", "B) 5", "C) 6", "D) 7"],
    answer: "C"
  },
  { 
    question: "What is the symbol for potassium?", 
    options: ["A) P", "B) K", "C) Po", "D) Pt"],
    answer: "B"
  },
  { 
    question: "Which sea is the saltiest?", 
    options: ["A) Red Sea", "B) Dead Sea", "C) Black Sea", "D) Mediterranean Sea"],
    answer: "B"
  },
  { 
    question: "What does VPN stand for?", 
    options: ["A) Virtual Private Network", "B) Virtual Public Network", "C) Verified Private Network", "D) Visual Private Node"],
    answer: "A"
  },
  { 
    question: "How many sides does a triangle have?", 
    options: ["A) 2", "B) 3", "C) 4", "D) 5"],
    answer: "B"
  },
  { 
    question: "What is the capital of Egypt?", 
    options: ["A) Alexandria", "B) Cairo", "C) Giza", "D) Luxor"],
    answer: "B"
  },
  { 
    question: "Which is the hottest planet in our solar system?", 
    options: ["A) Mercury", "B) Venus", "C) Mars", "D) Jupiter"],
    answer: "B"
  },
  { 
    question: "What does CEO stand for?", 
    options: ["A) Chief Executive Officer", "B) Central Executive Officer", "C) Chief Elected Official", "D) Corporate Executive Officer"],
    answer: "A"
  },
  { 
    question: "How many Great Lakes are there in North America?", 
    options: ["A) 3", "B) 4", "C) 5", "D) 6"],
    answer: "C"
  },
  { 
    question: "What is the main gas in Earth's atmosphere?", 
    options: ["A) Oxygen", "B) Carbon Dioxide", "C) Nitrogen", "D) Hydrogen"],
    answer: "C"
  },
  { 
    question: "Which country is home to the kangaroo?", 
    options: ["A) New Zealand", "B) Australia", "C) South Africa", "D) Madagascar"],
    answer: "B"
  }
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
  name: 'quiz',
  description: 'Start a multiple choice quiz game. Answer with A, B, C, or D',
  async execute(msg, { sock, args }) {
    const from = msg.key.remoteJid;
    const user = msg.key.participant || msg.key.remoteJid;
    
    // Check if user wants to see scores
    if (args[0] === 'score' || args[0] === 'scores') {
      const scores = loadJSON(QUIZ_SCORES_FILE);
      if (!scores[user] || scores[user] === 0) {
        await sock.sendMessage(from, {
          text: `${emojis.info || '📊'} *Your Quiz Score:* 0 points\n\nPlay quiz games to earn points!`
        }, { quoted: msg });
        return;
      }
      
      await sock.sendMessage(from, {
        text: `${emojis.success || '✅'} *Your Quiz Score:* ${scores[user]} points\n\nKeep playing to increase your score!`
      }, { quoted: msg });
      return;
    }

    // Check if user wants to answer
    if (args[0] && args[0].toUpperCase().match(/^[A-D]$/)) {
      const quizData = loadJSON(QUIZ_FILE);
      const scores = loadJSON(QUIZ_SCORES_FILE);
      
      if (!quizData[user]) {
        await sock.sendMessage(from, {
          text: `${emojis.error || '❌'} *No active quiz!*\n\nUse *.quiz* to start a new quiz game.`
        }, { quoted: msg });
        return;
      }

      const userQuiz = quizData[user];
      const timePassed = Date.now() - userQuiz.askedAt;
      const twoMinutes = 120 * 1000;

      if (timePassed > twoMinutes) {
        delete quizData[user];
        saveJSON(QUIZ_FILE, quizData);
        await sock.sendMessage(from, {
          text: `${emojis.error || '⏰'} *Time's up!*\n\nThe correct answer was *${userQuiz.correctAnswer}*\n\nUse *.quiz* to try a new question.`
        }, { quoted: msg });
        return;
      }

      const userAnswer = args[0].toUpperCase();
      const correctAnswer = userQuiz.correctAnswer;

      if (userAnswer === correctAnswer) {
        scores[user] = (scores[user] || 0) + 10;
        delete quizData[user];
        saveJSON(QUIZ_FILE, quizData);
        saveJSON(QUIZ_SCORES_FILE, scores);

        await sock.sendMessage(from, {
          text: `${emojis.success || '✅'} *Correct!* Well done! 🎉\n\n*+10 points*\nYour total score: *${scores[user]} points*`
        }, { quoted: msg });
      } else {
        delete quizData[user];
        saveJSON(QUIZ_FILE, quizData);
        await sock.sendMessage(from, {
          text: `${emojis.error || '❌'} *Incorrect!*\n\nThe correct answer was *${correctAnswer}*\n\nUse *.quiz* to try another question.`
        }, { quoted: msg });
      }
      return;
    }

    // Start new quiz
    const quizData = loadJSON(QUIZ_FILE);
    
    if (quizData[user]) {
      await sock.sendMessage(from, {
        text: `${emojis.warning || '⚠️'} *You already have an active quiz!*\n\nPlease answer your current question or wait for it to expire.`
      }, { quoted: msg });
      return;
    }

    const randomQ = quizQuestions[Math.floor(Math.random() * quizQuestions.length)];

    quizData[user] = {
      question: randomQ.question,
      options: randomQ.options,
      correctAnswer: randomQ.answer,
      askedAt: Date.now()
    };
    saveJSON(QUIZ_FILE, quizData);

    const optionsText = randomQ.options.join('\n');
    await sock.sendMessage(from, {
      text: `${emojis.game || '🎮'} *QUIZ TIME!* ${emojis.game || '🎮'}\n\n❓ *Question:*\n${randomQ.question}\n\n${optionsText}\n\n⏰ You have 2 minutes to answer!\n💡 Reply with *.quiz A/B/C/D* to answer\n📊 Use *.quiz score* to check your score`
    }, { quoted: msg });
  }
};
