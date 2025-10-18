
import moment from 'moment-timezone';
import config from '../config.js';

export default {
  name: 'biblelist',
  description: '📖 Display list of all Holy Bible books with their numbers',
  aliases: ['bible-list', 'holybooks'],
  async execute(msg, { sock }) {
    console.log(`[INFO] Executing biblelist command for message ID: ${msg.key.id}, from: ${msg.key.remoteJid}`);

    try {
      moment.tz.setDefault("Africa/Lagos");
      const time = moment().format('HH:mm:ss');
      const date = moment().format('DD/MM/YYYY');

      let infoMsg = `
🤲🕍  ┈─• *HOLY BIBLE* •─┈  🕍🤲

💫 All Holy books and their numbers list
For getting books type ${config.prefix}bible judges 2:3 Or ${config.prefix}bible judges 3:6 💫🌸 

📜 *Old Testament.* 📜
1. 🧬 Genesis 
2. ♟️ Exodus 
3. 🕴️ Leviticus 
4. 🔢 Numbers 
5. 🗞️ Deuteronomy 
6. 🍁 Joshua 
7. 👨‍⚖️ Judges 
8. 🌹 Ruth 
9. 🥀 1 Samuel 
10. 🌺 2 Samuel 
11. 🌷 1 Kings 
12. 👑 2 Kings
13. 🪷 1 Chronicles 
14. 🌸 2 Chronicles 
15. 💮 Ezra 
16. 🏵️ Nehemiah 
17. 🌻 Esther 
18. 🌼 Job 
19. 🍂 Psalms 
20. 🍄 Proverbs 
21. 🌾 Ecclesiastes 
22. 🌱 Song of Solomon 
23. 🌿 Isaiah 
24. 🍃 Jeremiah 
25. ☘️ Lamentations 
26. 🍀 Ezekiel 
27. 🪴 Daniel 
28. 🌵 Hosea 
29. 🌴 Joel 
30. 🌳 Amos 
31. 🌲 Obadiah 
32. 🪵 Jonah 
33. 🪹 Micah 
34. 🪺 Nahum 
35. 🏜️ Habakkuk 
36. 🏞️ Zephaniah 
37. 🏝️ Haggai 
38. 🌅 Zechariah 
39. 🌄 Malachi 

📖 *New Testament.* 📖
1. 🌈 Matthew 
2. ☔ Mark 
3. 💧 Luke 
4. ☁️ John 
5. 🌨️ Acts 
6. 🌧️ Romans 
7. 🌩️ 1 Corinthians 
8. 🌦️ 2 Corinthians 
9. ⛈️ Galatians 
10. 🌥️ Ephesians 
11. ⛅ Philippians 
12. 🌤️ Colossians 
13. ☀️ 1 Thessalonians 
14. 🪐 2 Thessalonians 
15. 🌞 1 Timothy 
16. 🌝 2 Timothy 
17. 🌚 Titus 
18. 🌜 Philemon 
19. 🌛 Hebrews 
20. ⭐ James 
21. 🌟 1 Peter 
22. ✨ 2 Peter 
23. 💫 1 John 
24. 🌙 2 John 
25. ☄️ 3 John 
26. 🌠 Jude 
27. 🌌 Revelation 

📜 BY *${config.botName}* ⚪
`;

      let menuMsg = `
> *POWERED BY ${config.botName.toUpperCase()}*

> ©ᴘᴏᴡᴇʀᴇᴅ ʙʏ ${config.ownerName}
`;

      console.log(`[INFO] Sending Bible list to: ${msg.key.remoteJid}`);
      
      await sock.sendMessage(msg.key.remoteJid, {
        text: infoMsg + menuMsg,
        contextInfo: {
          externalAdReply: {
            title: `*${config.botName}* HOLY BIBLE LIST`,
            body: "Live with God my friends, you don't know your tomorrow",
            thumbnailUrl: "https://i.imgur.com/bibleimage.jpg",
            sourceUrl: "https://whatsapp.com/channel/0029Vb6AZrY2f3EMgD8kRQ01",
            mediaType: 1,
            renderLargerThumbnail: true
          }
        }
      }, { quoted: msg });

      console.log(`[INFO] Bible list sent successfully to: ${msg.key.remoteJid}`);
    } catch (error) {
      console.error(`[ERROR] Failed to send Bible list to ${msg.key.remoteJid}:`, error.message);
      if (msg.key.remoteJid) {
        await sock.sendMessage(msg.key.remoteJid, { 
          text: '❌ Failed to send Bible list. Please try again later.' 
        }, { quoted: msg }).catch((err) => {
          console.error('[ERROR] Failed to send error message:', err.message);
        });
      }
    }
  }
};
