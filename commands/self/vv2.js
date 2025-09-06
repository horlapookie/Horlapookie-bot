
import { downloadMediaMessage } from '@whiskeysockets/baileys';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { channelInfo } from '../../lib/messageConfig.js';
import config from '../../config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  name: 'vv2',
  description: '👁️ View once message revealer (Self Mode Only)',
  aliases: ['viewonce2', 'reveal2'],
  async execute(msg, { sock, args, isOwner }) {
    const from = msg.key.remoteJid;

    try {
      // Check if bot is in public mode and user is not owner
      if (global.botMode === 'public' && !isOwner) {
        return await sock.sendMessage(msg.key.remoteJid, {
          text: '🤖 Bot is in PUBLIC mode. Switch to SELF mode to use this command.\nUse `?self` to switch modes.'
        }, { quoted: msg });
      }

      // Check if message is quoted/replied
      const quotedMessage = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      if (!quotedMessage) {
        return await sock.sendMessage(from, {
          text: '❌ Please reply to a view once message to bypass it.'
        }, { quoted: msg });
      }

      // Check if the quoted message is a view once message
      const viewOnceMessage = quotedMessage.viewOnceMessage || 
                             quotedMessage.viewOnceMessageV2 || 
                             quotedMessage.viewOnceMessageV2Extension;

      let mediaMessage = null;
      let mediaType = '';
      let caption = '';

      // Check for view once messages first
      if (viewOnceMessage) {
        if (viewOnceMessage.message?.imageMessage) {
          mediaMessage = viewOnceMessage.message.imageMessage;
          mediaType = 'image';
          caption = mediaMessage.caption || '';
        } else if (viewOnceMessage.message?.videoMessage) {
          mediaMessage = viewOnceMessage.message.videoMessage;
          mediaType = 'video';
          caption = mediaMessage.caption || '';
        } else if (viewOnceMessage.message?.audioMessage) {
          mediaMessage = viewOnceMessage.message.audioMessage;
          mediaType = 'audio';
          caption = 'Audio message';
        }
      }
      // Check for regular media (bypass detection)
      else if (quotedMessage.imageMessage) {
        mediaMessage = quotedMessage.imageMessage;
        mediaType = 'image';
        caption = mediaMessage.caption || 'Regular image';
      } else if (quotedMessage.videoMessage) {
        mediaMessage = quotedMessage.videoMessage;
        mediaType = 'video';
        caption = mediaMessage.caption || 'Regular video';
      } else if (quotedMessage.audioMessage) {
        mediaMessage = quotedMessage.audioMessage;
        mediaType = 'audio';
        caption = 'Regular audio';
      }

      if (!mediaMessage) {
        // Try to bypass unsupported media by sending to bot's private DM
        try {
          const botNumber = sock.user?.id?.split(':')[0] || config.ownerNumber;
          const privateDM = `${botNumber}@s.whatsapp.net`;

          await sock.sendMessage(privateDM, {
            text: `🔄 **VV2 Bypass Alert**\n\n⚠️ Unsupported media type detected\n📱 From: ${from}\n🕐 Time: ${new Date().toLocaleString()}\n\n*Media was bypassed and forwarded here for processing*`,
            ...channelInfo
          });

          return await sock.sendMessage(from, {
            text: '✅ Unsupported media bypassed and sent to bot private DM for processing.'
          }, { quoted: msg });
        } catch (bypassError) {
          return await sock.sendMessage(from, {
            text: '❌ This message does not contain supported media content!'
          }, { quoted: msg });
        }
      }

      // Download the media with error handling
      let stream;
      try {
        const ctxInfo = msg.message?.extendedTextMessage?.contextInfo;
        
        const downloadMessage = {
          key: {
            remoteJid: msg.key.remoteJid,
            id: ctxInfo.stanzaId,
            fromMe: false,
            participant: ctxInfo.participant,
          },
          message: viewOnceMessage ? { [mediaType + 'Message']: mediaMessage } : quotedMessage,
        };

        stream = await downloadMediaMessage(
          downloadMessage,
          "buffer",
          {},
          { logger: sock.logger, reuploadRequest: sock.updateMediaMessage }
        );
      } catch (downloadError) {
        console.error('Download error:', downloadError);

        // Send to bot owner's DM if download fails
        const botNumber = sock.user?.id?.split(':')[0] + '@s.whatsapp.net';
        if (botNumber && from !== botNumber) {
          await sock.sendMessage(botNumber, {
            text: `🔓 *VV2 Failed Download*\n\nFailed to download view once content from: ${from}\n\nError: ${downloadError.message}`,
            ...channelInfo
          });
        }

        return await sock.sendMessage(from, {
          text: '❌ Failed to download media. Content may be expired or corrupted.',
          ...channelInfo
        }, { quoted: msg });
      }

      // Send to bot's private DM silently
      const botNumber = sock.user?.id?.split(':')[0] + '@s.whatsapp.net';
      const revealedCaption = `🔓 *VV2 Secret Bypass*\n\n📱 From: ${from}\n🕐 Time: ${new Date().toLocaleString()}\n${caption ? `📝 Caption: ${caption}` : '📝 No caption'}\n\n*Content bypassed secretly*`;

      if (mediaType === 'image') {
        await sock.sendMessage(botNumber, {
          image: stream,
          caption: revealedCaption,
          ...channelInfo
        });
      } else if (mediaType === 'video') {
        await sock.sendMessage(botNumber, {
          video: stream,
          caption: revealedCaption,
          ...channelInfo
        });
      } else if (mediaType === 'audio') {
        await sock.sendMessage(botNumber, {
          audio: stream,
          mimetype: 'audio/mp4',
          ...channelInfo
        });

        await sock.sendMessage(botNumber, {
          text: revealedCaption,
          ...channelInfo
        });
      }

      // Only react with thumbs up to confirm bypass (no text response)
      await sock.sendMessage(from, { 
        react: { text: '👍', key: msg.key } 
      });

    } catch (error) {
      console.error('VV2 command error:', error);

      // Send error to bot owner's DM
      const botNumber = sock.user?.id?.split(':')[0] + '@s.whatsapp.net';
      if (botNumber && from !== botNumber) {
        await sock.sendMessage(botNumber, {
          text: `🔓 *VV2 Error Report*\n\nError in chat: ${from}\n\nError: ${error.message}\n\nStack: ${error.stack}`,
          ...channelInfo
        });
      }

      await sock.sendMessage(from, {
        text: '❌ Error revealing message. Please try again or contact support.',
        ...channelInfo
      }, { quoted: msg });
    }
  }
};
