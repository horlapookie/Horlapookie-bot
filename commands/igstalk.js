import axios from 'axios';

async function igstalkScraper(username) {
  try {
    const url = `https://www.instagram.com/${username}/?__a=1`;
    const response = await axios.get(url);
    return response.data.graphql.user;
  } catch (error) {
    throw error;
  }
}

export default {
  name: 'igstalk',
  description: '🔎 Stalk Instagram profiles publicly',
  async execute(msg, { sock, args }) {
    if (!args.length) return sock.sendMessage(msg.key.remoteJid, { text: '❗️ Please provide an Instagram username.\nExample: $igstalk natgeo' });
    const username = args[0];
    try {
      const user = await igstalkScraper(username);
      const text = `📸 *${user.full_name}* (@${user.username})\n` +
                   `📝 Bio: ${user.biography || 'No bio'}\n` +
                   `👥 Followers: ${user.edge_followed_by.count}\n` +
                   `👣 Following: ${user.edge_follow.count}\n` +
                   `📱 Posts: ${user.edge_owner_to_timeline_media.count}\n` +
                   `🔗 Link: https://instagram.com/${user.username}`;
      const profilePic = user.profile_pic_url_hd || user.profile_pic_url;
      await sock.sendMessage(msg.key.remoteJid, { image: { url: profilePic }, caption: text });
    } catch (error) {
      await sock.sendMessage(msg.key.remoteJid, { text: '⚠️ Error fetching Instagram profile. Make sure the username is correct and public.' });
    }
  }
};
