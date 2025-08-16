

import axios from 'axios';

export default {
    name: 'gitrepo',
    description: 'Get GitHub repository information',
    async execute(msg, { sock, args }) {
        if (!args.length) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: '❌ Please provide username and repository name or full GitHub URL.\nUsage: ?gitrepo username repository\nOr: ?gitrepo https://github.com/username/repository' 
            }, { quoted: msg });
            return;
        }

        let username, repoName;
        
        // Check if it's a full GitHub URL
        if (args[0].includes('github.com')) {
            const url = args.join(' ');
            const match = url.match(/github\.com\/([^\/]+)\/([^\/\s]+)/);
            if (match) {
                username = match[1];
                repoName = match[2];
            } else {
                await sock.sendMessage(msg.key.remoteJid, { 
                    text: '❌ Invalid GitHub URL format.' 
                }, { quoted: msg });
                return;
            }
        } else if (args.length < 2) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: '❌ Please provide username and repository name.\nUsage: ?gitrepo username repository' 
            }, { quoted: msg });
            return;
        } else {
            username = args[0];
            repoName = args[1];
        }
        
        try {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: '🔍 Fetching repository information...' 
            }, { quoted: msg });

            const response = await axios.get(`https://api.github.com/repos/${username}/${repoName}`);
            const repo = response.data;

            const repoInfo = `📁 **GitHub Repository Info**

📛 **Name:** ${repo.name}
👤 **Owner:** ${repo.owner.login}
📝 **Description:** ${repo.description || 'No description'}
🏷️ **Language:** ${repo.language || 'Not specified'}
⭐ **Stars:** ${repo.stargazers_count}
🍴 **Forks:** ${repo.forks_count}
👀 **Watchers:** ${repo.watchers_count}
📊 **Size:** ${repo.size} KB
📅 **Created:** ${new Date(repo.created_at).toLocaleDateString()}
🔄 **Updated:** ${new Date(repo.updated_at).toLocaleDateString()}
🔒 **Private:** ${repo.private ? 'Yes' : 'No'}
📜 **License:** ${repo.license?.name || 'No license'}
🐛 **Open Issues:** ${repo.open_issues_count}

🔗 **Repository:** ${repo.html_url}
📥 **Clone URL:** ${repo.clone_url}`;

            await sock.sendMessage(msg.key.remoteJid, {
                text: repoInfo
            }, { quoted: msg });

            // Download and send the repository as a zip file
            try {
                await sock.sendMessage(msg.key.remoteJid, { 
                    text: '📦 Downloading repository zip file...' 
                }, { quoted: msg });

                const zipUrl = `https://github.com/${username}/${repoName}/archive/refs/heads/${repo.default_branch || 'main'}.zip`;
                const zipResponse = await axios.get(zipUrl, { responseType: 'arraybuffer' });
                
                const zipBuffer = Buffer.from(zipResponse.data);
                const fileName = `${repoName}-${repo.default_branch || 'main'}.zip`;

                await sock.sendMessage(msg.key.remoteJid, {
                    document: zipBuffer,
                    fileName: fileName,
                    mimetype: 'application/zip',
                    caption: `📁 **${repo.name}** repository zip file\n📊 Size: ${(zipBuffer.length / 1024 / 1024).toFixed(2)} MB`
                }, { quoted: msg });

            } catch (zipError) {
                console.error('Zip download error:', zipError);
                await sock.sendMessage(msg.key.remoteJid, { 
                    text: '❌ Failed to download repository zip file. The repository might be too large or have restricted access.' 
                }, { quoted: msg });
            }

        } catch (error) {
            console.error('GitHub API error:', error);
            await sock.sendMessage(msg.key.remoteJid, { 
                text: '❌ Repository not found or GitHub API error. Please check the username and repository name.' 
            }, { quoted: msg });
        }
    }
};
