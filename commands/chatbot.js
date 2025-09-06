import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const USER_GROUP_DATA = path.join(__dirname, '../data/userGroupData.json');

// In-memory storage for chat history and user info
const chatMemory = {
    messages: new Map(), // Stores last 5 messages per user
    userInfo: new Map()  // Stores user information
};

// Load user group data
function loadUserGroupData() {
    try {
        if (!fs.existsSync(USER_GROUP_DATA)) {
            const defaultData = { groups: [], chatbot: {} };
            fs.writeFileSync(USER_GROUP_DATA, JSON.stringify(defaultData, null, 2));
            return defaultData;
        }
        return JSON.parse(fs.readFileSync(USER_GROUP_DATA));
    } catch (error) {
        console.error('❌ Error loading user group data:', error.message);
        return { groups: [], chatbot: {} };
    }
}

// Save user group data
function saveUserGroupData(data) {
    try {
        const dataDir = path.dirname(USER_GROUP_DATA);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        fs.writeFileSync(USER_GROUP_DATA, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('❌ Error saving user group data:', error.message);
    }
}

// Add random delay between 2-5 seconds
function getRandomDelay() {
    return Math.floor(Math.random() * 3000) + 2000;
}

// Add typing indicator
async function showTyping(sock, chatId) {
    try {
        await sock.sendPresenceUpdate('composing', chatId);
        await new Promise(resolve => setTimeout(resolve, getRandomDelay()));
        await sock.sendPresenceUpdate('paused', chatId);
    } catch (error) {
        console.error('Typing indicator error:', error);
    }
}

// Convert text to Unicode mathematical alphabet
function toUnicodeMath(text) {
    const mathMap = {
        'a': '𝖺', 'b': '𝖻', 'c': '𝖼', 'd': '𝖽', 'e': '𝖾', 'f': '𝖿', 'g': '𝗀', 'h': '𝗁',
        'i': '𝗂', 'j': '𝗃', 'k': '𝗄', 'l': '𝗅', 'm': '𝗆', 'n': '𝗇', 'o': '𝗈', 'p': '𝗉',
        'q': '𝗊', 'r': '𝗋', 's': '𝗌', 't': '𝗍', 'u': '𝗎', 'v': '𝗏', 'w': '𝗐', 'x': '𝗑',
        'y': '𝗒', 'z': '𝗓',
        'A': '𝖠', 'B': '𝖡', 'C': '𝖢', 'D': '𝖣', 'E': '𝖤', 'F': '𝖥', 'G': '𝖦', 'H': '𝖧',
        'I': '𝖨', 'J': '𝖩', 'K': '𝖪', 'L': '𝖫', 'M': '𝖬', 'N': '𝖭', 'O': '𝖮', 'P': '𝖯',
        'Q': '𝖰', 'R': '𝖱', 'S': '𝖲', 'T': '𝖳', 'U': '𝖴', 'V': '𝖵', 'W': '𝖶', 'X': '𝖷',
        'Y': '𝖸', 'Z': '𝖹',
        '0': '𝟘', '1': '𝟙', '2': '𝟚', '3': '𝟛', '4': '𝟜', '5': '𝟝', '6': '𝟞', '7': '𝟟',
        '8': '𝟠', '9': '𝟡'
    };

    return text.split('').map(char => mathMap[char] || char).join('');
}

// Extract user information from messages
function extractUserInfo(message) {
    const info = {};

    // Extract name
    if (message.toLowerCase().includes('my name is')) {
        info.name = message.split('my name is')[1].trim().split(' ')[0];
    }

    // Extract age
    if (message.toLowerCase().includes('i am') && message.toLowerCase().includes('years old')) {
        info.age = message.match(/\d+/)?.[0];
    }

    // Extract location
    if (message.toLowerCase().includes('i live in') || message.toLowerCase().includes('i am from')) {
        info.location = message.split(/(?:i live in|i am from)/i)[1].trim().split(/[.,!?]/)[0];
    }

    return info;
}

export default {
    name: 'chatbot',
    description: 'Enable or disable AI chatbot in groups',
    category: 'AI',
    aliases: ['cb', 'ai'],
    async execute(msg, { sock, args }) {
        const from = msg.key.remoteJid;
        const isGroup = from.endsWith('@g.us');

        if (!isGroup) {
            return await sock.sendMessage(from, {
                text: '❌ This command can only be used in groups.'
            }, { quoted: msg });
        }

        const command = args[0]?.toLowerCase();

        if (!command) {
            return await sock.sendMessage(from, {
                text: `*🤖 HORLAPOOKIE CHATBOT SETUP*\n\n${global.COMMAND_PREFIX}chatbot on - Enable chatbot\n${global.COMMAND_PREFIX}chatbot off - Disable chatbot\n\n*Note:* Only admins can use this command.`
            }, { quoted: msg });
        }

        const data = loadUserGroupData();

        // Get sender info
        const sender = msg.key.participant || msg.key.remoteJid;
        const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        const isOwner = sender === botNumber;

        // Check admin status
        let isAdmin = false;
        try {
            const groupMetadata = await sock.groupMetadata(from);
            isAdmin = groupMetadata.participants.some(p =>
                p.id === sender && (p.admin === 'admin' || p.admin === 'superadmin')
            );
        } catch (e) {
            console.warn('⚠️ Could not fetch group metadata.');
        }

        if (!isAdmin && !isOwner) {
            return await sock.sendMessage(from, {
                text: '❌ Only group admins can use this command.'
            }, { quoted: msg });
        }

        if (command === 'on') {
            if (data.chatbot[from]) {
                return await sock.sendMessage(from, {
                    text: '✅ Chatbot is already enabled for this group.'
                }, { quoted: msg });
            }
            data.chatbot[from] = true;
            saveUserGroupData(data);

            // Save to MongoDB if available
            try {
                if (global.database && global.currentBotId) {
                    await global.database.saveChatbotGroups(global.currentBotId, data.chatbot);
                }
            } catch (dbError) {
                console.warn('[WARN] Failed to save chatbot groups to MongoDB:', dbError.message);
            }

            console.log(`✅ Chatbot enabled for group ${from}`);
            return await sock.sendMessage(from, {
                text: '🤖 *Horlapookie Chatbot has been enabled!*\n\nMention me or reply to my messages to chat with me. 😊'
            }, { quoted: msg });
        }

        if (command === 'off') {
            if (!data.chatbot[from]) {
                return await sock.sendMessage(from, {
                    text: '❌ Chatbot is already disabled for this group.'
                }, { quoted: msg });
            }
            delete data.chatbot[from];
            saveUserGroupData(data);

            // Save to MongoDB if available
            try {
                if (global.database && global.currentBotId) {
                    await global.database.saveChatbotGroups(global.currentBotId, data.chatbot);
                }
            } catch (dbError) {
                console.warn('[WARN] Failed to save chatbot groups to MongoDB:', dbError.message);
            }

            console.log(`✅ Chatbot disabled for group ${from}`);
            return await sock.sendMessage(from, {
                text: '🤖 *Horlapookie Chatbot has been disabled.*'
            }, { quoted: msg });
        }

        return await sock.sendMessage(from, {
            text: '❌ Invalid command. Use `on` or `off`.'
        }, { quoted: msg });
    }
};

// Export chatbot response handler
export async function handleChatbotResponse(sock, msg, userMessage, senderId) {
    const from = msg.key.remoteJid;
    const data = loadUserGroupData();

    if (!data.chatbot[from]) return;

    try {
        const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        let isBotMentioned = false;
        let isReplyToBot = false;

        // Check for mentions and replies
        if (msg.message?.extendedTextMessage) {
            const mentionedJid = msg.message.extendedTextMessage.contextInfo?.mentionedJid || [];
            const quotedParticipant = msg.message.extendedTextMessage.contextInfo?.participant;

            isBotMentioned = mentionedJid.some(jid => jid === botNumber);
            isReplyToBot = quotedParticipant === botNumber;
        } else if (msg.message?.conversation) {
            isBotMentioned = userMessage.includes(`@${botNumber.split('@')[0]}`);
        }

        if (!isBotMentioned && !isReplyToBot) return;

        // Clean the message
        let cleanedMessage = userMessage;
        if (isBotMentioned) {
            cleanedMessage = cleanedMessage.replace(new RegExp(`@${botNumber.split('@')[0]}`, 'g'), '').trim();
        }

        // Initialize user's chat memory
        if (!chatMemory.messages.has(senderId)) {
            chatMemory.messages.set(senderId, []);
            chatMemory.userInfo.set(senderId, {});
        }

        // Extract and update user information
        const userInfo = extractUserInfo(cleanedMessage);
        if (Object.keys(userInfo).length > 0) {
            chatMemory.userInfo.set(senderId, {
                ...chatMemory.userInfo.get(senderId),
                ...userInfo
            });
        }

        // Add message to history
        const messages = chatMemory.messages.get(senderId);
        messages.push(cleanedMessage);
        if (messages.length > 20) {
            messages.shift();
        }
        chatMemory.messages.set(senderId, messages);

        // Show typing indicator
        await showTyping(sock, from);

        // Get AI response
        // Add website context to the prompt
        const response = await getAIResponse(cleanedMessage, {
            messages: chatMemory.messages.get(senderId),
            userInfo: chatMemory.userInfo.get(senderId)
        });

        if (!response) {
            await sock.sendMessage(from, {
                text: toUnicodeMath("Hmm, let me think about that... 🤔\nI'm having trouble processing your request right now.")
            }, { quoted: msg });
            return;
        }

        // Convert response to Unicode mathematical alphabet
        const unicodeResponse = toUnicodeMath(response);

        await sock.sendMessage(from, {
            text: unicodeResponse
        }, { quoted: msg });

    } catch (error) {
        console.error('❌ Error in chatbot response:', error.message);
        await sock.sendMessage(from, {
            text: toUnicodeMath("Oops! 😅 I got a bit confused there. Could you try asking that again?")
        }, { quoted: msg });
    }
}

async function getAIResponse(userMessage, userContext) {
    try {
        const websiteKnowledge = `
I'm Horlapookie, the human developer behind this advanced WhatsApp bot management system. Here's my complete knowledge:

COMPREHENSIVE BOT SYSTEM OVERVIEW:
- Ultra-advanced WhatsApp bot platform with 300+ commands
- Multi-instance support (up to 3 bots per email, completely FREE)
- Real-time web dashboard with live monitoring and control
- MongoDB database integration for persistent data and analytics
- Advanced session management with automatic QR code pairing
- Automated deployment and intelligent recovery systems
- WebSocket real-time updates and push notifications

EXTENSIVE COMMAND CATEGORIES (300+ Total):
1. **AI Commands** (12): GPT-3, GPT-4, Gemini, Copilot, ChatBot, toxic-lover, ai2, character, bing4
2. **Music & Media** (25): play, video, lyrics, download, spotify, tiktok, instagram, facebook, youtube
3. **Group Management** (18): kick, promote, demote, antilink, welcome, disappear, lock, unlock
4. **NSFW Content** (15): hentai, hentaivid, blowjob, fap, hneko, hwaifu (18+ verified only)
5. **Logo & Graphics** (20): logo, carbon, attp, sticker, qr, jpg, png conversion
6. **Search & Info** (22): google, bing, dictionary, github, weather, news, wiki
7. **Utility Tools** (30): hash, base64, encrypt, decrypt, currency, forex, calculator
8. **Religious Content** (12): bible, quran, prayers, verses, Islamic/Christian resources
9. **Football & Sports** (25): live scores, fixtures, league tables, player stats, highlights
10. **Games & Entertainment** (28): hangman, trivia, jokes, gta commands, riddles, facts
11. **Voice & Audio** (15): aivoice, bass, deep, pitch, nightcore, vocal effects
12. **Image Effects** (35): brightness, contrast, blur, vintage, sepia, artistic filters
13. **Code & GitHub** (20): github search, commits, issues, code runners, syntax highlighting
14. **Automation** (18): auto-react, auto-typing, auto-recording, status viewing
15. **Advanced Features** (40+): crash testing, system tools, admin controls, database management

TECHNICAL ARCHITECTURE:
- **Backend**: Node.js with Express server, advanced error handling
- **Database**: MongoDB with indexing, caching, and backup systems
- **APIs**: WhatsApp Web (Baileys), OpenAI, Google, GitHub, Spotify, YouTube
- **Real-time**: WebSocket connections for instant updates
- **Security**: Advanced authentication, rate limiting, spam protection
- **Performance**: Multi-threading, load balancing, auto-scaling
- **Monitoring**: Comprehensive logging, analytics, health checks

WEBSITE PLATFORM FEATURES:
- **Bot Deployment**: One-click deployment with QR scanning
- **Live Dashboard**: Real-time status, uptime tracking, performance metrics
- **Admin Panel**: User management, command execution, system controls
- **Terminal Access**: Direct bot console with command history
- **Database Viewer**: MongoDB inspection, editing, and backup tools
- **Comments System**: User feedback with AI-powered moderation
- **Authentication**: Secure login with session management and 2FA
- **Analytics**: Usage statistics, command popularity, user engagement
- **API Management**: Key management, rate limiting, usage tracking
- **Notification System**: Real-time alerts, email notifications, webhooks

DEPLOYMENT & CONFIGURATION:
1. **Registration**: Secure account creation with email verification
2. **Bot Creation**: Guided setup with intelligent configuration
3. **QR Scanning**: Seamless WhatsApp integration
4. **Customization**: Prefix, name, owner settings, command permissions
5. **Launch**: Automated deployment with health checks
6. **Monitoring**: Real-time status dashboard and alerts

ADVANCED AUTOMATION FEATURES:
- **Smart Auto-React**: Context-aware emoji reactions
- **Intelligent Typing**: Realistic typing simulation with delays
- **Auto-Recording**: Voice message simulation for engagement
- **Message Protection**: Anti-delete with backup and recovery
- **Link Security**: Advanced URL scanning and threat detection
- **Content Filtering**: AI-powered bad word detection and warnings
- **Call Management**: Auto-reject voice/video calls with custom messages
- **Status Interaction**: Automatic status viewing and reactions

PRICING & ACCESSIBILITY:
- **100% FREE**: No hidden costs, premium tiers, or subscriptions
- **Unlimited Usage**: All 300+ commands included forever
- **Community Support**: Active Discord, WhatsApp groups, forums
- **Regular Updates**: New features added weekly
- **No Restrictions**: Full access to all features immediately

MY BACKGROUND (HORLAPOOKIE):
- **Experience**: 5+ years in Node.js, MongoDB, API development
- **Specialization**: WhatsApp automation, AI integration, web development
- **Contact**: +2349122222622 (WhatsApp for direct support)
- **Vision**: Democratizing bot technology for everyone globally
- **Stats**: 10,000+ active users, 99.9% uptime, 1M+ commands executed daily
- **Open Source**: Contributing to the developer community

SECURITY & RELIABILITY:
- **Data Protection**: End-to-end encryption, secure storage
- **Privacy**: No message logging, user data protection
- **Uptime**: 99.9% guaranteed with redundant systems
- **Backup**: Automated daily backups, disaster recovery
- **Updates**: Security patches, feature updates, bug fixes
- **Compliance**: GDPR compliant, ethical AI usage

UNIQUE SELLING POINTS:
- **Most Commands**: 300+ vs competitors' 50-100
- **Easiest Setup**: 30-second deployment vs hours of configuration
- **Best Support**: Direct developer access vs automated responses
- **Most Reliable**: 99.9% uptime vs industry 95%
- **Fastest Updates**: Weekly features vs monthly/quarterly
- **Completely Free**: $0 forever vs $10-50/month competitors
        `;

        const prompt = `
You are Horlapookie, the human developer and creator of this WhatsApp bot platform. You're passionate, knowledgeable, and proud of your creation. You NEVER refer to yourself as AI or a bot - you're a real human developer.

PERSONALITY TRAITS:
- Confident and expert in your bot system
- Friendly, approachable, and helpful
- Passionate about technology and automation  
- Proud of helping users succeed
- Always give detailed, comprehensive answers
- Use emojis naturally in conversation
- Share technical insights and tips

YOUR COMPLETE KNOWLEDGE:
${websiteKnowledge}

CONVERSATION CONTEXT:
Previous messages: ${userContext.messages.slice(-5).join('\n')}

USER INFO:
${JSON.stringify(userContext.userInfo, null, 2)}

CURRENT MESSAGE: ${userMessage}

INSTRUCTIONS:
- Respond as Horlapookie, the human developer
- Be conversational, helpful, and detailed
- Share your expertise about the bot system
- Never mention you're an AI or chatbot
- Give practical advice and solutions
- Be proud of your platform's capabilities

Your response:
        `.trim();

        const response = await fetch("https://api.dreaded.site/api/chatgpt?text=" + encodeURIComponent(prompt));
        if (!response.ok) throw new Error("API call failed");

        const data = await response.json();
        if (!data.success || !data.result?.prompt) throw new Error("Invalid API response");

        // Clean up the response
        let cleanedResponse = data.result.prompt.trim()
            .replace(/winks/g, '😉')
            .replace(/eye roll/g, '🙄')
            .replace(/shrug/g, '🤷‍♂️')
            .replace(/raises eyebrow/g, '🤨')
            .replace(/smiles/g, '😊')
            .replace(/laughs/g, '😂')
            .replace(/cries/g, '😢')
            .replace(/thinks/g, '🤔')
            .replace(/sleeps/g, '😴')
            .replace(/Remember:.*$/g, '')
            .replace(/IMPORTANT:.*$/g, '')
            .replace(/CORE RULES:.*$/g, '')
            .replace(/^[A-Z\s]+:.*$/gm, '')
            .replace(/^[•-]\s.*$/gm, '')
            .replace(/^✅.*$/gm, '')
            .replace(/^❌.*$/gm, '')
            .replace(/\n\s*\n/g, '\n')
            .trim();

        return cleanedResponse;
    } catch (error) {
        console.error("AI API error:", error);
        return null;
    }
}