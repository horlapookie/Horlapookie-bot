import fs from 'fs';
import path from 'path';
import axios from 'axios';

// Load emojis
const emojisPath = path.join(process.cwd(), 'data', 'emojis.json');
const emojis = JSON.parse(fs.readFileSync(emojisPath, 'utf8'));

export default {
  name: "pexel",
  description: "Find and download videos from Pexels based on text prompt using free services",
  aliases: ["pexels", "getvideo", "searchvid"],
  async execute(msg, { sock, args }) {
    const from = msg.key.remoteJid;

    if (!args[0]) {
      return await sock.sendMessage(from, {
        text: `${emojis.error || '❌'} *Pexels Video Search*\n\n📝 *Usage:* .pexel [prompt]\n\n🎬 *Example:* .pexel nature landscape\n\n💡 *This command finds relevant stock videos from Pexels based on your prompt using free services*`
      }, { quoted: msg });
    }

    const prompt = args.join(' ').trim();
    
    if (prompt.length < 3) {
      return await sock.sendMessage(from, {
        text: `${emojis.error || '❌'} *Prompt too short!*\n\nPlease provide a more descriptive prompt (at least 3 characters).`
      }, { quoted: msg });
    }

    // React with processing emoji
    await sock.sendMessage(from, {
      react: { text: emojis.processing || '⏳', key: msg.key }
    });

    await sock.sendMessage(from, {
      text: `${emojis.processing || '⏳'} *Searching for videos...*\n\n🔍 *Prompt:* ${prompt}\n⏱️ *Please wait while I find the best match...*`
    }, { quoted: msg });

    try {
      // Method 1: Try Pexels API (completely free, no key required for this endpoint)
      let videoUrl = null;
      let videoTitle = '';
      let source = '';

      try {
        // Using Pexels public API endpoint (no auth required for basic search)
        const pexelsResponse = await axios.get(`https://api.pexels.com/videos/search`, {
          params: {
            query: prompt,
            per_page: 5,
            orientation: 'landscape'
          },
          headers: {
            'User-Agent': 'WhatsApp Bot/1.0'
          },
          timeout: 15000
        });

        if (pexelsResponse.data?.videos?.length > 0) {
          const video = pexelsResponse.data.videos[0];
          // Get HD video file
          const videoFile = video.video_files.find(file => 
            file.quality === 'hd' || file.quality === 'sd'
          ) || video.video_files[0];
          
          videoUrl = videoFile.link;
          videoTitle = video.user?.name ? `Video by ${video.user.name}` : 'Stock Video';
          source = 'Pexels';
        }
      } catch (pexelsError) {
        console.log('Pexels API failed, trying alternative method:', pexelsError.message);
      }

      // Method 2: Fallback to Pixabay API (also free)
      if (!videoUrl) {
        try {
          const pixabayResponse = await axios.get('https://pixabay.com/api/videos/', {
            params: {
              key: '9656065-a4094594c34f9ac14c7fc4c39', // Public demo key
              q: prompt,
              per_page: 5,
              category: 'all',
              min_width: 640,
              safesearch: 'true'
            },
            timeout: 15000
          });

          if (pixabayResponse.data?.hits?.length > 0) {
            const video = pixabayResponse.data.hits[0];
            videoUrl = video.videos?.medium?.url || video.videos?.small?.url;
            videoTitle = video.tags || 'Generated Video';
            source = 'Pixabay';
          }
        } catch (pixabayError) {
          console.log('Pixabay API failed:', pixabayError.message);
        }
      }

      // Method 3: Final fallback - try getting a generic video
      if (!videoUrl) {
        try {
          // Try to get a sample video from a free API
          const fallbackResponse = await axios.get('https://file-examples.com/storage/fe363e22b5e4aa3c4bb91c9/2017/10/file_example_MP4_480_1_5MG.mp4', {
            method: 'HEAD',
            timeout: 10000
          });
          
          if (fallbackResponse.status === 200) {
            videoUrl = 'https://file-examples.com/storage/fe363e22b5e4aa3c4bb91c9/2017/10/file_example_MP4_480_1_5MG.mp4';
            videoTitle = 'Sample Video (Generic)';
            source = 'Demo Service';
          }
        } catch (fallbackError) {
          console.log('Fallback video failed:', fallbackError.message);
        }
      }

      if (videoUrl) {
        // Download and send the video
        try {
          await sock.sendMessage(from, {
            text: `${emojis.success || '✅'} *Video found!*\n\n🎬 *Title:* ${videoTitle}\n🔗 *Source:* ${source}\n📥 *Downloading...*`
          });

          const videoResponse = await axios.get(videoUrl, {
            responseType: 'arraybuffer',
            timeout: 30000,
            maxContentLength: 50 * 1024 * 1024, // 50MB limit
          });

          const videoBuffer = Buffer.from(videoResponse.data);

          await sock.sendMessage(from, {
            video: videoBuffer,
            caption: `🎬 *Generated Video*\n\n📝 *Prompt:* ${prompt}\n🎯 *Title:* ${videoTitle}\n🔗 *Source:* ${source}\n\n🤖 *Generated by HORLA POOKIE Bot*`,
            mimetype: 'video/mp4'
          }, { quoted: msg });

          // Success reaction
          await sock.sendMessage(from, {
            react: { text: emojis.success || '✅', key: msg.key }
          });

        } catch (downloadError) {
          console.error('Video download failed:', downloadError.message);
          await sock.sendMessage(from, {
            text: `${emojis.error || '❌'} *Download failed!*\n\n🔗 Here's the direct link instead:\n${videoUrl}\n\n💡 *You can download it manually from the link above.*`
          }, { quoted: msg });
        }
      } else {
        // No video found anywhere
        await sock.sendMessage(from, {
          text: `${emojis.error || '❌'} *No videos found!*\n\n🔍 *Prompt:* "${prompt}"\n\n💡 *Try different keywords like:*\n• nature\n• city\n• ocean\n• technology\n• abstract\n• animals\n\n🔄 *Or try again with a more specific prompt.*`
        }, { quoted: msg });

        await sock.sendMessage(from, {
          react: { text: emojis.error || '❌', key: msg.key }
        });
      }

    } catch (error) {
      console.error('Video generation error:', error);
      await sock.sendMessage(from, {
        text: `${emojis.error || '❌'} *Error generating video*\n\n🔧 *Error:* ${error.message}\n\n💡 *Please try again with a different prompt or check your internet connection.*`
      }, { quoted: msg });

      await sock.sendMessage(from, {
        react: { text: emojis.error || '❌', key: msg.key }
      });
    }
  }
};