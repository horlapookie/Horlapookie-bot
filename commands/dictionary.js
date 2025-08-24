
import axios from 'axios';

export default {
  name: 'dictionary',
  description: 'Get meaning of a word',
  aliases: ['dict', 'define', 'meaning'],
  async execute(msg, { sock, args }) {
    const from = msg.key.remoteJid;

    if (!args[0]) {
      return await sock.sendMessage(from, { 
        text: `*📖 Enter the word to search*\n\nExample: ?dictionary hello` 
      }, { quoted: msg });
    }

    try {
      const word = args[0].toLowerCase();
      const response = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
      const dice = response.data[0];

      console.log('[dictionary] Lookup for:', dice.word);

      const phonetic = dice.phonetic || dice.phonetics?.[0]?.text || 'N/A';
      const definition = dice.meanings[0].definitions[0].definition;
      const example = dice.meanings[0].definitions[0].example || 'No example available';
      const partOfSpeech = dice.meanings[0].partOfSpeech || 'N/A';

      await sock.sendMessage(from, {
        text: `📖 *Dictionary*\n\n*Word*: ${dice.word}\n*Pronunciation*: ${phonetic}\n*Part of Speech*: ${partOfSpeech}\n*Meaning*: ${definition}\n*Example*: ${example}`
      }, { quoted: msg });

    } catch (err) {
      console.log('[dictionary] Error:', err.message);
      
      if (err.response && err.response.status === 404) {
        return await sock.sendMessage(from, { 
          text: `❌ Word "${args[0]}" not found in dictionary. Please check spelling and try again.` 
        }, { quoted: msg });
      }
      
      return await sock.sendMessage(from, { 
        text: `❌ Error looking up word. Please try again later.` 
      }, { quoted: msg });
    }
  }
};
