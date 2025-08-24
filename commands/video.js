import yts from 'yt-search';
import ytdl from '@distube/ytdl-core';
import fs from 'fs';
import path from 'path';

export default {
  name: "video",
  aliases: ["vid", "ytv"],
  description: "Download YouTube videos",
  async execute(msg, { sock, args }) {
    const from = msg.key.remoteJid;
    const userName = msg.pushName || "User";

    try {
      const searchQuery = args.join(' ').trim();

      if (!searchQuery) {
        await sock.sendMessage(from, {
          text: `◈━━━━━━━━━━━━━━━━◈\n│❒ WAKE UP, ${userName}! Give me a YouTube URL or search term! 😤\n│❒ Usage: ?video <search term or URL>\n│❒ Example: ?video seyi vibez pressure\n◈━━━━━━━━━━━━━━━━◈`,
          react: { text: "❌", key: msg.key }
        }, { quoted: msg });
        return;
      }

      let videoUrl = '';
      let videoTitle = '';
      let videoThumbnail = '';

      // Check if input is a YouTube link
      if (ytdl.validateURL(searchQuery)) {
        videoUrl = searchQuery;
        try {
          console.log('[video] Validating URL:', videoUrl);
          const info = await ytdl.getBasicInfo(videoUrl);
          videoTitle = info.videoDetails.title;
          videoThumbnail = info.videoDetails.thumbnails[0].url;
        } catch (error) {
          console.error('[video] Invalid URL error:', error.message);
          await sock.sendMessage(from, {
            text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Invalid YouTube URL or video not accessible, ${userName}! 😡\n│❒ Error: ${error.message}\n◈━━━━━━━━━━━━━━━━◈`,
            react: { text: "❌", key: msg.key }
          }, { quoted: msg });
          return;
        }
      } else {
        // Search YouTube
        await sock.sendMessage(from, {
          text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Searching for: ${searchQuery} 🔍\n◈━━━━━━━━━━━━━━━━◈`,
          react: { text: "⏳", key: msg.key }
        }, { quoted: msg });

        console.log('[video] Searching for:', searchQuery);
        const searchResult = await yts(searchQuery);
        if (!searchResult.videos.length) {
          console.log('[video] No videos found for:', searchQuery);
          await sock.sendMessage(from, {
            text: `◈━━━━━━━━━━━━━━━━◈\n│❒ NO VIDEOS FOUND, ${userName}! Try different keywords! 😕\n◈━━━━━━━━━━━━━━━━◈`,
            react: { text: "❌", key: msg.key }
          }, { quoted: msg });
          return;
        }
        videoUrl = searchResult.videos[0].url;
        videoTitle = searchResult.videos[0].title;
        videoThumbnail = searchResult.videos[0].thumbnail;
        console.log('[video] Selected video URL:', videoUrl);
      }

      // Send thumbnail
      await sock.sendMessage(from, {
        image: { url: videoThumbnail },
        caption: `◈━━━━━━━━━━━━━━━━◈\n│❒ Video: ${videoTitle.slice(0, 50)}...\n│❒ Downloading video, ${userName}... 📥\n◈━━━━━━━━━━━━━━━━◈`,
        react: { text: "⏳", key: msg.key }
      }, { quoted: msg });

      console.log("[video] Fetching video info:", videoUrl);
      const info = await ytdl.getInfo(videoUrl);
      const titleRaw = info.videoDetails.title;
      const safeTitle = titleRaw.replace(/[^a-z0-9]/gi, "_").substring(0, 60);
      const tmpDir = path.join(process.cwd(), "tmp");

      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

      const filePath = path.join(tmpDir, `${safeTitle}.mp4`);

      // Send initial progress message
      const progressMsg = await sock.sendMessage(from, {
        text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Downloading video: ${titleRaw.slice(0, 50)}...\n│❒ Time elapsed: 0s\n◈━━━━━━━━━━━━━━━━◈`,
        react: { text: "⏳", key: msg.key }
      }, { quoted: msg });

      let elapsed = 0;
      const interval = setInterval(async () => {
        elapsed++;
        try {
          await sock.sendMessage(from, {
            text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Downloading video: ${titleRaw.slice(0, 50)}...\n│❒ Time elapsed: ${elapsed}s\n◈━━━━━━━━━━━━━━━━◈`,
            quoted: msg,
            messageId: progressMsg.key.id
          });
        } catch (e) {
          console.log('[video] Progress update error:', e.message);
        }
      }, 1000);

      console.log("[video] Downloading video from:", videoUrl);
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
      console.log("[video] File saved to:", filePath);

      console.log("[video] Sending video to user");
      const fileData = fs.readFileSync(filePath);
      await sock.sendMessage(from, {
        video: fileData,
        caption: `◈━━━━━━━━━━━━━━━━◈\n│❒ NAILED IT, ${userName}! 🔥\n│❒ Title: ${titleRaw}\n│❒ Downloaded from: ${videoUrl}\n│❒ Powered by HORLA POOKIE Bot\n◈━━━━━━━━━━━━━━━━◈`,
        mimetype: "video/mp4"
      }, { quoted: msg });

      console.log("[video] Video sent successfully");

      // Clean up
      fs.unlinkSync(filePath);
      console.log("[video] Temporary file deleted");

    } catch (error) {
      console.error("[video] Error:", error.message);
      let errorMessage = `◈━━━━━━━━━━━━━━━━◈\n│❒ DOWNLOAD FAILED, ${userName}! Failed to download or send the video. 😡\n│❒ Error: ${error.message}\n│❒ Try:\n│❒ • Different video link\n│❒ • Check if video exists\n│❒ • Use direct YouTube URL\n◈━━━━━━━━━━━━━━━━◈`;
      if (error.message.includes("function")) {
        errorMessage = `◈━━━━━━━━━━━━━━━━◈\n│❒ DOWNLOAD FAILED, ${userName}! Could not extract video streaming function. 😡\n│❒ This might be due to:\n│❒ • Age-restricted or region-locked video\n│❒ • YouTube player changes\n│❒ Try:\n│❒ • Use the direct video URL\n│❒ • Try a different video\n◈━━━━━━━━━━━━━━━━◈`;
      }
      await sock.sendMessage(from, {
        text: errorMessage,
        react: { text: "❌", key: msg.key }
      }, { quoted: msg });
    }
  },
};