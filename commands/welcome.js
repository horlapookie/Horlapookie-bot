import fs from 'fs';
import path from 'path';

const WELCOME_CONFIG_FILE = path.join(process.cwd(), 'data', 'welcome.json');

let welcomeConfig = fs.existsSync(WELCOME_CONFIG_FILE)
  ? JSON.parse(fs.readFileSync(WELCOME_CONFIG_FILE))
  : {};

function saveWelcomeConfig() {
  fs.writeFileSync(WELCOME_CONFIG_FILE, JSON.stringify(welcomeConfig, null, 2));
}

function isAdminOrMod(senderNumber, groupAdmins, mods, owner) {
  return groupAdmins.includes(senderNumber) || mods.includes(senderNumber) || senderNumber === owner;
}

export default {
  name: 'welcome',
  description: 'Toggle welcome messages and view current welcome/goodbye messages',
  onlyGroup: true,
  onlyMod: true,
  async execute(msg, { sock, args, welcomeConfig, saveWelcomeConfig, moderators, OWNER_NUMBER }) {
    const remoteJid = msg.key.remoteJid;
    const senderJid = msg.key.participant;
    const senderNumber = senderJid.split('@')[0];

    // Fetch group metadata to get admins
    const groupMetadata = await sock.groupMetadata(remoteJid);
    const groupAdmins = groupMetadata.participants
      .filter((p) => p.admin !== null)
      .map((p) => p.id.split('@')[0]);

    if (!isAdminOrMod(senderNumber, groupAdmins, moderators, OWNER_NUMBER)) {
      await sock.sendMessage(remoteJid, { text: '⛔ Only admins, mods or owner can use this command.' }, { quoted: msg });
      return;
    }

    if (!welcomeConfig[remoteJid]) {
      welcomeConfig[remoteJid] = {
        enabled: false,
        welcomeMessage: 'Welcome @user to the group! 🎉',
        goodbyeMessage: 'Goodbye @user! We will miss you! 😢',
      };
      saveWelcomeConfig();
    }

    const subCmd = args[0]?.toLowerCase();

    if (!subCmd) {
      return await sock.sendMessage(remoteJid, { text: 'Usage:\n?welcome on\n?welcome off\n?welcome done' }, { quoted: msg });
    }

    if (subCmd === 'on') {
      welcomeConfig[remoteJid].enabled = true;
      saveWelcomeConfig();
      await sock.sendMessage(remoteJid, { text: '✅ Welcome messages have been *enabled* for this group. 🎉' }, { quoted: msg });
    } else if (subCmd === 'off') {
      welcomeConfig[remoteJid].enabled = false;
      saveWelcomeConfig();
      await sock.sendMessage(remoteJid, { text: '❌ Welcome messages have been *disabled* for this group.' }, { quoted: msg });
    } else if (subCmd === 'done' || subCmd === 'status') {
      const welcomeMsg = welcomeConfig[remoteJid].welcomeMessage || 'Not set';
      const goodbyeMsg = welcomeConfig[remoteJid].goodbyeMessage || 'Not set';
      const status = welcomeConfig[remoteJid].enabled ? 'Enabled ✅' : 'Disabled ❌';
      await sock.sendMessage(
        remoteJid,
        {
          text: `Welcome messages are currently *${status}*.\n\nWelcome message:\n${welcomeMsg}\n\nGoodbye message:\n${goodbyeMsg}`,
          mentions: [],
        },
        { quoted: msg }
      );
    } else {
      await sock.sendMessage(remoteJid, { text: 'Unknown subcommand. Use on, off, or done.' }, { quoted: msg });
    }
  },
};