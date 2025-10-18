import fetch from 'node-fetch';

export default {
  name: "bible",
  aliases: ["holybook"],
  description: "Fetch Bible verses from the Old and New Testament",
  async execute(msg, { sock, args }) {
    const from = msg.key.remoteJid;
    const userName = msg.pushName || "User";

    try {
      // Check if input is provided
      if (!args.length) {
        await sock.sendMessage(from, {
          text: `◈━━━━━━━━━━━━━━━━◈\n│❒ WAKE UP, ${userName}! Give me a Bible book, chapter, and verse! 😤\n│❒ Usage: ?bible <book> <chapter>:<verse>\n│❒ Example: ?bible judges 2:3\n│❒ Or: ?holybook john 3:16\n│❒ Type ?biblelist for the full list of books\n◈━━━━━━━━━━━━━━━━◈`,
          react: { text: "❌", key: msg.key }
        }, { quoted: msg });
        return;
      }

      // Parse input: expect format like "judges 2:3"
      const query = args.join(' ').trim();
      const match = query.match(/^(\w+(?:\s+\w+)?)\s+(\d+):(\d+)$/i);
      if (!match) {
        await sock.sendMessage(from, {
          text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Invalid format, ${userName}! 😡\n│❒ Use: ?bible <book> <chapter>:<verse>\n│❒ Example: ?bible judges 2:3\n│❒ Type ?biblelist for the full list of books\n◈━━━━━━━━━━━━━━━━◈`,
          react: { text: "❌", key: msg.key }
        }, { quoted: msg });
        return;
      }

      const [, bookInput, chapter, verse] = match;

      // Define Bible books mapping (from your biblelist, adjusted for bible-api.com)
      const bibleBooks = {
        // Old Testament
        genesis: "genesis", exodus: "exodus", leviticus: "leviticus", numbers: "numbers", deuteronomy: "deuteronomy",
        joshua: "joshua", judges: "judges", ruth: "ruth", "1 samuel": "1samuel", "2 samuel": "2samuel",
        "1 kings": "1kings", "2 kings": "2kings", "1 chronicles": "1chronicles", "2 chronicles": "2chronicles",
        ezra: "ezra", nehemiah: "nehemiah", esther: "esther", job: "job", psalms: "psalms",
        proverbs: "proverbs", ecclesiastes: "ecclesiastes", "song of solomon": "songofsolomon", isaiah: "isaiah",
        jeremiah: "jeremiah", lamentations: "lamentations", ezekiel: "ezekiel", daniel: "daniel", hosea: "hosea",
        joel: "joel", amos: "amos", obadiah: "obadiah", jonah: "jonah", micah: "micah",
        nahum: "nahum", habakkuk: "habakkuk", zephaniah: "zephaniah", haggai: "haggai", zechariah: "zechariah",
        malachi: "malachi",
        // New Testament
        matthew: "matthew", mark: "mark", luke: "luke", john: "john", acts: "acts",
        romans: "romans", "1 corinthians": "1corinthians", "2 corinthians": "2corinthians", galatians: "galatians",
        ephesians: "ephesians", philippians: "philippians", colossians: "colossians", "1 thessalonians": "1thessalonians",
        "2 thessalonians": "2thessalonians", "1 timothy": "1timothy", "2 timothy": "2timothy", titus: "titus",
        philemon: "philemon", hebrews: "hebrews", james: "james", "1 peter": "1peter", "2 peter": "2peter",
        "1 john": "1john", "2 john": "2john", "3 john": "3john", jude: "jude", revelation: "revelation"
      };

      // Normalize book input (case-insensitive, remove extra spaces)
      const bookKey = bookInput.toLowerCase().trim();
      const bookAbbr = bibleBooks[bookKey];
      if (!bookAbbr) {
        await sock.sendMessage(from, {
          text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Invalid book name, ${userName}! 😡\n│❒ Book "${bookInput}" not found.\n│❒ Type ?biblelist for the full list of books\n◈━━━━━━━━━━━━━━━━◈`,
          react: { text: "❌", key: msg.key }
        }, { quoted: msg });
        return;
      }

      // Notify user that we're fetching the verse
      await sock.sendMessage(from, {
        text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Fetching ${bookInput} ${chapter}:${verse}, ${userName}... 📜\n◈━━━━━━━━━━━━━━━━◈`,
        react: { text: "⏳", key: msg.key }
      }, { quoted: msg });

      console.log(`[bible] Fetching verse: ${bookAbbr} ${chapter}:${verse}`);

      // Fetch verse from Bible API (bible-api.com)
      const apiUrl = `https://bible-api.com/${bookAbbr}+${chapter}:${verse}?translation=kjv`;
      console.log(`[bible] API URL: ${apiUrl}`);
      const response = await fetch(apiUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/115.0.0.0 Safari/537.36'
        }
      });

      if (!response.ok) {
        console.log(`[bible] API fetch failed: ${response.status} ${response.statusText}`);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`[bible] API response received for ${bookAbbr} ${chapter}:${verse}`);

      // Check if verse data is valid
      if (!data.text) {
        console.log(`[bible] Verse not found: ${bookAbbr} ${chapter}:${verse}`);
        await sock.sendMessage(from, {
          text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Verse not found, ${userName}! 😕\n│❒ ${bookInput} ${chapter}:${verse} does not exist.\n│❒ Try a different chapter or verse.\n◈━━━━━━━━━━━━━━━━◈`,
          react: { text: "❌", key: msg.key }
        }, { quoted: msg });
        return;
      }

      // Format the response
      const verseText = data.text.trim();
      const message = `◈━━━━━━━━━━━━━━━━◈\n│❒ NAILED IT, ${userName}! 🔥\n│❒ *${bookInput} ${chapter}:${verse}* (KJV)\n│❒ ${verseText}\n│❒ Powered by HORLA POOKIE Bot\n◈━━━━━━━━━━━━━━━━◈`;

      console.log(`[bible] Sending verse: ${bookAbbr} ${chapter}:${verse}`);
      await sock.sendMessage(from, {
        text: message,
        react: { text: "📖", key: msg.key }
      }, { quoted: msg });

      console.log(`[bible] Verse sent successfully`);

    } catch (error) {
      console.error("[bible] Error:", error.message);
      let errorMessage = `◈━━━━━━━━━━━━━━━━◈\n│❒ FAILED, ${userName}! Could not fetch the verse. 😡\n│❒ Error: ${error.message}\n│❒ Try:\n│❒ • Check the book name\n│❒ • Ensure chapter and verse are valid\n│❒ • Use ?biblelist for book names\n◈━━━━━━━━━━━━━━━━◈`;
      if (error.message.includes("HTTP 404")) {
        errorMessage = `◈━━━━━━━━━━━━━━━━◈\n│❒ FAILED, ${userName}! Verse not found in the API. 😡\n│❒ This might be due to:\n│❒ • Invalid book, chapter, or verse\n│❒ • API issue\n│❒ Try a different verse or check ?biblelist\n◈━━━━━━━━━━━━━━━━◈`;
      } else if (error.message.includes("fetch")) {
        errorMessage = `◈━━━━━━━━━━━━━━━━◈\n│❒ FAILED, ${userName}! Could not connect to the Bible API. 😡\n│❒ Try again later or check your connection.\n◈━━━━━━━━━━━━━━━━◈`;
      }
      await sock.sendMessage(from, {
        text: errorMessage,
        react: { text: "❌", key: msg.key }
      }, { quoted: msg });
    }
  },
};