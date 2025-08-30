
import axios from 'axios';

export default {
    name: 'gitissues',
    description: 'Get GitHub repository issues',
    async execute(msg, { sock, args }) {
        if (args.length < 2) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: '❌ Please provide username and repository name.\nUsage: ?gitissues username repository' 
            }, { quoted: msg });
            return;
        }

        const username = args[0];
        const repoName = args[1];
        const state = args[2] || 'open'; // open, closed, all
        
        try {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: '🔍 Fetching repository issues...' 
            }, { quoted: msg });

            const response = await axios.get(`https://api.github.com/repos/${username}/${repoName}/issues`, {
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
            
            const issues = response.data;

            if (!issues.length) {
                await sock.sendMessage(msg.key.remoteJid, { 
                    text: `❌ No ${state} issues found in this repository.` 
                }, { quoted: msg });
                return;
            }

            let issuesList = `🐛 **${state.toUpperCase()} Issues - ${username}/${repoName}**\n\n`;

            issues.forEach((issue, index) => {
                const title = issue.title.length > 60 ? issue.title.substring(0, 60) + '...' : issue.title;
                const labels = issue.labels.map(label => label.name).join(', ');
                const date = new Date(issue.updated_at).toLocaleDateString();

                issuesList += `**${index + 1}. #${issue.number} ${title}**\n`;
                issuesList += `👤 ${issue.user.login} | 📅 ${date}\n`;
                if (labels) issuesList += `🏷️ ${labels}\n`;
                issuesList += `💬 ${issue.comments} comments\n`;
                issuesList += `🔗 ${issue.html_url}\n\n`;
            });

            await sock.sendMessage(msg.key.remoteJid, {
                text: issuesList
            }, { quoted: msg });

        } catch (error) {
            console.error('GitHub API error:', error);
            await sock.sendMessage(msg.key.remoteJid, { 
                text: '❌ Repository not found or GitHub API error. Please check the username and repository name.' 
            }, { quoted: msg });
        }
    }
};
