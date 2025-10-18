import ytdl from "@distube/ytdl-core";
import yts from "yt-search";
import fs from "fs";
import path from "path";
import os from "os";

export default {
  name: "yt",
  description: "Download YouTube audio/video with progress updates",
  async execute(msg, { sock, args }) {
    if (!args.length) {
      return await sock.sendMessage(
        msg.key.remoteJid,
        { text: "❌ Please provide search keywords or YouTube URL." },
        { quoted: msg }
      );
    }

    let isVideo = false;
    if (args[0].toLowerCase() === "video") {
      isVideo = true;
      args.shift();
    }

    const query = args.join(" ");
    let videoUrl = "";

    try {
      if (ytdl.validateURL(query)) {
        videoUrl = query;
      } else {
        const searchResult = await yts(query);
        if (!searchResult.videos.length) {
          return await sock.sendMessage(
            msg.key.remoteJid,
            { text: "❌ No video results found." },
            { quoted: msg }
          );
        }
        videoUrl = searchResult.videos[0].url;
      }

      const info = await ytdl.getInfo(videoUrl);
      const titleRaw = info.videoDetails.title;
      const safeTitle = titleRaw.replace(/[^a-z0-9]/gi, "_").substring(0, 60);
      const fileExt = isVideo ? "mp4" : "mp3";
      const tmpDir = path.join(process.cwd(), "tmp");

      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

      const filePath = path.join(tmpDir, `${safeTitle}.${fileExt}`);

      // Send initial progress message and save its key for edits
      const progressMsg = await sock.sendMessage(
        msg.key.remoteJid,
        {
          text: `⏳ Downloading ${isVideo ? "video" : "audio"}: ${titleRaw}\nTime elapsed: 0s`,
        },
        { quoted: msg }
      );

      let elapsed = 0;

      const interval = setInterval(async () => {
        elapsed++;
        try {
          // Edit the same message to update the time elapsed
          await sock.sendMessage(
            msg.key.remoteJid,
            {
              text: `⏳ Downloading ${isVideo ? "video" : "audio"}: ${titleRaw}\nTime elapsed: ${elapsed}s`,
              // To edit a message, send with "edit" options referencing the original message id
            },
            { 
              quoted: msg,
              messageId: progressMsg.key.id, // or use 'edit' option if supported by your version of Baileys
              // Depending on your Baileys version, the option might differ.
            }
          );
        } catch (e) {
          // Ignore errors so updates keep going
        }
      }, 1000);

      const stream = ytdl(videoUrl, {
        filter: isVideo ? "audioandvideo" : "audioonly",
        quality: isVideo ? "highestvideo" : "highestaudio",
      });

      const writeStream = fs.createWriteStream(filePath);
      stream.pipe(writeStream);

      await new Promise((resolve, reject) => {
        writeStream.on("finish", resolve);
        writeStream.on("error", reject);
        stream.on("error", reject);
      });

      clearInterval(interval);

      // Send downloaded media
      const fileData = fs.readFileSync(filePath);
      const messagePayload = isVideo
        ? {
            video: fileData,
            caption: titleRaw,
            mimetype: "video/mp4",
          }
        : {
            audio: fileData,
            mimetype: "audio/mpeg",
            ptt: true,
            contextInfo: {
              externalAdReply: {
                title: titleRaw,
                mediaUrl: videoUrl,
              },
            },
          };

      await sock.sendMessage(msg.key.remoteJid, messagePayload, { quoted: msg });

      fs.unlinkSync(filePath);
    } catch (err) {
      console.error("[yt] Error:", err);
      await sock.sendMessage(
        msg.key.remoteJid,
        { text: `❌ Failed: ${err.message}` },
        { quoted: msg }
      );
    }
  },
};
