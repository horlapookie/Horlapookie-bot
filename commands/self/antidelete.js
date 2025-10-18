import fs from 'fs';
import path from 'path';
import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import { writeFile } from 'fs/promises';

const messageStore = new Map();
const CONFIG_PATH = path.join(process.cwd(), 'data', 'antidelete.json');
const MESSAGES_JSON_PATH = path.join(process.cwd(), 'data', 'messages.json');
const TEMP_MEDIA_DIR = path.join(process.cwd(), 'tmp');

// Ensure data dir exists
if (!fs.existsSync(path.join(process.cwd(), 'data'))) {
    fs.mkdirSync(path.join(process.cwd(), 'data'), { recursive: true });
}

// Ensure tmp dir exists
if (!fs.existsSync(TEMP_MEDIA_DIR)) {
    fs.mkdirSync(TEMP_MEDIA_DIR, { recursive: true });
}

// Function to get folder size in MB
const getFolderSizeInMB = (folderPath) => {
    try {
        const files = fs.readdirSync(folderPath);
        let totalSize = 0;

        for (const file of files) {
            const filePath = path.join(folderPath, file);
            if (fs.statSync(filePath).isFile()) {
                totalSize += fs.statSync(filePath).size;
            }
        }

        return totalSize / (1024 * 1024); // Convert bytes to MB
    } catch (err) {
        console.error('Error getting folder size:', err);
        return 0;
    }
};

// Function to clean temp folder if size exceeds 100MB
const cleanTempFolderIfLarge = () => {
    try {
        const sizeMB = getFolderSizeInMB(TEMP_MEDIA_DIR);
        
        if (sizeMB > 100) {
            const files = fs.readdirSync(TEMP_MEDIA_DIR);
            for (const file of files) {
                const filePath = path.join(TEMP_MEDIA_DIR, file);
                fs.unlinkSync(filePath);
            }
            console.log('[ANTIDELETE] Cleaned temp folder - size was', sizeMB.toFixed(2), 'MB');
        }
    } catch (err) {
        console.error('Temp cleanup error:', err);
    }
};

// Start periodic cleanup check every 1 minute
setInterval(cleanTempFolderIfLarge, 60 * 1000);

// Load config with proper owner number from main config
function loadAntideleteConfig() {
    try {
        if (!fs.existsSync(CONFIG_PATH)) return { enabled: false };
        const config = JSON.parse(fs.readFileSync(CONFIG_PATH));
        
        // Load main config to get owner number
        try {
            const mainConfigPath = path.join(process.cwd(), 'config.js');
            if (fs.existsSync(mainConfigPath)) {
                // Read and parse config.js to get owner number
                const configContent = fs.readFileSync(mainConfigPath, 'utf8');
                const ownerMatch = configContent.match(/ownerNumber:\s*['"]([^'"]+)['"]/);
                if (ownerMatch) {
                    config.ownerNumber = ownerMatch[1];
                }
            }
        } catch (err) {
            console.error('Failed to load owner number from config:', err);
        }
        
        return config;
    } catch {
        return { enabled: false };
    }
}

// Save config
function saveAntideleteConfig(config) {
    try {
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
    } catch (err) {
        console.error('Config save error:', err);
    }
}

export default {
    name: 'antidelete',
    description: 'Configure anti-delete message tracking (owner only)',
    aliases: ['antidel', 'messagetracker'],
    async execute(msg, { sock, args, isOwner, settings }) {
        const from = msg.key.remoteJid;

        // Only bot owner can use this command
        if (!isOwner) {
            return await sock.sendMessage(from, {
                text: '❌ Only the bot owner can use this command.'
            }, { quoted: msg });
        }

        const config = loadAntideleteConfig();

        if (!args[0]) {
            return await sock.sendMessage(from, {
                text: `🗑️ *ANTIDELETE CONFIGURATION*

📊 **Current Status:** ${config.enabled ? '✅ Enabled' : '❌ Disabled'}

**Commands:**
• \`${settings.prefix}antidelete on\` - Enable anti-delete tracking
• \`${settings.prefix}antidelete off\` - Disable anti-delete tracking
• \`${settings.prefix}antidelete status\` - Check current status

**How it works:**
• Tracks messages in all chats
• Notifies owner when messages are deleted
• Saves media temporarily for recovery
• Auto-cleans temp folder when > 100MB`
            }, { quoted: msg });
        }

        const action = args[0].toLowerCase();

        switch (action) {
            case 'on':
            case 'enable':
                config.enabled = true;
                saveAntideleteConfig(config);
                await sock.sendMessage(from, {
                    text: '✅ *Anti-delete tracking enabled!*\n\n🔍 Now monitoring all chats for deleted messages.'
                }, { quoted: msg });
                break;

            case 'off':
            case 'disable':
                config.enabled = false;
                saveAntideleteConfig(config);
                await sock.sendMessage(from, {
                    text: '❌ *Anti-delete tracking disabled!*'
                }, { quoted: msg });
                break;

            case 'status':
                const sizeMB = getFolderSizeInMB(TEMP_MEDIA_DIR);
                const storedMessages = messageStore.size;
                
                await sock.sendMessage(from, {
                    text: `📊 *ANTIDELETE STATUS*

🔄 **Status:** ${config.enabled ? '✅ Active' : '❌ Inactive'}
💾 **Messages in Memory:** ${storedMessages}
📁 **Temp Folder Size:** ${sizeMB.toFixed(2)} MB`
                }, { quoted: msg });
                break;

            default:
                await sock.sendMessage(from, {
                    text: '❌ Invalid option! Use `' + settings.prefix + 'antidelete` to see available commands.'
                }, { quoted: msg });
        }
    }
};

