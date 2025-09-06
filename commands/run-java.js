
import { java } from 'compile-run';

export default {
  name: 'run-java',
  aliases: ['java', 'runjava'],
  description: 'Run Java code',
  async execute(msg, { sock, args }) {
    const from = msg.key.remoteJid;
    
    try {
      if (!args || args.length === 0) {
        return await sock.sendMessage(from, { 
          text: "Quote a valid and short Java code to compile." 
        }, { quoted: msg });
      }

      let code = args.join(" ");
      let result = await java.runSource(code);

      if (result.error) {
        await sock.sendMessage(from, { 
          text: `Error: ${result.error}` 
        }, { quoted: msg });
      } else {
        let output = `Output:\n${result.stdout}`;
        if (result.stderr) {
          output += `\nError Output:\n${result.stderr}`;
        }
        await sock.sendMessage(from, { 
          text: output 
        }, { quoted: msg });
      }
    } catch (err) {
      console.error(err);
      await sock.sendMessage(from, { 
        text: "An error occurred while trying to run the code." 
      }, { quoted: msg });
    }
  }
};
