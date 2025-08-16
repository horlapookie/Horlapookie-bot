import axios from 'axios';
import ytsr from 'ytsr'; // YouTube search library

const PEXELS_API_KEY = 'krKWB9xBdgIz92Zgri5jSHTkYX9kvRMASXg8IgxvkSJoNTTJMS21ctvX';

export default {
  name: 'fap',
  description: 'Send a short funny or adult-friendly video from Pexels or YouTube.',
  onlyMod: false, // anyone can use

  async execute(msg, { sock }) {
    const chatId = msg.key.remoteJid;

    // Helper: search Pexels videos (free, short, funny)
    async function searchPexelsVideo() {
      try {
        const res = await axios.get('https://api.pexels.com/videos/search', {
          headers: { Authorization: PEXELS_API_KEY },
          params: {
            query: 'funny',
            per_page: 10,
            min_duration: 10,
            max_duration: 60,
            orientation: 'portrait',
          }
        });

        const videos = res.data.videos || [];
        if (videos.length === 0) return null;

        // Pick a random video
        const vid = videos[Math.floor(Math.random() * videos.length)];
        // Get the best quality video file (usually last)
        const videoFile = vid.video_files.pop();

        return {
          url: videoFile.link,
          duration: vid.duration,
          user: vid.user.name,
          videoUrl: vid.url
        };
      } catch (e) {
        console.error('Pexels API error:', e.message);
        return null;
      }
    }

    // Helper: search YouTube shorts videos (funny) using ytsr
    async function searchYouTubeVideo() {
      try {
        const filters = await ytsr.getFilters('funny short video');
        const shortFilter = filters.get('Type').get('Shorts') || filters.get('Type').get('Video');

        const searchResults = await ytsr(shortFilter.url, { limit: 20 });
        const videos = searchResults.items.filter(i => i.type === 'video');

        if (videos.length === 0) return null;

        // Pick a random video
        const vid = videos[Math.floor(Math.random() * videos.length)];

        return {
          url: vid.url,
          title: vid.title,
          duration: vid.duration,
          channel: vid.author?.name
        };
      } catch (e) {
        console.error('YouTube search error:', e.message);
        return null;
      }
    }

    // Try Pexels first, then fallback to YouTube
    let video = await searchPexelsVideo();
    let source = 'Pexels';

    if (!video) {
      video = await searchYouTubeVideo();
      source = 'YouTube';
    }

    if (!video) {
      await sock.sendMessage(chatId, { text: '❌ Sorry, no videos found right now. Please try again later.' }, { quoted: msg });
      return;
    }

    // Prepare message based on source
    if (source === 'Pexels') {
      await sock.sendMessage(chatId, {
        video: { url: video.url },
        caption: `🎥 Here's a short funny video from Pexels (duration: ${video.duration}s)\n📽️ By: ${video.user}\n🔗 [Watch on Pexels](${video.videoUrl})`,
        gifPlayback: false,
        mentions: [msg.key.participant]
      }, { quoted: msg });

    } else if (source === 'YouTube') {
      await sock.sendMessage(chatId, {
        text: `🎬 Here's a funny short video from YouTube Shorts:\n\n*${video.title}*\nDuration: ${video.duration}\nChannel: ${video.channel}\n🔗 ${video.url}`
      }, { quoted: msg });
    }
  }
};
