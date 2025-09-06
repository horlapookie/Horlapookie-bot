
import { channelInfo } from '../lib/messageConfig.js';

export default {
    name: 'lyrics',
    description: '🎵 Search and get song lyrics',
    category: 'Media',
    aliases: ['lyric', 'songlyrics'],
    async execute(msg, { sock, args }) {
        const from = msg.key.remoteJid;
        const songTitle = args.join(' ');

        if (!songTitle) {
            return await sock.sendMessage(from, { 
                text: '🔍 *Lyrics Search*\n\nPlease enter the song name to get the lyrics!\n\n📌 *Usage:* `?lyrics <song name>`',
                ...channelInfo
            }, { quoted: msg });
        }

        try {
            // Show searching message
            await sock.sendMessage(from, {
                text: `🔍 Searching lyrics for "${songTitle}"...\n\nPlease wait a moment... 🎵`,
                ...channelInfo
            }, { quoted: msg });

            // Fetch song lyrics using the API
            const apiUrl = `https://api.giftedtech.web.id/api/search/lyrics?apikey=gifted&query=${encodeURIComponent(songTitle)}`;
            const response = await fetch(apiUrl);
            
            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }
            
            const json = await response.json();
            
            // Check if the API request was successful and has lyrics
            if (!json.success || json.status !== 200 || !json.result || !json.result.lyrics) {
                return await sock.sendMessage(from, { 
                    text: `❌ *Lyrics Not Found*\n\nWe couldn't find lyrics for "${songTitle}".\n\n🔍 *Tip:* Try searching with both song title and artist name.`,
                    ...channelInfo
                }, { quoted: msg });
            }
            
            const { title, artist, image, link, lyrics } = json.result;
            
            // Create a beautiful formatted preview
            const previewLyrics = lyrics.split('\n')
                .filter(line => !line.startsWith('[')) // Remove section headers for preview
                .filter(line => line.trim() !== '')
                .slice(0, 3)
                .map(line => `│ ${line}`)
                .join('\n');
            
            // Format the caption with elegant design
            const caption = `┌───────────────────────┐
│      🎵 *${title.toUpperCase()}*      │
└───────────────────────┘

*🎤 Artist:* ${artist}
*💿 Source:* Genius

┌───────────────────────┐
│      📜 LYRICS PREVIEW      │
└───────────────────────┘
${previewLyrics}
│...

┌───────────────────────────┐
│ *HORLAPOOKIE BOT* • Your Music Companion
└───────────────────────────┘

🌐 *Full lyrics link:* ${link}`;
            
            // Send the image with caption if available
            if (image && image.trim()) {
                await sock.sendMessage(from, {
                    image: { url: image.trim() },
                    caption: caption,
                    ...channelInfo
                }, { quoted: msg });
            } else {
                await sock.sendMessage(from, {
                    text: caption,
                    ...channelInfo
                }, { quoted: msg });
            }
            
            // Send the full lyrics in a beautifully formatted message
            const formattedLyrics = lyrics
                .replace(/\[Verse \d+\]/g, '┌───────────────┐\n│     🎤 VERSE     │\n└───────────────┘')
                .replace(/\[Chorus\]/g, '┌───────────────┐\n│    🎶 CHORUS    │\n└───────────────┘')
                .replace(/\[Bridge\]/g, '┌───────────────┐\n│     🎼 BRIDGE    │\n└───────────────┘')
                .replace(/\[Outro\]/g, '┌───────────────┐\n│     🎤 OUTRO     │\n└───────────────┘')
                .replace(/\[Pre-Chorus\]/g, '┌───────────────┐\n│  🎵 PRE-CHORUS  │\n└───────────────┘');
            
            // Split lyrics if too long (WhatsApp message limit)
            const maxLength = 4000;
            if (formattedLyrics.length > maxLength) {
                const parts = [];
                let current = '';
                const lines = formattedLyrics.split('\n');
                
                for (const line of lines) {
                    if ((current + line + '\n').length > maxLength) {
                        if (current) parts.push(current);
                        current = line + '\n';
                    } else {
                        current += line + '\n';
                    }
                }
                if (current) parts.push(current);
                
                // Send each part
                for (let i = 0; i < parts.length; i++) {
                    const header = i === 0 ? `┌───────────────────────────┐
│      🎵 *${title}*      │
├───────────────────────────┤
│ *Artist:* ${artist}
│ *Part:* ${i + 1}/${parts.length}
├───────────────────────────┤

` : `┌───────────────────────────┐
│      🎵 *${title}* (Part ${i + 1}/${parts.length})      │
├───────────────────────────┤

`;

                    const footer = i === parts.length - 1 ? `
├───────────────────────────┤
│ *HORLAPOOKIE BOT* • Sharing the music magic 🎧
└───────────────────────────┘` : '';

                    await sock.sendMessage(from, {
                        text: header + parts[i] + footer,
                        ...channelInfo
                    }, { quoted: msg });
                    
                    // Small delay between messages
                    if (i < parts.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                }
            } else {
                await sock.sendMessage(from, {
                    text: `┌───────────────────────────┐
│      🎵 *${title}*      │
├───────────────────────────┤
│ *Artist:* ${artist}
│ *Source:* Genius
├───────────────────────────┤

${formattedLyrics}

├───────────────────────────┤
│ *HORLAPOOKIE BOT* • Sharing the music magic 🎧
└───────────────────────────┘`,
                    ...channelInfo
                }, { quoted: msg });
            }

        } catch (error) {
            console.error('Error in lyrics command:', error);
            await sock.sendMessage(from, { 
                text: `❌ *System Error*\n\nAn unexpected error occurred while processing your request.\n\n🔧 *Error:* ${error.message}\n\n📌 *Tip:* Try again later or contact support.`,
                ...channelInfo
            }, { quoted: msg });
        }
    }
};
