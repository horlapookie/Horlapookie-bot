
import axios from 'axios';

export default {
    name: 'gitreleases',
    description: 'Get GitHub repository releases',
    async execute(msg, { sock, args }) {
        if (args.length < 2) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: '❌ Please provide username and repository name.\nUsage: ?gitreleases username repository' 
            }, { quoted: msg });
            return;
        }

        const username = args[0];
        const repoName = args[1];
        
        try {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: '🔍 Fetching repository releases...' 
            }, { quoted: msg });

            const response = await axios.get(`https://api.github.com/repos/${username}/${repoName}/releases?per_page=5`, {
                timeout: 10000,
                headers: {
                    'User-Agent': 'HORLA-POOKIE-Bot'
                }
            });
            const releases = response.data;

            if (!releases.length) {
                await sock.sendMessage(msg.key.remoteJid, { 
                    text: '❌ No releases found in this repository.' 
                }, { quoted: msg });
                return;
            }

            let releasesList = `🚀 **Releases - ${username}/${repoName}**\n\n`;

            releases.forEach((release, index) => {
                const date = new Date(release.published_at).toLocaleDateString();
                const body = release.body ? (release.body.length > 100 ? release.body.substring(0, 100) + '...' : release.body) : 'No description';

                releasesList += `**${index + 1}. ${release.name || release.tag_name}**\n`;
                releasesList += `🏷️ ${release.tag_name} | 📅 ${date}\n`;
                releasesList += `📝 ${body}\n`;
                releasesList += `📦 ${release.assets.length} assets | 📥 ${release.assets.reduce((sum, asset) => sum + asset.download_count, 0)} downloads\n`;
                releasesList += `🔗 ${release.html_url}\n\n`;
            });

            await sock.sendMessage(msg.key.remoteJid, {
                text: releasesList
            }, { quoted: msg });

        } catch (error) {
            console.error('GitHub API error:', error);
            await sock.sendMessage(msg.key.remoteJid, { 
                text: '❌ Repository not found or GitHub API error. Please check the username and repository name.' 
            }, { quoted: msg });
        }
    }
};
