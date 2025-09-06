
import ytdl from "@distube/ytdl-core";
import yts from "yt-search";
import fs from "fs";
import path from "path";
import os from "os";

export default {
  name: 'video',
  description: 'Download video from YouTube',
  aliases: ['vid', 'ytv'],
  async execute(msg, { sock, args, settings }) {
    const from = msg.key.remoteJid;

    if (!args[0]) {
      return await sock.sendMessage(from, {
        text: `*🎬 Video Downloader*\n\nUsage: ${settings.prefix}video <video name or URL>\n\nExample: ${settings.prefix}video funny cats`
      }, { quoted: msg });
    }

    try {
      const query = args.join(' ');
      let videoUrl = "";
      
      await sock.sendMessage(from, {
        text: `🎬 *Searching for video...*\n\n🔍 Query: "${query}"\n⏳ Please wait...`
      }, { quoted: msg });

      let searchResult;
      // Check if it's already a YouTube URL
      if (ytdl.validateURL(query)) {
        videoUrl = query;
      } else {
        // Search for the video
        searchResult = await yts(query);
        if (!searchResult.videos.length) {
          return await sock.sendMessage(from, {
            text: "❌ No video results found for your search."
          }, { quoted: msg });
        }
        videoUrl = searchResult.videos[0].url;
        
        // Show search result info
        const video = searchResult.videos[0];
        const searchInfo = `🎬 *Found Video:*\n\n` +
          `📺 *Title:* ${video.title}\n` +
          `👤 *Channel:* ${video.author.name}\n` +
          `⏱️ *Duration:* ${video.timestamp}\n` +
          `👀 *Views:* ${video.views.toLocaleString()}\n` +
          `📅 *Uploaded:* ${video.ago}\n` +
          `🔗 *URL:* ${video.url}\n\n` +
          `⏬ Starting download...`;
        
        await sock.sendMessage(from, {
          image: { url: video.thumbnail },
          caption: searchInfo
        }, { quoted: msg });
      }

      // Get video info
      const info = await ytdl.getInfo(videoUrl);
      const titleRaw = info.videoDetails.title;
      const safeTitle = titleRaw.replace(/[^a-z0-9]/gi, "_").substring(0, 60);
      const tmpDir = path.join(process.cwd(), "tmp");

      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

      const filePath = path.join(tmpDir, `${safeTitle}.mp4`);

      // Send initial progress message
      const progressMsg = await sock.sendMessage(from, {
        text: `⏳ Downloading video: ${titleRaw}\nTime elapsed: 0s`
      }, { quoted: msg });

      let elapsed = 0;
      const interval = setInterval(() => {
        elapsed++;
        sock.sendMessage(from, {
          text: `⏳ Downloading video: ${titleRaw}\nTime elapsed: ${elapsed}s`
        }, { quoted: msg }).catch(() => {});
      }, 1000);

      // Download video (audio + video)
      const stream = ytdl(videoUrl, {
        filter: "audioandvideo",
        quality: "highest",
      });

      const writeStream = fs.createWriteStream(filePath);
      stream.pipe(writeStream);

      writeStream.on("finish", async () => {
        clearInterval(interval);
        
        try {
          // Check file size (limit to 100MB for WhatsApp)
          const stats = fs.statSync(filePath);
          if (stats.size > 100 * 1024 * 1024) {
            await sock.sendMessage(from, {
              text: "❌ Video file too large (>100MB). Please try a shorter video."
            }, { quoted: msg });
            fs.unlinkSync(filePath);
            return;
          }

          // Send the video file
          await sock.sendMessage(from, {
            video: { url: filePath },
            caption: `🎬 *${titleRaw}*\n\n✅ Downloaded successfully!`,
            fileName: `${safeTitle}.mp4`
          }, { quoted: msg });

          // Clean up
          fs.unlinkSync(filePath);
        } catch (error) {
          clearInterval(interval);
          console.error("Error sending video:", error);
          await sock.sendMessage(from, {
            text: `❌ Error sending video: ${error.message}`
          }, { quoted: msg });
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
      });

      writeStream.on("error", async (error) => {
        clearInterval(interval);
        console.error("Download error:", error);
        await sock.sendMessage(from, {
          text: `❌ Download failed: ${error.message}`
        }, { quoted: msg });
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      });

    } catch (error) {
      console.log('Video command error:', error.message);
      await sock.sendMessage(from, {
        text: `❌ Error downloading video: ${error.message}`
      }, { quoted: msg });
    }
  }
};
