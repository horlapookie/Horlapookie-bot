
const { ezra } = require("../fredi/ezra");
const axios = require('axios');
const ytSearch = require('yt-search');

// Define the command with aliases
export default {
  name: "song",
  aliases: ["musicdoc", "ytmp3doc", "audiodoc", "mp3doc"],
  description: "Download audio from YouTube as document",
  async execute(msg, { sock, args }) {
    const from = msg.key.remoteJid;
    
    // Check if a query is provided
    if (!args[0]) {
      return await sock.sendMessage(from, { text: "Please provide a audio document name." }, { quoted: msg });
    }

    const query = args.join(" ");

    try {
      // Perform a YouTube search based on the query
      const searchResults = await ytSearch(query);

      // Check if any videos were found
      if (!searchResults || !searchResults.videos.length) {
        return await sock.sendMessage(from, { text: 'No audio document found for the specified query.' }, { quoted: msg });
      }

      const firstVideo = searchResults.videos[0];
      const videoUrl = firstVideo.url;

      // Function to get download data from APIs
      const getDownloadData = async (url) => {
        try {
          const response = await axios.get(url);
          return response.data;
        } catch (error) {
          console.error('Error fetching data from API:', error);
          return { success: false };
        }
      };

      // List of APIs to try
      const apis = [
        `https://api-rin-tohsaka.vercel.app/download/ytmp4?url=${encodeURIComponent(videoUrl)}`,
        `https://api.davidcyriltech.my.id/download/ytmp3?url=${encodeURIComponent(videoUrl)}`,
        `https://www.dark-yasiya-api.site/download/ytmp3?url=${encodeURIComponent(videoUrl)}`,
        `https://api.giftedtech.web.id/api/download/dlmp3?url=${encodeURIComponent(videoUrl)}&apikey=gifted-md`,
        `https://api.dreaded.site/api/ytdl/audio?url=${encodeURIComponent(videoUrl)}`
      ];

      let downloadData;
      for (const api of apis) {
        downloadData = await getDownloadData(api);
        if (downloadData && downloadData.success) break;
      }

      // Check if a valid download URL was found
      if (!downloadData || !downloadData.success) {
        return await sock.sendMessage(from, { text: 'Failed to retrieve download URL from all sources. Please try again later.' }, { quoted: msg });
      }

      const downloadUrl = downloadData.result.download_url;
      const videoDetails = downloadData.result;

      // Prepare the message payload with external ad details
      const messagePayload = {
        document: { url: downloadUrl },
        mimetype: 'audio/mp4',
        contextInfo: {
          externalAdReply: {
            title: videoDetails.title,
            body: videoDetails.title,
            mediaType: 1,
            sourceUrl: 'https://whatsapp.com/channel/0029VawCel7GOj9ktLjkxQ3g',
            thumbnailUrl: firstVideo.thumbnail,
            renderLargerThumbnail: false,
            showAdAttribution: true,
          },
        },
      };

      // Send the download link to the user
      await sock.sendMessage(from, messagePayload, { quoted: msg });

    } catch (error) {
      console.error('Error during download process:', error);
      return await sock.sendMessage(from, { text: `Download failed due to an error: ${error.message || error}` }, { quoted: msg });
    }
  }
};
