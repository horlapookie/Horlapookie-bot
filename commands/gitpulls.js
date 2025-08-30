
import axios from 'axios';

export default {
    name: 'gitpulls',
    description: 'Get GitHub repository pull requests',
    async execute(msg, { sock, args }) {
        if (args.length < 2) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: '❌ Please provide username and repository name.\nUsage: ?gitpulls username repository [state]' 
            }, { quoted: msg });
            return;
        }

        const username = args[0];
        const repoName = args[1];
        const state = args[2] || 'open'; // open, closed, all
        
        try {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: '🔍 Fetching pull requests...' 
            }, { quoted: msg });

            const response = await axios.get(`https://api.github.com/repos/${username}/${repoName}/pulls`, {
                params: {
                    state: state,
                    per_page: 5,
                    sort: 'updated'
                },
                timeout: 10000,
                headers: {
                    'User-Agent': 'HORLA-POOKIE-Bot'
                }
            });
            
            const pulls = response.data;

            if (!pulls.length) {
                await sock.sendMessage(msg.key.remoteJid, { 
                    text: `❌ No ${state} pull requests found in this repository.` 
                }, { quoted: msg });
                return;
            }

            let pullsList = `🔀 **${state.toUpperCase()} Pull Requests - ${username}/${repoName}**\n\n`;

            pulls.forEach((pr, index) => {
                const title = pr.title.length > 60 ? pr.title.substring(0, 60) + '...' : pr.title;
                const date = new Date(pr.updated_at).toLocaleDateString();

                pullsList += `**${index + 1}. #${pr.number} ${title}**\n`;
                pullsList += `👤 ${pr.user.login} | 📅 ${date}\n`;
                pullsList += `🎯 ${pr.base.ref} ← ${pr.head.ref}\n`;
                pullsList += `💬 ${pr.comments} comments | 📝 ${pr.commits} commits\n`;
                pullsList += `🔗 ${pr.html_url}\n\n`;
            });

            await sock.sendMessage(msg.key.remoteJid, {
                text: pullsList
            }, { quoted: msg });

        } catch (error) {
            console.error('GitHub API error:', error);
            await sock.sendMessage(msg.key.remoteJid, { 
                text: '❌ Repository not found or GitHub API error. Please check the username and repository name.' 
            }, { quoted: msg });
        }
    }
};
