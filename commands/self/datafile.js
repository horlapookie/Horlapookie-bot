
import fs from 'fs';
import path from 'path';

export default {
  name: 'datafile',
  description: 'List or download bot data files',
  async execute(msg, { sock, args, settings }) {
    const from = msg.key.remoteJid;

    try {
      const dataDir = path.join(process.cwd(), 'data');
      const libDir = path.join(process.cwd(), 'lib');
      
      if (!args[0]) {
        // List all data files
        const dataFiles = fs.existsSync(dataDir) 
          ? fs.readdirSync(dataDir).filter(f => f.endsWith('.json')).map(f => `data/${f}`)
          : [];
        
        const libFiles = fs.existsSync(libDir)
          ? fs.readdirSync(libDir).filter(f => f.endsWith('.js')).map(f => `lib/${f}`)
          : [];
        
        const allFiles = [...dataFiles, ...libFiles];
        
        const fileList = allFiles.map((file, index) => `${index + 1}. ${file}`).join('\n');
        
        await sock.sendMessage(from, {
          text: `📊 *Bot Data Files*\n\n${fileList}\n\n💡 Use \`${settings.prefix}datafile <filename>\` to download a file`
        }, { quoted: msg });
      } else {
        // Download specific file
        const filename = args.join(' ');
        let filePath;
        
        if (filename.startsWith('data/')) {
          filePath = path.join(process.cwd(), filename);
        } else if (filename.startsWith('lib/')) {
          filePath = path.join(process.cwd(), filename);
        } else {
          // Try both directories
          const dataPath = path.join(dataDir, filename);
          const libPath = path.join(libDir, filename);
          
          if (fs.existsSync(dataPath)) {
            filePath = dataPath;
          } else if (fs.existsSync(libPath)) {
            filePath = libPath;
          }
        }
        
        if (filePath && fs.existsSync(filePath)) {
          const fileContent = fs.readFileSync(filePath, 'utf8');
          const ext = path.extname(filename);
          const mimetype = ext === '.json' ? 'application/json' : 'text/javascript';
          
          await sock.sendMessage(from, {
            document: Buffer.from(fileContent),
            mimetype: mimetype,
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
