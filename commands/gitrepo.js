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

            const response = await axios.get(`https://api.github.com/repos/${username}/${repoName}`, {
                timeout: 10000,
                headers: {
                    'User-Agent': 'HORLA-POOKIE-Bot'
                }
            });
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
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
    name: 'gitrepo',
    description: 'Download GitHub repository as zip file',
    category: 'GitHub Tools',
    aliases: ['repo', 'download-repo', 'git-download'],
    async execute(msg, { sock, args }) {
        const from = msg.key.remoteJid;

        if (!args[0]) {
            return await sock.sendMessage(from, {
                text: `*📦 GitHub Repository Downloader*\n\nUsage: ${global.COMMAND_PREFIX}gitrepo <github-url>\n\nExample:\n${global.COMMAND_PREFIX}gitrepo https://github.com/horlapookie/Horlapookie-bot\n\n*Note:* Supports public repositories only.`
            }, { quoted: msg });
        }

        let repoUrl = args[0];

        // Default to Horlapookie repo if user asks for "this" or "horlapookie"
        if (repoUrl.toLowerCase() === 'this' || repoUrl.toLowerCase() === 'horlapookie') {
            repoUrl = 'https://github.com/horlapookie/Horlapookie-bot';
        }

        // Validate GitHub URL
        const githubRegex = /^https?:\/\/github\.com\/([^\/]+)\/([^\/]+)(?:\/.*)?$/;
        const match = repoUrl.match(githubRegex);

        if (!match) {
            return await sock.sendMessage(from, {
                text: '❌ Invalid GitHub URL. Please provide a valid GitHub repository URL.\n\nExample: https://github.com/username/repository'
            }, { quoted: msg });
        }

        const [, owner, repo] = match;
        const cleanRepo = repo.replace(/\.git$/, ''); // Remove .git suffix if present

        try {
            await sock.sendMessage(from, {
                text: `⏳ Downloading repository: ${owner}/${cleanRepo}\nPlease wait...`
            }, { quoted: msg });

            // GitHub API to get repository info
            const apiUrl = `https://api.github.com/repos/${owner}/${cleanRepo}`;
            const repoResponse = await fetch(apiUrl);

            if (!repoResponse.ok) {
                if (repoResponse.status === 404) {
                    return await sock.sendMessage(from, {
                        text: '❌ Repository not found. Please check if the repository exists and is public.'
                    }, { quoted: msg });
                }
                throw new Error(`GitHub API error: ${repoResponse.status}`);
            }

            const repoData = await repoResponse.json();

            // Download repository as zip
            const downloadUrl = `https://github.com/${owner}/${cleanRepo}/archive/refs/heads/${repoData.default_branch || 'main'}.zip`;
            const zipResponse = await fetch(downloadUrl);

            if (!zipResponse.ok) {
                throw new Error(`Download failed: ${response.status}`);
            }

            const buffer = await zipResponse.arrayBuffer();
            const zipBuffer = Buffer.from(buffer);

            // Send the zip file
            await sock.sendMessage(from, {
                document: zipBuffer,
                mimetype: 'application/zip',
                fileName: `${cleanRepo}-${repoData.default_branch || 'main'}.zip`,
                caption: `📦 *${repoData.name}*\n\n📝 Description: ${repoData.description || 'No description'}\n👨‍💻 Owner: ${repoData.owner.login}\n⭐ Stars: ${repoData.stargazers_count}\n🍴 Forks: ${repoData.forks_count}\n📅 Updated: ${new Date(repoData.updated_at).toLocaleDateString()}\n🌐 Language: ${repoData.language || 'Not specified'}\n\n🔗 Repository: ${repoData.html_url}\n\n*© Horlapookie Bot - GitHub Repository Downloader*`
            }, { quoted: msg });

            console.log(`[GITREPO] Downloaded repository: ${owner}/${cleanRepo}`);

        } catch (error) {
            console.error('GitHub download error:', error);

            let errorMessage = '❌ Failed to download repository.';

            if (error.message.includes('404')) {
                errorMessage = '❌ Repository not found or is private.';
            } else if (error.message.includes('rate limit')) {
                errorMessage = '❌ GitHub rate limit exceeded. Please try again later.';
            } else if (error.message.includes('network')) {
                errorMessage = '❌ Network error. Please check your connection.';
            }

            await sock.sendMessage(from, {
                text: errorMessage
            }, { quoted: msg });
        }
    }
};