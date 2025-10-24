
import axios from 'axios';
import config from '../config.js';

export default {
  name: 'gif',
  description: '🎬 Search and send GIFs from Giphy',
  async execute(msg, { sock, args }) {
    const query = args.join(' ');

    if (!query) {
        await sock.sendMessage(msg.key.remoteJid, {
            text: '🎬 *GIF Search*\n\nPlease provide a search term for the GIF.\n\n*Usage:* ?gif <search term>\n*Example:* ?gif funny cat'
        }, { quoted: msg });
        return;
    }

    try {
        await sock.sendMessage(msg.key.remoteJid, {
            text: '🔍 Searching for GIF... Please wait!'
        }, { quoted: msg });

        const response = await axios.get(`https://api.giphy.com/v1/gifs/search`, {
            params: {
                api_key: config.giphyApiKey,
                q: query,
                limit: 1,
                rating: 'g'
            },
            timeout: 15000
        });

        const gifData = response.data.data[0];
        
        if (gifData) {
            // Try different GIF formats for better compatibility
            const gifUrl = gifData.images?.original?.mp4 || 
                          gifData.images?.downsized_medium?.url || 
                          gifData.images?.original?.url;
            
            if (gifUrl) {
                // Send as proper GIF
                if (gifUrl.endsWith('.mp4')) {
                    // Send MP4 as video with GIF playback
                    await sock.sendMessage(msg.key.remoteJid, { 
                        video: { url: gifUrl },
                        gifPlayback: true,
                        caption: `🎬 *GIF Found!*\n\n📝 **Search:** ${query}\n🎯 **Title:** ${gifData.title}\n⚡ **By:** HORLA POOKIE Bot`
                    }, { quoted: msg });
                } else {
                    // Send as image for static GIFs
                    await sock.sendMessage(msg.key.remoteJid, { 
                        image: { url: gifUrl },
                        caption: `🎬 *GIF Found!*\n\n📝 **Search:** ${query}\n🎯 **Title:** ${gifData.title}\n⚡ **By:** HORLA POOKIE Bot`
                    }, { quoted: msg });
                }
            } else {
                await sock.sendMessage(msg.key.remoteJid, { 
                    text: '❌ Could not get GIF URL. Please try again.' 
                }, { quoted: msg });
            }
        } else {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ No GIFs found for "${query}". Try a different search term.` 
            }, { quoted: msg });
        }
    } catch (error) {
        console.error('Error fetching GIF:', error);
        
        if (error.response?.status === 403) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: '❌ API key issue. Please contact bot admin.' 
            }, { quoted: msg });
        } else {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: '❌ Failed to fetch GIF. Please try again later.' 
            }, { quoted: msg });
        }
    }
  }
};