// Comprehensive message storage to JSON
function saveMessageToJSON(messageData) {
    try {
        let messages = [];
        if (fs.existsSync(MESSAGES_JSON_PATH)) {
            const data = fs.readFileSync(MESSAGES_JSON_PATH, 'utf8');
            messages = JSON.parse(data);
        }

        messages.push(messageData);

        // Keep only last 10000 messages to prevent file from getting too large
        if (messages.length > 10000) {
            messages = messages.slice(-10000);
        }

        fs.writeFileSync(MESSAGES_JSON_PATH, JSON.stringify(messages, null, 2));
    } catch (err) {
        console.error('[MESSAGES] Error saving to JSON:', err);
    }
}

// Store incoming messages (comprehensive storage for ALL messages)
export async function storeMessage(message) {
    try {
        if (!message.key?.id) return;

        const messageId = message.key.id;
        let content = '';
        let mediaType = '';
        let mediaPath = '';

        const sender = message.key.participant || message.key.remoteJid;
        const remoteJid = message.key.remoteJid;
        const isGroup = remoteJid.endsWith('@g.us');
        const timestamp = new Date().toISOString();

        // Extract message content
        if (message.message?.conversation) {
            content = message.message.conversation;
        } else if (message.message?.extendedTextMessage?.text) {
            content = message.message.extendedTextMessage.text;
        } else if (message.message?.imageMessage) {
            mediaType = 'image';
            content = message.message.imageMessage.caption || '';
        } else if (message.message?.videoMessage) {
            mediaType = 'video';
            content = message.message.videoMessage.caption || '';
        } else if (message.message?.audioMessage) {
            mediaType = 'audio';
            content = 'Audio message';
        } else if (message.message?.documentMessage) {
            mediaType = 'document';
            content = message.message.documentMessage.title || 'Document';
        } else if (message.message?.stickerMessage) {
            mediaType = 'sticker';
            content = 'Sticker';
        }

        // Comprehensive message data for JSON storage
        const messageData = {
            id: messageId,
            sender: sender,
            senderNumber: sender.split('@')[0],
            chat: remoteJid,
            chatType: isGroup ? 'group' : 'dm',
            content: content,
            mediaType: mediaType,
            timestamp: timestamp,
            fromMe: message.key.fromMe || false
        };

        // Save ALL messages to JSON (comprehensive storage as requested)
        saveMessageToJSON(messageData);

        // For antidelete tracking (only if enabled)
        const config = loadAntideleteConfig();
        if (!config.enabled) return;

        // Download media files for antidelete tracking
        if (message.message?.imageMessage) {
            try {
                const stream = await downloadContentFromMessage(message.message.imageMessage, 'image');
                const buffer = Buffer.from(await stream.toArray());
                mediaPath = path.join(TEMP_MEDIA_DIR, `${messageId}.jpg`);
                await writeFile(mediaPath, buffer);
            } catch (err) {
                console.error('Error downloading image:', err);
            }
        } else if (message.message?.stickerMessage) {
            try {
                const stream = await downloadContentFromMessage(message.message.stickerMessage, 'sticker');
                const buffer = Buffer.from(await stream.toArray());
                mediaPath = path.join(TEMP_MEDIA_DIR, `${messageId}.webp`);
                await writeFile(mediaPath, buffer);
            } catch (err) {
                console.error('Error downloading sticker:', err);
            }
        } else if (message.message?.videoMessage) {
            try {
                const stream = await downloadContentFromMessage(message.message.videoMessage, 'video');
                const buffer = Buffer.from(await stream.toArray());
                mediaPath = path.join(TEMP_MEDIA_DIR, `${messageId}.mp4`);
                await writeFile(mediaPath, buffer);
            } catch (err) {
                console.error('Error downloading video:', err);
            }
        }

        // Store in memory for deletion detection
        messageStore.set(messageId, {
            content,
            mediaType,
            mediaPath,
            sender,
            group: isGroup ? remoteJid : null,
            timestamp: timestamp
        });

        console.log(`[ANTIDELETE] Stored message ${messageId} from ${sender.split('@')[0]}`);

    } catch (err) {
        console.error('storeMessage error:', err);
    }
}

