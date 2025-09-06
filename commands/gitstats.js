

import axios from 'axios';

export default {
    name: 'gitstats',
    description: 'Get GitHub user statistics and contribution graph',
    async execute(msg, { sock, args }) {
        if (!args.length) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: '❌ Please provide a GitHub username.\nUsage: ?gitstats username' 
            }, { quoted: msg });
            return;
        }

        const username = args[0];
        
        try {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: '📊 Fetching GitHub statistics...' 
            }, { quoted: msg });

            // Get user data and repos
            const [userResponse, reposResponse] = await Promise.all([
                axios.get(`https://api.github.com/users/${username}`),
                axios.get(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`)
            ]);

            const user = userResponse.data;
            const repos = reposResponse.data;

            // Calculate stats
            const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
            const totalForks = repos.reduce((sum, repo) => sum + repo.forks_count, 0);
            const languages = {};
            
            repos.forEach(repo => {
                if (repo.language) {
                    languages[repo.language] = (languages[repo.language] || 0) + 1;
                }
            });

            const topLanguages = Object.entries(languages)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([lang, count]) => `${lang}: ${count}`)
                .join('\n');

            const statsInfo = `📊 **GitHub Statistics for ${username}**

⭐ **Total Stars Earned:** ${totalStars}
🍴 **Total Forks:** ${totalForks}
📚 **Public Repositories:** ${user.public_repos}
👥 **Followers:** ${user.followers}
👤 **Following:** ${user.following}

🔥 **Top Languages:**
${topLanguages || 'No language data'}

📅 **Account Created:** ${new Date(user.created_at).toLocaleDateString()}
🔗 **Profile:** ${user.html_url}`;

            await sock.sendMessage(msg.key.remoteJid, {
                text: statsInfo
            }, { quoted: msg });

        } catch (error) {
            console.error('GitHub API error:', error);
            await sock.sendMessage(msg.key.remoteJid, { 
                text: '❌ User not found or GitHub API error. Please check the username and try again.' 
            }, { quoted: msg });
        }
    }
};
