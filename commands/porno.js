import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function getCategories() {
  try {
    const res = await axios.get("https://www.xvideos.com/categories", {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const $ = cheerio.load(res.data);
    const categories = [];

    // Select category links, filter unique, and extract slug from href
    $("a[href^='/categories/']").each((i, el) => {
      const href = $(el).attr("href"); // e.g. /categories/amateur
      if (href) {
        const slug = href.split("/categories/")[1].split(/[/?#]/)[0];
        if (slug && !categories.includes(slug)) categories.push(slug);
      }
    });

    return categories;
  } catch (e) {
    console.error("Failed to fetch categories:", e);
    return [];
  }
}

export default {
  name: "porno",
  description: "Send random adult videos from Xvideos categories",
  async execute(msg, { sock }) {
    try {
      const categories = await getCategories();
      if (categories.length === 0) {
        return await sock.sendMessage(msg.key.remoteJid, {
          text: "Couldn't fetch categories, try again later.",
        });
      }

      // Pick random category from live list
      const category = categories[Math.floor(Math.random() * categories.length)];
      const categoryUrl = `https://www.xvideos.com/categories/${category}`;

      await sock.sendMessage(msg.key.remoteJid, { text: `Searching in category: ${category}` });

      // Fetch category page HTML
      const res = await axios.get(categoryUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
      const $ = cheerio.load(res.data);

      // Collect video page links (grab first 30)
      const videoLinks = [];
      $("div.thumb > a").each((i, el) => {
        if (i < 30) {
          const href = $(el).attr("href");
          if (href && href.startsWith("/video")) {
            videoLinks.push(`https://www.xvideos.com${href}`);
          }
        }
      });

      if (videoLinks.length === 0) {
        return await sock.sendMessage(msg.key.remoteJid, {
          text: "No videos found in this category right now.",
        });
      }

      // Pick random video link
      const randomVideoUrl = videoLinks[Math.floor(Math.random() * videoLinks.length)];

      await sock.sendMessage(msg.key.remoteJid, { text: "Downloading video, please wait..." });

      // Fetch video page
      const videoPage = await axios.get(randomVideoUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
      const $$ = cheerio.load(videoPage.data);

      // Extract direct video URL from page
      let videoSrc = "";
      $$("video#video-player > source").each((i, el) => {
        const src = $$(el).attr("src");
        if (src && src.endsWith(".mp4")) {
          videoSrc = src;
        }
      });

      if (!videoSrc) {
        return await sock.sendMessage(msg.key.remoteJid, {
          text: "Couldn't find direct video URL, try again.",
        });
      }

      // Download video to temp file
      const tempPath = path.join(os.tmpdir(), `video_${Date.now()}.mp4`);
      const writer = fs.createWriteStream(tempPath);

      const response = await axios({
        url: videoSrc,
        method: "GET",
        responseType: "stream",
        headers: { "User-Agent": "Mozilla/5.0" },
      });

      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });

      // Send video file to WhatsApp
      await sock.sendMessage(msg.key.remoteJid, {
        video: { url: tempPath },
        caption: `Here's your random video from category: ${category}`,
      });

      // Delete temp file
      fs.unlinkSync(tempPath);
    } catch (error) {
      console.error("Error in porno command:", error);
      await sock.sendMessage(msg.key.remoteJid, {
        text: "Error fetching video, please try again later.",
      });
    }
  },
};
