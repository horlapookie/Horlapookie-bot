import fs from "fs";
import config from "../config.js";

// Define your bugs
export const bugsList = {
  "combo-crash": { description: "Invisible Unicode payload", type: "DM & Group", weight: 1_000_000 },
  "singleline-crash": { description: "Single-line massive zero-width crash", type: "DM", weight: 10_000_000 },
  "mentions-crash": { description: "Massive mentions JSON crash", type: "Group only", weight: 200_000 },
  "ios-heavy": { description: "iOS heavy Unicode + emoji crash", type: "DM & Group", weight: 20_000 },
  "emoji-bomb": { description: "Stacked ZWJ emoji spam", type: "DM & Group", weight: 50_000 },
  "rtl-bomb": { description: "Right-to-left override Unicode crash", type: "DM & Group", weight: 100_000 },
  "media-bomb": { description: "Huge fake media (text/video) payload", type: "DM & Group", weight: 50_000_000 },
  "zero-width-wall": { description: "Walls of Zero-Width Spaces", type: "DM & Group", weight: 100_000_000 },
  "apocalypse-bug": { description: "⚠️ Ultra-heavy Unicode, emojis & mentions crash", type: "DM & Group", weight: "EXTREME" }
};

export default {
  name: "bugmenu",
  description: "Show the list of all available bugs",
  async execute(msg, { sock }) {
    let prefix = config.prefix || "?";
    let menuText = `╭━━━✦❮ *🐛 BUG COMMANDS* ❯✦━⊷ \n`;
    for (const [name, info] of Object.entries(bugsList)) {
      menuText += `┃✪  ${name} - ${info.description}\n`;
    }
    menuText += `╰━━━━━━━━━━━━━━━━━⊷\n\n`;
    menuText += `Usage to send a bug:\n${prefix}bug <bug_name> <number/group>\nExample: ${prefix}bug combo-crash 2349123456789`;
    await sock.sendMessage(msg.key.remoteJid, { text: menuText });
  }
};
