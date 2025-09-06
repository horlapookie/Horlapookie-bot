import fs from 'fs';
import path from 'path';

const usernamesFile = path.join(process.cwd(), 'data', 'usernames.json');

// Load or create usernames file
function loadUsernames() {
  if (!fs.existsSync(usernamesFile)) {
    fs.writeFileSync(usernamesFile, '{}');
  }
  return JSON.parse(fs.readFileSync(usernamesFile, 'utf-8'));
}

function saveUsernames(data) {
  fs.writeFileSync(usernamesFile, JSON.stringify(data, null, 2));
}

export default {
  name: 'setusername',
  description: 'Set your nickname for the bot',
  async execute(msg, { sock, args }) {
    const sender = msg.key.participant || msg.key.remoteJid;
    if (!args.length) {
      await sock.sendMessage(msg.key.remoteJid, { text: 'Please provide a username to set.' }, { quoted: msg });
      return;
    }
    const newUsername = args.join(' ').trim();

    const usernames = loadUsernames();
    usernames[sender] = newUsername;
    saveUsernames(usernames);

    await sock.sendMessage(msg.key.remoteJid, { text: `✅ Your username has been set to: ${newUsername}` }, { quoted: msg });
  }
}
