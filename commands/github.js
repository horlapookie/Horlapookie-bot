

import axios from 'axios';

export default {
    name: 'github',
    description: 'Get GitHub user information',
    async execute(msg, { sock, args }) {
        if (!args.length) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: '❌ Please provide a GitHub username.\nUsage: ?github username' 
            }, { quoted: msg });
            return;
        }

        const username = args[0];
        
        try {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: '🔍 Fetching GitHub user information...' 
            }, { quoted: msg });

            const response = await axios.get(`https://api.github.com/users/${username}`);
            const user = response.data;

            const userInfo = `👨‍💻 **GitHub User Info**

📛 **Name:** ${user.name || 'Not provided'}
🆔 **Username:** ${user.login}
📝 **Bio:** ${user.bio || 'No bio available'}
🏢 **Company:** ${user.company || 'Not specified'}
📍 **Location:** ${user.location || 'Not specified'}
🌐 **Blog:** ${user.blog || 'None'}
📧 **Email:** ${user.email || 'Not public'}
📅 **Joined:** ${new Date(user.created_at).toLocaleDateString()}
👥 **Followers:** ${user.followers}
👤 **Following:** ${user.following}
📚 **Public Repos:** ${user.public_repos}
📋 **Public Gists:** ${user.public_gists}

🔗 **Profile:** ${user.html_url}`;

            await sock.sendMessage(msg.key.remoteJid, {
                text: userInfo
            }, { quoted: msg });

        } catch (error) {
            console.error('GitHub API error:', error);
            await sock.sendMessage(msg.key.remoteJid, { 
                text: '❌ User not found or GitHub API error. Please check the username and try again.' 
            }, { quoted: msg });
        }
    }
};
