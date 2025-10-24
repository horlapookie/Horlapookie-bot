import fs from 'fs';
import path from 'path';
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
                text: `*📦 GitHub Repository Downloader*\n\nUsage: ?gitrepo <github-url>\n\nExample:\n?gitrepo https://github.com/horlapookie/Horlapookie-bot\n\n*Note:* Supports public repositories only.`
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
                throw new Error(`Download failed: ${zipResponse.status}`);
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