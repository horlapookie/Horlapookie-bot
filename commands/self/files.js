
import fs from 'fs';
import path from 'path';

export default {
  name: 'files',
  description: 'List or download bot command files',
  async execute(msg, { sock, args, settings }) {
    const from = msg.key.remoteJid;

    try {
      const commandsDir = path.join(process.cwd(), 'commands');
      
      if (!args[0]) {
        // List all command files
        const files = fs.readdirSync(commandsDir).filter(f => f.endsWith('.js'));
        const selfFiles = fs.existsSync(path.join(commandsDir, 'self')) 
          ? fs.readdirSync(path.join(commandsDir, 'self')).filter(f => f.endsWith('.js')).map(f => `self/${f}`)
          : [];
        
        const allFiles = [...files, ...selfFiles];
        
        const fileList = allFiles.map((file, index) => `${index + 1}. ${file}`).join('\n');
        
        await sock.sendMessage(from, {
          text: `📁 *Bot Command Files*\n\n${fileList}\n\n💡 Use \`${settings.prefix}files <filename>\` to download a file`
        }, { quoted: msg });
      } else {
        // Download specific file
        const filename = args.join(' ');
        let filePath;
        
        if (filename.startsWith('self/')) {
          filePath = path.join(commandsDir, filename);
        } else {
          filePath = path.join(commandsDir, filename);
        }
        
        if (fs.existsSync(filePath)) {
          const fileContent = fs.readFileSync(filePath, 'utf8');
          
          await sock.sendMessage(from, {
            document: Buffer.from(fileContent),
            mimetype: 'text/javascript',
            fileName: path.basename(filename)
          }, { quoted: msg });
          
          await sock.sendMessage(from, {
            text: `✅ File \`${filename}\` has been sent!`
          }, { quoted: msg });
        } else {
          await sock.sendMessage(from, {
            text: `❌ File \`${filename}\` not found!`
          }, { quoted: msg });
        }
      }
    } catch (error) {
      await sock.sendMessage(from, {
        text: `❌ Error: ${error.message}`
      }, { quoted: msg });
    }
  }
};
