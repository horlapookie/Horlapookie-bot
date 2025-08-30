
import JavaScriptObfuscator from 'javascript-obfuscator';

export default {
  name: 'obfuscate',
  aliases: ['obfu'],
  description: 'Obfuscate JavaScript code',
  async execute(msg, { sock, args }) {
    const from = msg.key.remoteJid;
    
    try {
      if (!args || args.length === 0) {
        return await sock.sendMessage(from, { 
          text: "After the command, provide a valid JavaScript code for encryption." 
        }, { quoted: msg });
      }

      let codeToObfuscate = args.join(" ");

      const obfuscatedCode = JavaScriptObfuscator.obfuscate(codeToObfuscate, {
        'compact': true,
        'controlFlowFlattening': true,
        'controlFlowFlatteningThreshold': 0.1,
        'numbersToExpressions': true,
        'simplify': true,
        'stringArrayShuffle': true,
        'splitStrings': true,
        'stringArrayThreshold': 0.1
      });

      await sock.sendMessage(from, { 
        text: obfuscatedCode.getObfuscatedCode() 
      }, { quoted: msg });
    } catch (error) {
      await sock.sendMessage(from, { 
        text: "Something went wrong. Please check if your code is logical and has the correct syntax." 
      }, { quoted: msg });
    }
  }
};
