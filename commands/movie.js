import { arts } from "../lib/arts.js";

export default {
  name: "movie",
  description: "Displays ASCII art based on the name provided",
  async execute(msg, { sock, args }) {
    const jid = msg.key.remoteJid;

    if (!args[0]) {
      const list = Object.keys(arts)
        .map((name) => `- ${name}`)
        .join("\n");

      await sock.sendMessage(jid, {
        text: `*Available ASCII Arts:*\n\n${list}\n\nUse *$movie <name>* to view a specific art.`,
      });
      return;
    }

    const query = args[0].toLowerCase();

    if (!arts[query]) {
      await sock.sendMessage(jid, {
        text: `Art not found for "*${query}*".\nUse *$artlist* to see all available options.`,
      });
      return;
    }

    await sock.sendMessage(jid, {
      text: arts[query],
    });
  },
};
