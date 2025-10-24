

import axios from 'axios';

export default {
    name: 'gittrending',
    description: 'Get trending GitHub repositories',
    async execute(msg, { sock, args }) {
        const language = args[0] || '';
        const period = args[1] || 'daily'; // daily, weekly, monthly
        
        try {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: '🔥 Fetching trending repositories...' 
            }, { quoted: msg });

            // Use GitHub trending algorithm: recent repos sorted by stars created within time period
            let dateFilter = '';
            const now = new Date();
            
            if (period === 'weekly') {
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                dateFilter = `created:>${weekAgo.toISOString().split('T')[0]}`;
            } else if (period === 'monthly') {
                const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                dateFilter = `created:>${monthAgo.toISOString().split('T')[0]}`;
            } else {
                const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                dateFilter = `created:>${dayAgo.toISOString().split('T')[0]}`;
            }

            const languageQuery = language ? `language:${language}` : '';
            const query = [languageQuery, dateFilter].filter(Boolean).join(' ');
            
            const response = await axios.get(`https://api.github.com/search/repositories`, {
                params: {
                    q: query || 'stars:>1',
                    sort: 'stars',
                    order: 'desc',
                    per_page: 5
                }
            });
            
            const repos = response.data.items;

            if (!repos.length) {
                await sock.sendMessage(msg.key.remoteJid, { 
                    text: '❌ No trending repositories found for the specified criteria.' 
                }, { quoted: msg });
                return;
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: `🔥 **Trending GitHub Repositories**\n${language ? `Language: ${language}` : 'All Languages'} | Period: ${period}`
            }, { quoted: msg });

            let trendingList = '';

            repos.slice(0, 5).forEach((repo, index) => {
                trendingList += `**${index + 1}. ${repo.name}**\n`;
                trendingList += `👤 ${repo.owner.login}\n`;
                trendingList += `📝 ${repo.description?.substring(0, 100) || 'No description'}${repo.description?.length > 100 ? '...' : ''}\n`;
                trendingList += `🏷️ ${repo.language || 'Unknown'} | ⭐ ${repo.stargazers_count} | 🍴 ${repo.forks_count}\n`;
                trendingList += `🔗 ${repo.html_url}\n\n`;
            });

            await sock.sendMessage(msg.key.remoteJid, { 
                text: trendingList 
            }, { quoted: msg });

        } catch (error) {
            console.error('GitHub API error:', error);
            await sock.sendMessage(msg.key.remoteJid, { 
                text: '❌ Failed to fetch trending repositories. This might be due to GitHub API rate limits. Please try again later.' 
            }, { quoted: msg });
        }
    }
};
