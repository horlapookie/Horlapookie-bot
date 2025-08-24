
import axios from 'axios';

export default {
    name: 'gitforks',
    description: 'Get GitHub repository forks',
    async execute(msg, { sock, args }) {
        if (args.length < 2) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: '❌ Please provide username and repository name.\nUsage: ?gitforks username repository' 
            }, { quoted: msg });
            return;
        }

        const username = args[0];
        const repoName = args[1];
        
        try {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: '🔍 Fetching repository forks...' 
            }, { quoted: msg });

            const response = await axios.get(`https://api.github.com/repos/${username}/${repoName}/forks`, {
                params: {
                    sort: 'stargazers',
                    per_page: 5
                },
                timeout: 10000,
                headers: {
                    'User-Agent': 'HORLA-POOKIE-Bot'
                }
            });
            
            const forks = response.data;

            if (!forks.length) {
                await sock.sendMessage(msg.key.remoteJid, { 
                    text: '❌ No forks found for this repository.' 
                }, { quoted: msg });
                return;
            }

            let forksList = `🍴 **Top Forks - ${username}/${repoName}**\n\n`;

            forks.forEach((fork, index) => {
                const date = new Date(fork.updated_at).toLocaleDateString();

                forksList += `**${index + 1}. ${fork.owner.login}/${fork.name}**\n`;
                forksList += `👤 ${fork.owner.login} | 📅 ${date}\n`;
                forksList += `⭐ ${fork.stargazers_count} | 🍴 ${fork.forks_count}\n`;
                forksList += `🔗 ${fork.html_url}\n\n`;
            });

            await sock.sendMessage(msg.key.remoteJid, {
                text: forksList
            }, { quoted: msg });

        } catch (error) {
            console.error('GitHub API error:', error);
            await sock.sendMessage(msg.key.remoteJid, { 
                text: '❌ Repository not found or GitHub API error. Please check the username and repository name.' 
            }, { quoted: msg });
        }
    }
};
