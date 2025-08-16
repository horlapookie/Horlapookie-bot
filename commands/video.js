import yts from 'yt-search';
import ytdl from 'ytdl-core';
import fs from 'fs';
import path from 'path';

export default {
  name: "video",
  aliases: ["vid", "ytv"],
  description: "Download YouTube videos",
  async execute(msg, { sock, args }) {
    try {
      const searchQuery = args.join(' ').trim();

      if (!searchQuery) {
        await sock.sendMessage(msg.key.remoteJid, {
          text: '📹 *Video Downloader*\n\nPlease provide a search term or YouTube URL.\n\n*Usage:* ?video <search term or URL>\n*Example:* ?video funny cat videos'
        }, { quoted: msg });
        return;
      }

      let videoUrl = '';
      let videoTitle = '';
      let videoThumbnail = '';

      // Check if input is a YouTube link
      if (searchQuery.includes('youtube.com') || searchQuery.includes('youtu.be')) {
        videoUrl = searchQuery;
        try {
          const info = await ytdl.getBasicInfo(videoUrl);
          videoTitle = info.videoDetails.title;
          videoThumbnail = info.videoDetails.thumbnails[0].url;
        } catch (error) {
          await sock.sendMessage(msg.key.remoteJid, {
            text: '❌ Invalid YouTube URL or video not accessible!'
          }, { quoted: msg });
          return;
        }
      } else {
        // Search YouTube for the video
        await sock.sendMessage(msg.key.remoteJid, {
          text: '🔍 Searching for video... Please wait!'
        }, { quoted: msg });

        const { videos } = await yts(searchQuery);
        if (!videos || videos.length === 0) {
          await sock.sendMessage(msg.key.remoteJid, {
            text: '❌ No videos found for your search!'
          }, { quoted: msg });
          return;
        }
        videoUrl = videos[0].url;
        videoTitle = videos[0].title;
        videoThumbnail = videos[0].thumbnail;
      }

      // Send thumbnail with downloading message
      await sock.sendMessage(msg.key.remoteJid, {
        image: { url: videoThumbnail },
        caption: `📹 *${videoTitle}*\n\n⏳ Downloading your video... Please wait!`
      }, { quoted: msg });

      // Send progress message like yt.js
      const progressMsg = await sock.sendMessage(msg.key.remoteJid, {
        text: `⏳ Downloading video: ${videoTitle}\nTime elapsed: 0s`
      }, { quoted: msg });

      let elapsed = 0;
      const interval = setInterval(async () => {
        elapsed++;
        try {
          await sock.sendMessage(msg.key.remoteJid, {
            text: `⏳ Downloading video: ${videoTitle}\nTime elapsed: ${elapsed}s`
          }, { quoted: msg, messageId: progressMsg.key.id });
        } catch (e) {
          // Ignore errors in progress updates
        }
      }, 1000);

      try {
        // Get video info using ytdl-core like yt.js
        const info = await ytdl.getInfo(videoUrl);
        const titleRaw = info.videoDetails.title;
        const safeTitle = titleRaw.replace(/[^a-z0-9]/gi, "_").substring(0, 60);
        const tmpDir = path.join(process.cwd(), "tmp");

        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

        const filePath = path.join(tmpDir, `${safeTitle}.mp4`);

        // Use streaming like yt.js
        const stream = ytdl(videoUrl, {
          filter: "audioandvideo",
          quality: "highestvideo"
        });

        const writeStream = fs.createWriteStream(filePath);
        stream.pipe(writeStream);

        await new Promise((resolve, reject) => {
          writeStream.on("finish", resolve);
          writeStream.on("error", reject);
          stream.on("error", reject);
        });

        clearInterval(interval);

        // Send downloaded video
        const fileData = fs.readFileSync(filePath);
        await sock.sendMessage(msg.key.remoteJid, {
          video: fileData,
          caption: `📹 *${titleRaw}*\n\n✅ Downloaded by HORLA POOKIE Bot`,
          mimetype: "video/mp4"
        }, { quoted: msg });

        fs.unlinkSync(filePath);

      } catch (dlError) {
        clearInterval(interval);
        console.log('Video download failed:', dlError.message);
        await sock.sendMessage(msg.key.remoteJid, {
          text: '❌ Failed to download video. This could be due to:\n\n• Video is too large or restricted\n• Network issues\n• Private video\n\nPlease try with a different video.'
        }, { quoted: msg });
      }

    } catch (error) {
      console.error('Video download error:', error.message);
      await sock.sendMessage(msg.key.remoteJid, {
        text: `❌ Failed to download video. This could be due to:

• Video is too large or restricted
• Network issues  
• Invalid search query
• YouTube API limitations

Please try with a different search term.`
      }, { quoted: msg });
    }
  }
};