// Handle message deletion
export async function handleMessageRevocation(sock, updateData) {
    try {
        const config = loadAntideleteConfig();
        if (!config.enabled) {
            console.log('[ANTIDELETE] System disabled, skipping revocation');
            return;
        }

        const messageId = updateData.update?.message?.protocolMessage?.key?.id;
        if (!messageId) {
            console.log('[ANTIDELETE] No message ID found in revocation data');
            return;
        }

        console.log(`[ANTIDELETE] Message deletion detected: ${messageId}`);

        const deletedBy = updateData.key?.participant || updateData.key?.remoteJid;
        const ownerNumber = config.ownerNumber ? `${config.ownerNumber}@s.whatsapp.net` : null;

        if (!ownerNumber) {
            console.error('[ANTIDELETE] Owner number not configured!');
            return;
        }

        // Skip if deleted by bot itself or owner
        if (deletedBy.includes(sock.user.id.split(':')[0]) || deletedBy === ownerNumber) return;

        const original = messageStore.get(messageId);
        if (!original) {
            console.log(`[ANTIDELETE] No stored message found for ID: ${messageId}`);
            return;
        }

        console.log(`[ANTIDELETE] Found deleted message from ${original.sender.split('@')[0]}`);

        const sender = original.sender;
        const senderName = sender.split('@')[0];
        let groupName = '';
        
        if (original.group) {
            try {
                const groupMeta = await sock.groupMetadata(original.group);
                groupName = groupMeta.subject;
            } catch (err) {
                console.error('Error getting group metadata:', err);
                groupName = 'Unknown Group';
            }
        }

        const time = new Date().toLocaleString('en-US', {
            timeZone: 'Africa/Lagos',
            hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit',
            day: '2-digit', month: '2-digit', year: 'numeric'
        });

        let text = `🗑️ *ANTIDELETE ALERT*\n\n` +
            `👤 **Deleted By:** @${deletedBy.split('@')[0]}\n` +
            `📱 **Original Sender:** @${senderName}\n` +
            `📞 **Number:** ${sender}\n` +
            `🕒 **Time:** ${time}\n`;

        if (groupName) text += `👥 **Group:** ${groupName}\n`;

        if (original.content) {
            text += `\n💬 **Deleted Message:**\n${original.content}`;
        }

        console.log(`[ANTIDELETE] Sending deletion alert to owner: ${ownerNumber}`);
        
        await sock.sendMessage(ownerNumber, {
            text,
            mentions: [deletedBy, sender]
        });

        console.log('[ANTIDELETE] Deletion alert sent successfully');

        // Media sending
        if (original.mediaType && fs.existsSync(original.mediaPath)) {
            const mediaOptions = {
                caption: `🗑️ **Deleted ${original.mediaType}**\n👤 From: @${senderName}`,
                mentions: [sender]
            };

            try {
                switch (original.mediaType) {
                    case 'image':
                        await sock.sendMessage(ownerNumber, {
                            image: { url: original.mediaPath },
                            ...mediaOptions
                        });
                        break;
                    case 'sticker':
                        await sock.sendMessage(ownerNumber, {
                            sticker: { url: original.mediaPath },
                            ...mediaOptions
                        });
                        break;
                    case 'video':
                        await sock.sendMessage(ownerNumber, {
                            video: { url: original.mediaPath },
                            ...mediaOptions
                        });
                        break;
                }
            } catch (err) {
                await sock.sendMessage(ownerNumber, {
                    text: `⚠️ Error sending media: ${err.message}`
                });
            }

            // Cleanup
            try {
                fs.unlinkSync(original.mediaPath);
            } catch (err) {
                console.error('Media cleanup error:', err);
            }
        }

        messageStore.delete(messageId);

    } catch (err) {
        console.error('handleMessageRevocation error:', err);
    }
}