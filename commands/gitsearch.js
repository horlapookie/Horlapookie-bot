
import axios from 'axios';

export default {
    name: 'gitsearch',
    description: 'Search GitHub repositories',
    async execute(msg, { sock, args }) {
        if (!args.length) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: '❌ Please provide search query.\nUsage: ?gitsearch <query>' 
            }, { quoted: msg });
            return;
        }

        const query = args.join(' ');
        
        try {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: '🔍 Searching GitHub repositories...' 
            }, { quoted: msg });

            const response = await axios.get(`https://api.github.com/search/repositories`, {
                params: {
                    q: query,
                    sort: 'stars',
                    order: 'desc',
                    per_page: 5
                },
                timeout: 10000,
                headers: {
                    'User-Agent': 'HORLA-POOKIE-Bot'
                }
            });
            
            const repos = response.data.items;

            if (!repos.length) {
                await sock.sendMessage(msg.key.remoteJid, { 
                    text: '❌ No repositories found for your search query.' 
                }, { quoted: msg });
                return;
            }

            let searchResults = `🔍 **Search Results for "${query}"**\n\n`;

            repos.forEach((repo, index) => {
                const description = repo.description ? (repo.description.length > 80 ? repo.description.substring(0, 80) + '...' : repo.description) : 'No description';

                searchResults += `**${index + 1}. ${repo.name}**\n`;
                searchResults += `👤 ${repo.owner.login}\n`;
                searchResults += `📝 ${description}\n`;
                searchResults += `🏷️ ${repo.language || 'Unknown'} | ⭐ ${repo.stargazers_count} | 🍴 ${repo.forks_count}\n`;
                searchResults += `🔗 ${repo.html_url}\n\n`;
            });

            await sock.sendMessage(msg.key.remoteJid, {
                text: searchResults
            }, { quoted: msg });

        } catch (error) {
            console.error('GitHub API error:', error);
            await sock.sendMessage(msg.key.remoteJid, { 
                text: '❌ Failed to search repositories. Please try again later.' 
            }, { quoted: msg });
        }
    }
};
