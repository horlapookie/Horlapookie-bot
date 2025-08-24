const { isJidGroup } = require('@whiskeysockets/baileys');
const { setAntilink, getAntilink, removeAntilink, getAntilinkSetting } = require('../lib/index');
const isAdmin = require('../lib/isAdmin');
const config = require('../config');
const { incrementWarningCount, resetWarningCount, isSudo } = require('../lib/index');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { tmpdir } = require('os');
const Jimp = require('jimp');

const WARN_COUNT = config.WARN_COUNT || 3;

// Function to handle antilink commands
async function handleAntilinkCommand(sock, chatId, userMessage, senderId, isSenderAdmin) {
    try {
        if (!isSenderAdmin) {
            await sock.sendMessage(chatId, { text: '```For Group Admins Only!```' });
            return;
        }

        const prefix = '.';
        const args = userMessage.slice(prefix.length + 'antilink'.length).toLowerCase().trim().split(' ');
        const action = args[0];

        if (!action) {
            const usage = `\`\`\`ANTILINK SETUP\n\n${prefix}antilink on\n${prefix}antilink set delete | kick | warn\n${prefix}antilink off\n${prefix}antilink get\`\`\``;
            await sock.sendMessage(chatId, { text: usage });
            return;
        }

        switch (action) {
            case 'on':
                const existingConfig = await getAntilink(chatId, 'on');
                if (existingConfig?.enabled) {
                    await sock.sendMessage(chatId, { text: '*_Antilink is already on_*' });
                    return;
                }
                const result = await setAntilink(chatId, 'on', 'delete');
                await sock.sendMessage(chatId, {
                    text: result ? '*_Antilink has been turned ON_*' : '*_Failed to turn on Antilink_*'
                });
                break;

            case 'off':
                await removeAntilink(chatId, 'on');
                await sock.sendMessage(chatId, { text: '*_Antilink has been turned OFF_*' });
                break;

            case 'set':
                if (args.length < 2) {
                    await sock.sendMessage(chatId, {
                        text: `*_Please specify an action: ${prefix}antilink set delete | kick | warn_*`
                    });
                    return;
                }
                const setAction = args[1];
                if (!['delete', 'kick', 'warn'].includes(setAction)) {
                    await sock.sendMessage(chatId, {
                        text: '*_Invalid action. Choose delete, kick, or warn._*'
                    });
                    return;
                }
                const setResult = await setAntilink(chatId, 'on', setAction);
                await sock.sendMessage(chatId, {
                    text: setResult ? `*_Antilink action set to ${setAction}_*` : '*_Failed to set Antilink action_*'
                });
                break;

            case 'get':
                const status = await getAntilink(chatId, 'on');
                const actionConfig = await getAntilink(chatId, 'on');
                await sock.sendMessage(chatId, {
                    text: `*_Antilink Configuration:_*\nStatus: ${status ? 'ON' : 'OFF'}\nAction: ${actionConfig ? actionConfig.action : 'Not set'}`
                });
                break;

            default:
                await sock.sendMessage(chatId, { text: `*_Use ${prefix}antilink for usage._*` });
        }
    } catch (error) {
        console.error('Error in antilink command:', error);
        await sock.sendMessage(chatId, { text: '*_Error processing antilink command_*' });
    }
}

// Function to handle link detection and actions
async function handleLinkDetection(sock, chatId, message, userMessage, senderId) {
    const antilinkSetting = await getAntilinkSetting(chatId);
    if (antilinkSetting === 'off') return;

    console.log(`Antilink Setting for ${chatId}: ${antilinkSetting}`);
    console.log(`Checking message for links: ${userMessage}`);

    let shouldDelete = false;

    const linkPatterns = {
        whatsappGroup: /chat\.whatsapp\.com\/[A-Za-z0-9]{20,}/,
        whatsappChannel: /wa\.me\/channel\/[A-Za-z0-9]{20,}/,
        telegram: /t\.me\/[A-Za-z0-9_]+/,
        allLinks: /https?:\/\/[^\s]+/,
    };

    if (antilinkSetting === 'whatsappGroup' && linkPatterns.whatsappGroup.test(userMessage)) {
        shouldDelete = true;
    } else if (antilinkSetting === 'whatsappChannel' && linkPatterns.whatsappChannel.test(userMessage)) {
        shouldDelete = true;
    } else if (antilinkSetting === 'telegram' && linkPatterns.telegram.test(userMessage)) {
        shouldDelete = true;
    } else if (antilinkSetting === 'allLinks' && linkPatterns.allLinks.test(userMessage)) {
        shouldDelete = true;
    }

    if (shouldDelete) {
        const quotedMessageId = message.key.id;
        const quotedParticipant = message.key.participant || senderId;

        try {
            await sock.sendMessage(chatId, {
                delete: { remoteJid: chatId, fromMe: false, id: quotedMessageId, participant: quotedParticipant },
            });
            console.log(`Message with ID ${quotedMessageId} deleted successfully.`);
        } catch (error) {
            console.error('Failed to delete message:', error);
        }

        const mentionedJidList = [senderId];
        await sock.sendMessage(chatId, { text: `Warning! @${senderId.split('@')[0]}, posting links is not allowed.`, mentions: mentionedJidList });
    } else {
        console.log('No link detected or protection not enabled for this type of link.');
    }
}

