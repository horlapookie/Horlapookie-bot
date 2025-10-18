import moment from 'moment-timezone';
import config from '../config.js';
import axios from 'axios';

export default {
  name: 'surah',
  description: '📖 Fetch specific verses from the Holy Quran by Surah name and verse number',
  async execute(msg, { sock, args }) {
    console.log(`[INFO] Executing surahverse command for message ID: ${msg.key.id}, from: ${msg.key.remoteJid}, args: ${args.join(' ')}`);

    try {
      moment.tz.setDefault("Africa/Lagos");
      const time = moment().format('HH:mm:ss');
      const date = moment().format('DD/MM/YYYY');

      // Validate input
      if (!args.length) {
        throw new Error('No Surah name or verse provided. Usage: ?surahverse Al-Fatiha 1:1');
      }

      // Parse Surah name and verse
      const input = args.join(' ').trim();
      const match = input.match(/^([\w\s'-]+)\s*(\d+:\d+(?:-\d+)?)$/i);
      if (!match) {
        throw new Error('Invalid format. Use: ?surahverse Al-Fatiha 1:1 or ?surahverse An-Nas 114:1-3');
      }
      const surahName = match[1].trim().replace(/\s+/g, '-').toLowerCase();
      const verseRange = match[2];

      // Map Surah name to number (based on standard English transliterations)
      const surahMap = {
        'al-fatiha': 1, 'al-baqarah': 2, 'al-imran': 3, 'an-nisa': 4, 'al-maidah': 5, 'al-anam': 6,
        'al-araf': 7, 'al-anfal': 8, 'at-tawbah': 9, 'yunus': 10, 'hud': 11, 'yusuf': 12,
        'ar-rad': 13, 'ibrahim': 14, 'al-hijr': 15, 'an-nahl': 16, 'al-isra': 17, 'al-kahf': 18,
        'maryam': 19, 'ta-ha': 20, 'al-anbiya': 21, 'al-hajj': 22, 'al-muminun': 23, 'an-nur': 24,
        'al-furqan': 25, 'ash-shuara': 26, 'an-naml': 27, 'al-qasas': 28, 'al-ankabut': 29,
        'ar-rum': 30, 'luqman': 31, 'as-sajdah': 32, 'al-ahzab': 33, 'saba': 34, 'fatir': 35,
        'ya-sin': 36, 'as-saffat': 37, 'sad': 38, 'az-zumar': 39, 'ghafir': 40, 'fussilat': 41,
        'ash-shura': 42, 'az-zukhruf': 43, 'ad-dukhan': 44, 'al-jathiyah': 45, 'al-ahqaf': 46,
        'muhammad': 47, 'al-fath': 48, 'al-hujurat': 49, 'qaf': 50, 'adh-dhariyat': 51,
        'at-tur': 52, 'an-najm': 53, 'al-qamar': 54, 'ar-rahman': 55, 'al-waqi-ah': 56,
        'al-hadid': 57, 'al-mujadilah': 58, 'al-hashr': 59, 'al-mumtahanah': 60, 'as-saff': 61,
        'al-jumuah': 62, 'al-munafiqun': 63, 'at-taghabun': 64, 'at-talaq': 65, 'at-tahrim': 66,
        'al-mulk': 67, 'al-qalam': 68, 'al-haqqah': 69, 'al-maarij': 70, 'nuh': 71, 'al-jinn': 72,
        'al-muzzammil': 73, 'al-muddaththir': 74, 'al-qiyamah': 75, 'al-insan': 76,
        'al-mursalat': 77, 'an-naba': 78, 'an-naziat': 79, 'abasa': 80, 'at-takwir': 81,
        'al-infitar': 82, 'al-mutaffifin': 83, 'al-inshiqaq': 84, 'al-buruj': 85, 'at-tariq': 86,
        'al-ala': 87, 'al-ghashiyah': 88, 'al-fajr': 89, 'al-balad': 90, 'ash-shams': 91,
        'al-layl': 92, 'ad-duha': 93, 'al-inshirah': 94, 'at-tin': 95, 'al-alaq': 96,
        'al-qadr': 97, 'al-bayyinah': 98, 'az-zalzalah': 99, 'al-adiyat': 100, 'al-qariah': 101,
        'at-takathur': 102, 'al-asr': 103, 'al-humazah': 104, 'al-fil': 105, 'quraysh': 106,
        'al-maun': 107, 'al-kawthar': 108, 'al-kafirun': 109, 'an-nasr': 110, 'al-masad': 111,
        'al-ikhlas': 112, 'al-falaq': 113, 'an-nas': 114
      };

      const surahNumber = surahMap[surahName.toLowerCase()];
      if (!surahNumber) {
        throw new Error(`Invalid Surah name: ${surahName}. Use a valid Surah name (e.g., Al-Fatiha, An-Nas).`);
      }

      // Parse verse range (e.g., "1:1" or "1:1-3")
      const verseMatch = verseRange.match(/(\d+):(\d+)(?:-(\d+))?/);
      if (!verseMatch) {
        throw new Error('Invalid verse format. Use: Chapter:Verse (e.g., 1:1 or 1:1-3).');
      }
      const chapter = parseInt(verseMatch[1]);
      const startVerse = parseInt(verseMatch[2]);
      const endVerse = verseMatch[3] ? parseInt(verseMatch[3]) : startVerse;

      if (chapter !== surahNumber) {
        throw new Error(`Chapter number ${chapter} does not match Surah ${surahName} (Surah ${surahNumber}).`);
      }
      if (startVerse < 1 || endVerse < startVerse) {
        throw new Error('Invalid verse range. Verses must be positive and end verse must be >= start verse.');
      }

      // Fetch verses from API
      const apiUrl = `https://api.alquran.cloud/v1/surah/${surahNumber}/ar`;
      const transUrl = `https://api.alquran.cloud/v1/surah/${surahNumber}/en.sahih`;
      console.log(`[INFO] Fetching Surah ${surahNumber} verses ${startVerse}-${endVerse} from ${apiUrl}`);
      const [arResponse, enResponse] = await Promise.all([
        axios.get(apiUrl, { timeout: 5000 }),
        axios.get(transUrl, { timeout: 5000 })
      ]);

      const arData = arResponse.data.data;
      const enData = enResponse.data.data;
      if (!arData.ayahs || !enData.ayahs) {
        throw new Error('Failed to retrieve verses from API.');
      }

      // Validate verse range
      const maxVerses = arData.ayahs.length;
      if (startVerse > maxVerses || endVerse > maxVerses) {
        throw new Error(`Verse range ${startVerse}-${endVerse} exceeds available verses (${maxVerses}) for Surah ${arData.englishName}.`);
      }

      // Build response
      let verseText = `
🤲🕌  ┈─• *HOLY QURAN* •─┈  🕌🤲

📜 *Surah ${arData.englishName} (${arData.number})* 📜
💫 Verses ${startVerse}${endVerse !== startVerse ? `-${endVerse}` : ''} 💫
`;

      for (let i = startVerse - 1; i < endVerse; i++) {
        const arVerse = arData.ayahs[i];
        const enVerse = enData.ayahs[i];
        verseText += `
${arVerse.text} 🕋
*Verse ${arVerse.numberInSurah}*: ${enVerse.text}
`;
      }

      verseText += `
📜 BY *${config.botName}* ⚪
*Date*: ${date} | *Time*: ${time} (WAT)
`;

      let menuMsg = `
> *POWERED BY ${config.botName.toUpperCase()}*

> ©ᴘᴏᴡᴇʀᴇᴅ ʙʏ ${config.ownerName}
`;

      console.log(`[INFO] Sending verses for Surah ${arData.englishName} (${startVerse}-${endVerse}) to: ${msg.key.remoteJid}`);
      
      await sock.sendMessage(msg.key.remoteJid, {
        text: verseText + menuMsg,
        contextInfo: {
          externalAdReply: {
            title: `*${config.botName}* HOLY QURAN VERSES`,
            body: "Seek guidance from the Quran, for it is a light in the darkness",
            thumbnailUrl: "https://i.imgur.com/quranimage.jpg",
            sourceUrl: "https://whatsapp.com/channel/0029Vb6AZrY2f3EMgD8kRQ01",
            mediaType: 1,
            renderLargerThumbnail: true
          }
        }
      }, { quoted: msg });

      console.log(`[INFO] Quran verses sent successfully to: ${msg.key.remoteJid}`);
    } catch (error) {
      console.error(`[ERROR] Failed to send Quran verses to ${msg.key.remoteJid}:`, error.message);
      if (msg.key.remoteJid) {
        let errorMsg = `❌ Failed to fetch Quran verses. Reason: ${error.message}. Try again with correct Surah name and verse (e.g., ?surahverse Al-Fatiha 1:1).`;
        if (error.message.includes('Invalid Surah name')) {
          errorMsg = `❌ Invalid Surah name. Please use a valid name from the Surah list (e.g., Al-Fatiha, An-Nas). Try ?surah to see the list.`;
        } else if (error.message.includes('Invalid verse format') || error.message.includes('Verse range')) {
          errorMsg = `❌ Invalid verse format or range. Use Chapter:Verse (e.g., 1:1 or 1:1-3).`;
        } else if (error.message.includes('Chapter number')) {
          errorMsg = `❌ Chapter number does not match Surah. Use the correct Surah number (e.g., Al-Fatiha is Surah 1). Try ?surah for the list.`;
        }
        await sock.sendMessage(msg.key.remoteJid, { 
          text: errorMsg 
        }, { quoted: msg }).catch((err) => {
          console.error('[ERROR] Failed to send error message:', err.message);
        });
      }
    }
  }
};