import fs from 'fs';
import path from 'path';

const WARNS_FILE = path.join(process.cwd(), 'data', 'warns.json');

function loadWarns() {
  if (!fs.existsSync(WARNS_FILE)) return {};
  return JSON.parse(fs.readFileSync(WARNS_FILE, 'utf-8'));
}

function saveWarns(warns) {
  fs.writeFileSync(WARNS_FILE, JSON.stringify(warns, null, 2));
}

export default {
  name: 'warn',
  description: 'Warn a user (admin only)',
  async execute(msg, { sock }) {
    const remoteJid = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;
    const isGroup = remoteJid.endsWith('@g.us');

    // Only allow in groups
    if (!isGroup) {
      await sock.sendMessage(remoteJid, { text: '⚠️ This command can only be used in groups.' }, { quoted: msg });
      return;
    }

    // Check if sender is admin or allowed number (you can adapt your allowed numbers array)
    const allowedNumbers = ['2349122222622']; // your allowed numbers here
    const groupMetadata = await sock.groupMetadata(remoteJid);
    const admins = groupMetadata.participants.filter(p => p.admin !== null).map(p => p.id);
    if (!admins.includes(sender) && !allowedNumbers.includes(sender.split('@')[0])) {
      await sock.sendMessage(remoteJid, { text: '❌ Only group admins or bot owner can warn users.' }, { quoted: msg });
      return;
    }

    // Identify user to warn from mention or reply
    let userToWarn;
    if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
      userToWarn = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
    } else if (msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
      userToWarn = msg.message.extendedTextMessage.contextInfo.participant;
    } else {
      await sock.sendMessage(remoteJid, { text: '⚠️ Please tag or reply to the user you want to warn.' }, { quoted: msg });
      return;
    }

    const warns = loadWarns();

    if (!warns[remoteJid]) warns[remoteJid] = {};
    if (!warns[remoteJid][userToWarn]) warns[remoteJid][userToWarn] = 0;

    warns[remoteJid][userToWarn] += 1;

    saveWarns(warns);

    await sock.sendMessage(remoteJid, {
      text: `⚠️ <@${userToWarn.split('@')[0]}> has been warned. Total warnings: ${warns[remoteJid][userToWarn]}`,
      mentions: [userToWarn]
    }, { quoted: msg });
  }
};