// Function to check if a string contains a URL
function containsURL(str) {
	const urlRegex = /(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(\/[^\s]*)?/i;
	return urlRegex.test(str);
}

// Main Antilink handler function
async function Antilink(msg, sock) {
	const jid = msg.key.remoteJid;
	if (!isJidGroup(jid)) return;

	const SenderMessage = msg.message?.conversation ||
						 msg.message?.extendedTextMessage?.text || '';
	if (!SenderMessage || typeof SenderMessage !== 'string') return;

	const sender = msg.key.participant;
	if (!sender) return;

	const isAdmin = await isSudo(sender);
	if (isAdmin) return;

	if (!containsURL(SenderMessage.trim())) return;

	const antilinkConfig = await getAntilink(jid, 'on');
	if (!antilinkConfig) return;

	const action = antilinkConfig.action;

	try {
		await sock.sendMessage(jid, { delete: msg.key });

		switch (action) {
			case 'delete':
				await sock.sendMessage(jid, {
					text: `\`\`\`@${sender.split('@')[0]} link are not allowed here\`\`\``,
					mentions: [sender]
				});
				break;

			case 'kick':
				await sock.groupParticipantsUpdate(jid, [sender], 'remove');
				await sock.sendMessage(jid, {
					text: `\`\`\`@${sender.split('@')[0]} has been kicked for sending links\`\`\``,
					mentions: [sender]
				});
				break;

			case 'warn':
				const warningCount = await incrementWarningCount(jid, sender);
				if (warningCount >= WARN_COUNT) {
					await sock.groupParticipantsUpdate(jid, [sender], 'remove');
					await resetWarningCount(jid, sender);
					await sock.sendMessage(jid, {
						text: `\`\`\`@${sender.split('@')[0]} has been kicked after ${WARN_COUNT} warnings\`\`\``,
						mentions: [sender]
					});
				} else {
					await sock.sendMessage(jid, {
						text: `\`\`\`@${sender.split('@')[0]} warning ${warningCount}/${WARN_COUNT} for sending links\`\`\``,
						mentions: [sender]
					});
				}
				break;
		}
	} catch (error) {
		console.error('Error in Antilink:', error);
	}
}


// Function to blur an image using Jimp
async function blurImage(inputPath, outputPath, blurAmount = 5) {
    try {
        const image = await Jimp.read(inputPath);
        await image.blur(blurAmount);
        await image.writeAsync(outputPath);
        return true;
    } catch (error) {
        console.error("Error blurring image:", error);
        return false;
    }
}

// Function to convert video to GIF using FFmpeg
async function videoToGif(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
        const ffmpegPath = require.resolve('ffmpeg-static');
        const command = `"${ffmpegPath}" -i "${inputPath}" -vf "fps=10,split[s0][s1];[s0]palette_rgb[p];[s1][p]paletteuse" -y "${outputPath}"`;

        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`FFmpeg error: ${error.message}`);
                console.error(`FFmpeg stderr: ${stderr}`);
                return reject(error);
            }
            if (stderr) {
                console.error(`FFmpeg stderr: ${stderr}`);
            }
            console.log(`FFmpeg stdout: ${stdout}`);
            resolve(outputPath);
        });
    });
}

// Function to get image dimensions using Jimp
async function getImageDimensions(imagePath) {
    try {
        const image = await Jimp.read(imagePath);
        return {
            width: image.getWidth(),
            height: image.getHeight()
        };
    } catch (error) {
        console.error("Error getting image dimensions:", error);
        return null;
    }
}


module.exports = {
    handleAntilinkCommand,
    handleLinkDetection,
    Antilink,
    blurImage,
    videoToGif,
    getImageDimensions
};