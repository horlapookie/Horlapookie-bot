
async function isAdmin(sock, chatId, senderId) {
    try {
        const groupMetadata = await sock.groupMetadata(chatId);
        
        // Normalize bot ID
        const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        
        // Normalize sender ID - remove any domain suffix and add @s.whatsapp.net
        const normalizedSenderId = senderId.split('@')[0] + '@s.whatsapp.net';
        
        // Find participant by checking multiple ID formats
        const participant = groupMetadata.participants.find(p => {
            const participantId = p.id.split('@')[0];
            const senderIdNumber = senderId.split('@')[0];
            return participantId === senderIdNumber;
        });
        
        // Find bot in participants
        const bot = groupMetadata.participants.find(p => {
            const participantId = p.id.split('@')[0];
            const botIdNumber = botId.split('@')[0];
            return participantId === botIdNumber;
        });
        
        const isBotAdmin = bot && (bot.admin === 'admin' || bot.admin === 'superadmin');
        const isSenderAdmin = participant && (participant.admin === 'admin' || participant.admin === 'superadmin');

        if (!bot) {
            console.log(`[WARN] Bot not found in participant list for ${chatId}`);
            return { isSenderAdmin, isBotAdmin: false };
        }

        console.log(`[DEBUG] Admin check - Sender: ${isSenderAdmin}, Bot: ${isBotAdmin}`);
        return { isSenderAdmin, isBotAdmin };
    } catch (error) {
        console.error('Error in isAdmin:', error);
        return { isSenderAdmin: false, isBotAdmin: false };
    }
}

export default isAdmin;
