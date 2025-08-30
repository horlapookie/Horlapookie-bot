import fs from 'fs';
import path from 'path';

const DATA_DIR = path.resolve('./data');
const SCORES_FILE = path.join(DATA_DIR, 'scores.json');

function loadJSON(file) {
  if (!fs.existsSync(file)) return {};
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch {
    return {};
  }
}

export default {
  name: "myscore",
  description: "Show your trivia score and the leaderboard.",
  async execute(msg, { sock }) {
    const scores = loadJSON(SCORES_FILE);
    const user = msg.key.participant || msg.key.remoteJid;

    const leaderboard = Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    let leaderboardText = "🏆 *Trivia Leaderboard*\n\n";
    leaderboard.forEach(([uid, score], idx) => {
      const mention = uid.includes("@s.whatsapp.net") ? `@${uid.split("@")[0]}` : uid;
      leaderboardText += `${idx + 1}. ${mention} — *${score}* point(s)\n`;
    });

    const userScore = scores[user] || 0;

    await sock.sendMessage(msg.key.remoteJid, {
      text: `${leaderboardText}\nYour score: *${userScore}* point(s)`,
      mentions: leaderboard.map(([uid]) => uid),
    }, { quoted: msg });
  },
};
