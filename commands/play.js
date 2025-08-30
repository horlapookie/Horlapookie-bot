import axios from 'axios';
import yts from 'yt-search';
import https from 'https';

export default {
  name: "play",
  aliases: ["song", "music", "audio"],
  description: '🎵 Download audio from YouTube by searching or URL',
  usage: 'play <search query or YouTube URL>',
  async execute(msg, { sock, args, settings }) {
    const from = msg.key.remoteJid;

    try {
      const searchQuery = args.join(' ').trim();

      if (!searchQuery) {
        await sock.sendMessage(from, { 
          text: '🎵 What song do you want to download?\n\n*Example:*\n• `?play faded alan walker`\n• `?play https://youtu.be/abc123`' 
        }, { quoted: msg });
        return;
      }

      let videoUrl = '';
      let videoTitle = '';
      let videoThumbnail = '';

      // Check if input is a YouTube URL
      const urlPattern = /(?:https?:\/\/)?(?:youtu\.be\/|(?:www\.|m\.)?youtube\.com\/(?:watch\?v=|v\/|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/;
      const urlMatch = searchQuery.match(urlPattern);

      if (urlMatch) {
        videoUrl = searchQuery;
        const videoId = urlMatch[1];
        videoTitle = `YouTube Audio ${videoId}`;
      } else {
        // Search YouTube for the song
        try {
          const { videos } = await yts(searchQuery);
          if (!videos || videos.length === 0) {
            await sock.sendMessage(from, { 
              text: '❌ No songs found for your search!' 
            }, { quoted: msg });
            return;
          }

          videoUrl = videos[0].url;
          videoTitle = videos[0].title;
          videoThumbnail = videos[0].thumbnail;

          // Send preview with thumbnail
          if (videoThumbnail) {
            await sock.sendMessage(from, {
              image: { url: videoThumbnail },
              caption: `🎵 *${videoTitle}*\n\n📥 _Downloading your audio_`
            }, { quoted: msg });
          }
        } catch (searchError) {
          console.error('Search error:', searchError);
          await sock.sendMessage(from, { 
            text: '❌ Failed to search for songs. Please try again.' 
          }, { quoted: msg });
          return;
        }
      }

      // Show downloading message
      await sock.sendMessage(from, {
        text: `🎵 *${videoTitle}*\n\n📥 _Downloading your audio..._`
      }, { quoted: msg });

      // Try multiple audio download APIs
      const apis = [
        `https://api.davidcyriltech.my.id/download/ytmp3?url=${encodeURIComponent(videoUrl)}`,
        `https://api.neoxr.eu/api/youtube?url=${encodeURIComponent(videoUrl)}&type=audio&apikey=69WF0r`,
        `https://api-nodex-js.vercel.app/ytdl/mp3?url=${encodeURIComponent(videoUrl)}`
      ];

      let downloadSuccess = false;

      for (let i = 0; i < apis.length && !downloadSuccess; i++) {
        try {
          console.log(`[AUDIO] Trying API ${i + 1}: ${apis[i]}`);
          
          const response = await axios.get(apis[i], {
            timeout: 60000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            httpsAgent: new https.Agent({
              rejectUnauthorized: false
            })
          });

          let downloadUrl = null;
          let title = videoTitle;

          // Handle different API response formats
          if (response.data) {
            const data = response.data;
            
            if (data.result && data.result.url) {
              downloadUrl = data.result.url;
              title = data.result.title || title;
            } else if (data.data && data.data.url) {
              downloadUrl = data.data.url;
              title = data.data.title || title;
            } else if (data.url) {
              downloadUrl = data.url;
              title = data.title || title;
            } else if (data.download && data.download.url) {
              downloadUrl = data.download.url;
              title = data.title || title;
            }
          }

          if (downloadUrl) {
            // Download the audio file
            console.log(`[AUDIO] Downloading from: ${downloadUrl}`);
            
            const audioResponse = await axios.get(downloadUrl, {
              responseType: 'arraybuffer',
              timeout: 180000,
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
              },
              httpsAgent: new https.Agent({
                rejectUnauthorized: false
              })
            });

            const audioBuffer = Buffer.from(audioResponse.data);
            const fileSizeMB = (audioBuffer.length / 1024 / 1024).toFixed(2);

            console.log(`[AUDIO] Downloaded audio, size: ${fileSizeMB} MB`);

            if (audioBuffer.length === 0) {
              throw new Error('Downloaded file is empty');
            }

            if (audioBuffer.length > 50 * 1024 * 1024) { // 50MB limit for audio
              await sock.sendMessage(from, { 
                text: '❌ Audio file is too large for WhatsApp (>50MB). Try a shorter song.' 
              }, { quoted: msg });
              return;
            }

            // Send the audio
            await sock.sendMessage(from, {
              audio: audioBuffer,
              mimetype: 'audio/mpeg',
              fileName: `${title.replace(/[^\w\s]/gi, '')}.mp3`,
              contextInfo: {
                externalAdReply: {
                  title: title,
                  body: "🎵 HORLA POOKIE BOT",
                  previewType: "PHOTO",
                  thumbnail: videoThumbnail ? { url: videoThumbnail } : undefined,
                  sourceUrl: videoUrl
                }
              }
            }, { quoted: msg });

            downloadSuccess = true;
            console.log(`[AUDIO] Successfully sent audio using API ${i + 1}`);

          } else {
            console.log(`[AUDIO] API ${i + 1} didn't return a download URL`);
          }

        } catch (error) {
          console.error(`[AUDIO] API ${i + 1} failed:`, error.message);
          if (i === apis.length - 1) {
            // Last API failed
            await sock.sendMessage(from, { 
              text: `❌ Download failed: ${error.message.includes('certificate') ? 'Server connection error' : error.message}` 
            }, { quoted: msg });
          }
        }
      }

      if (!downloadSuccess) {
        await sock.sendMessage(from, { 
          text: '❌ All download sources failed. Please try again later or use a different song.' 
        }, { quoted: msg });
      }

    } catch (error) {
      console.log('🎵 Play Command Error:', error.message);
      await sock.sendMessage(from, { 
        text: `❌ Download failed: ${error.message.includes('certificate') ? 'Server connection error' : error.message}` 
      }, { quoted: msg });
    }
  },
};