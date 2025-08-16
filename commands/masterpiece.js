
import fs from 'fs';
import path from 'path';

export default {
  name: "masterpiece",
  description: "List all commands (public access)",
  async execute(msg, { sock, args }) {

    // Load all commands dynamically
    const commandsPath = path.join(process.cwd(), 'commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    const publicCmds = [];

    for (const file of commandFiles) {
      try {
        const command = await import(path.join(commandsPath, file));
        const cmd = command.default;
        publicCmds.push(`$${cmd.name} - ${cmd.description || ''}`);
      } catch (e) {
        // ignore import errors
      }
    }

    const text = 
`📜 ALL BOT COMMANDS:

${publicCmds.join('\n')}

Use $menu for organized command categories or $info <command> for details.`;

    await sock.sendMessage(msg.key.remoteJid, { text }, { quoted: msg });
  },
};
