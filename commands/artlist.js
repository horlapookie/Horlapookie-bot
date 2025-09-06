import { arts } from "../lib/arts.js";

export default {
  name: "artlist",
  description: "Lists all available ASCII arts",
  async execute(msg, { sock }) {
    const jid = msg.key.remoteJid;

    const list = Object.keys(arts)
      .map((name) => `- ${name}`)
      .join("\n");

    await sock.sendMessage(jid, {
      text: `*Available ASCII Arts:*\n\n${list}`,
    });
  },
};
