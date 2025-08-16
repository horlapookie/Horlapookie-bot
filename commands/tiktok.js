import axios from 'axios';

export default {
  name: 'tiktok',
  description: 'Download TikTok video or audio using link, search term, or username',
  async execute(msg, { sock, args }) {
    const type = args[0]?.toLowerCase();
    const query = args.slice(1).join(' ');

    if (!['video', 'audio', 'watch'].includes(type) || !query) {
      await sock.sendMessage(msg.key.remoteJid, {
        text: `❌ Invalid usage.\n\nUse:\n$tiktok video <link or name>\n$tiktok audio <link or name>\n$tiktok watch <@username>`
      }, { quoted: msg });
      return;
    }

    await sock.sendMessage(msg.key.remoteJid, {
      text: '⏳ Downloading TikTok media, please wait...'
    }, { quoted: msg });

    try {
      if (type === 'watch') {
        const username = query.replace(/^@/, '');
        const res = await axios.get(`https://tikwm.com/api/user/posts?unique_id=${username}&count=1`);
        if (!res.data.data?.videos?.length) throw new Error('No videos found.');
        const video = res.data.data.videos[0];
        await sock.sendMessage(msg.key.remoteJid, {
          video: { url: video.play },
          caption: `🎥 Username: @${username}\n🎬 Title: ${video.title || 'N/A'}\n⏱ Duration: ${video.duration}s`
        }, { quoted: msg });
      } else {
        const encoded = encodeURIComponent(query);
        const res = await axios.get(`https://tikwm.com/api?url=${encoded}`);
        const result = res.data.data;
        if (!result) throw new Error('No result found.');

        const caption = `🎬 Title: ${result.title}\n⏱ Duration: ${result.duration}s\n📥 Source: tikwm.com`;

        if (type === 'video') {
          await sock.sendMessage(msg.key.remoteJid, {
            video: { url: result.play },
            caption
          }, { quoted: msg });
        } else {
          await sock.sendMessage(msg.key.remoteJid, {
            audio: { url: result.music },
            mimetype: 'audio/mp4',
            ptt: false
          }, { quoted: msg });
        }
      }
    } catch (err) {
      console.error('TikTok error:', err.message);
      await sock.sendMessage(msg.key.remoteJid, {
        text: '❌ Failed to download TikTok content. Ensure the link, name, or username is valid.'
      }, { quoted: msg });
    }
  }
};
