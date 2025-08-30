import axios from 'axios';
import yts from 'yt-search';
import fs from 'fs';
import path from 'path';
import https from 'https';

export default {
  name: "video",
  aliases: ["vid", "ytv"],
  description: '📹 Download video from YouTube by searching or URL',
  usage: 'video <search query or YouTube URL>',
  async execute(msg, { sock, args, settings }) {
    const from = msg.key.remoteJid;

    try {
      const searchQuery = args.join(' ').trim();

      if (!searchQuery) {
        await sock.sendMessage(from, { 
          text: '📹 What video do you want to download?\n\n*Example:*\n• `?video faded alan walker`\n• `?video https://youtu.be/abc123`' 
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
        // Extract video ID for API call
        const videoId = urlMatch[1];
        videoTitle = `YouTube Video ${videoId}`;
      } else {
        // Search YouTube for the video
        try {
          const { videos } = await yts(searchQuery);
          if (!videos || videos.length === 0) {
            await sock.sendMessage(from, { 
              text: '❌ No videos found for your search!' 
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
              caption: `🎬 *${videoTitle}*\n\n📥 _Downloading your video..._`
            }, { quoted: msg });
          }
        } catch (searchError) {
          console.error('Search error:', searchError);
          await sock.sendMessage(from, { 
            text: '❌ Failed to search for videos. Please try again.' 
          }, { quoted: msg });
          return;
        }
      }

      // Show downloading message
      await sock.sendMessage(from, {
        text: `🎬 *${videoTitle}*\n\n📥 _Downloading your video..._`
      }, { quoted: msg });

      // Try multiple download APIs
      const apis = [
        `https://api.davidcyriltech.my.id/download/ytmp4?url=${encodeURIComponent(videoUrl)}`,
        `https://api.neoxr.eu/api/youtube?url=${encodeURIComponent(videoUrl)}&type=video&apikey=69WF0r`,
        `https://api-nodex-js.vercel.app/ytdl/mp4?url=${encodeURIComponent(videoUrl)}`
      ];

      let downloadSuccess = false;

      for (let i = 0; i < apis.length && !downloadSuccess; i++) {
        try {
          console.log(`[VIDEO] Trying API ${i + 1}: ${apis[i]}`);

          const response = await axios.get(apis[i], {
            timeout: 60000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            // Ignore SSL certificate errors
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
            // Download the video file
            console.log(`[VIDEO] Downloading from: ${downloadUrl}`);

            const videoResponse = await axios.get(downloadUrl, {
              responseType: 'arraybuffer',
              timeout: 180000,
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
              },
              httpsAgent: new https.Agent({
                rejectUnauthorized: false
              })
            });

            const videoBuffer = Buffer.from(videoResponse.data);
            const fileSizeMB = (videoBuffer.length / 1024 / 1024).toFixed(2);

            console.log(`[VIDEO] Downloaded video, size: ${fileSizeMB} MB`);

            if (videoBuffer.length === 0) {
              throw new Error('Downloaded file is empty');
            }

            if (videoBuffer.length > 100 * 1024 * 1024) { // 100MB limit
              await sock.sendMessage(from, { 
                text: '❌ Video is too large for WhatsApp (>100MB). Try a shorter video.' 
              }, { quoted: msg });
              return;
            }

            // Send the video
            await sock.sendMessage(from, {
              video: videoBuffer,
              caption: `🎬 *${title}*\n\n📁 *Size:* ${fileSizeMB} MB\n🤖 *Downloaded by Horla Pookie Bot*`,
              mimetype: 'video/mp4',
              fileName: `${title.replace(/[^\w\s]/gi, '')}.mp4`
            }, { quoted: msg });

            downloadSuccess = true;
            console.log(`[VIDEO] Successfully sent video using API ${i + 1}`);

          } else {
            console.log(`[VIDEO] API ${i + 1} didn't return a download URL`);
          }

        } catch (error) {
          console.error(`[VIDEO] API ${i + 1} failed:`, error.message);
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
          text: '❌ All download sources failed. Please try again later or use a different video.' 
        }, { quoted: msg });
      }

    } catch (error) {
      console.log('📹 Video Command Error:', error.message);
      await sock.sendMessage(from, { 
        text: `❌ Download failed: ${error.message.includes('certificate') ? 'Server connection error' : error.message}` 
      }, { quoted: msg });
    }
  },
};