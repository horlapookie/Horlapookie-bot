

import axios from 'axios';

export default {
    name: 'gitcommits',
    description: 'Get recent commits from a GitHub repository',
    async execute(msg, { sock, args }) {
        if (args.length < 2) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: '❌ Please provide username and repository name.\nUsage: ?gitcommits username repository' 
            }, { quoted: msg });
            return;
        }

        const username = args[0];
        const repoName = args[1];
        
        try {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: '🔍 Fetching recent commits...' 
            }, { quoted: msg });

            const response = await axios.get(`https://api.github.com/repos/${username}/${repoName}/commits?per_page=5`);
            const commits = response.data;

            if (!commits.length) {
                await sock.sendMessage(msg.key.remoteJid, { 
                    text: '❌ No commits found in this repository.' 
                }, { quoted: msg });
                return;
            }

            

            let commitsList = `📝 **Recent Commits - ${username}/${repoName}**\n\n`;

            commits.forEach((commit, index) => {
                const message = commit.commit.message.split('\n')[0]; // First line only
                const author = commit.commit.author.name;
                const date = new Date(commit.commit.author.date).toLocaleDateString();
                const sha = commit.sha.substring(0, 7);

                commitsList += `**${index + 1}. ${message}**\n`;
                commitsList += `👤 ${author} | 📅 ${date} | 🔗 ${sha}\n`;
                commitsList += `${commit.html_url}\n\n`;
            });

            await sock.sendMessage(msg.key.remoteJid, {
                text: commitsList
            }, { quoted: msg });

        } catch (error) {
            console.error('GitHub API error:', error);
            await sock.sendMessage(msg.key.remoteJid, { 
                text: '❌ Repository not found or GitHub API error. Please check the username and repository name.' 
            }, { quoted: msg });
        }
    }
};
