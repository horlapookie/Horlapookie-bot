
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { horla } from '../lib/horla.js';

// Load emojis
const emojisPath = path.join(process.cwd(), 'data', 'emojis.json');
const emojis = JSON.parse(fs.readFileSync(emojisPath, 'utf8'));

export default horla({
  nomCom: "gta",
  aliases: ["gtastyle", "wasted"],
  reaction: emojis.processing,
  categorie: 'AI'
}, async (msg, { sock, args }) => {
  try {
    // React with processing emoji
    await sock.sendMessage(msg.key.remoteJid, {
      react: { text: emojis.processing, key: msg.key }
    });

    if (!args || args.length === 0) {
      await sock.sendMessage(msg.key.remoteJid, {
        text: `${emojis.warning} Please provide a valid image URL to generate your GTA style image.\n\nExample: ?gta https://example.com/image.jpg`,
        react: { text: emojis.warning, key: msg.key }
      }, { quoted: msg });
      return;
    }

    const imageUrl = args.join(" ");
    
    // Validate if it's a proper URL
    try {
      new URL(imageUrl);
    } catch (urlError) {
      await sock.sendMessage(msg.key.remoteJid, {
        text: `${emojis.error} Please provide a valid image URL.\n\nExample: ?gta https://example.com/image.jpg`,
        react: { text: emojis.error, key: msg.key }
      }, { quoted: msg });
      return;
    }

    await sock.sendMessage(msg.key.remoteJid, {
      text: `${emojis.processing} Generating GTA style image...`
    }, { quoted: msg });

    // Get user name dynamically
    const userName = msg.pushName || "User";
    
    // Try multiple GTA APIs with better error handling
    const gtaApis = [
      {
        url: `https://api.popcat.xyz/wanted?image=${encodeURIComponent(imageUrl)}`,
        name: 'PopCat'
      },
      {
        url: `https://some-random-api.com/canvas/wasted?avatar=${encodeURIComponent(imageUrl)}`,
        name: 'SomeRandomAPI'
      },
      {
        url: `https://api.alexflipnote.dev/filter/wasted?image=${encodeURIComponent(imageUrl)}`,
        name: 'AlexFlipnote'
      }
    ];

    let success = false;
    for (const api of gtaApis) {
      try {
        console.log(`Trying GTA API: ${api.name} - ${api.url}`);
        
        const response = await axios.get(api.url, {
          responseType: 'arraybuffer',
          timeout: 15000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          },
          validateStatus: (status) => status === 200
        });

        if (response.data && response.data.length > 1000) { // Ensure we have actual image data
          console.log(`GTA API ${api.name} successful, sending image...`);
          
          await sock.sendMessage(msg.key.remoteJid, {
            image: Buffer.from(response.data),
            caption: `${emojis.success} *GTA Style Image Generated for ${userName}!*\n\n*Powered by HORLA POOKIE Bot*`
          }, { quoted: msg });

          // React with success
          await sock.sendMessage(msg.key.remoteJid, {
            react: { text: emojis.success, key: msg.key }
          });

          success = true;
          break;
        }
      } catch (apiError) {
        console.log(`GTA API ${api.name} failed:`, apiError.response?.status || apiError.message);
        continue;
      }
    }

    if (!success) {
      // Try a simple overlay approach with multiple fallbacks
      try {
        // Try different overlay methods
        const overlayApis = [
          `https://api.popcat.xyz/wanted?image=${encodeURIComponent(imageUrl)}`,
          `https://some-random-api.com/canvas/wasted?avatar=${encodeURIComponent(imageUrl)}`,
          `https://api.alexflipnote.dev/filter/wasted?image=${encodeURIComponent(imageUrl)}`,
          // Simple image overlay with text
          `https://api.memegen.link/images/custom/_/WASTED.png?background=${encodeURIComponent(imageUrl)}&style=opacity:0.7;color:red;font-size:48px`
        ];

        let overlaySuccess = false;
        for (const overlayApi of overlayApis) {
          try {
            const overlayResponse = await axios.get(overlayApi, {
              responseType: 'arraybuffer',
              timeout: 15000,
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
              }
            });

            if (overlayResponse.data && overlayResponse.data.length > 0) {
              await sock.sendMessage(msg.key.remoteJid, {
                image: Buffer.from(overlayResponse.data),
                caption: `${emojis.success} *GTA Style Effect Applied!*\n\n*Powered by HORLA POOKIE Bot*`,
                react: { text: emojis.success, key: msg.key }
              }, { quoted: msg });

              overlaySuccess = true;
              break;
            }
          } catch (overlayError) {
            console.log(`Overlay API failed:`, overlayError.message);
            continue;
          }
        }

        if (!overlaySuccess) {
          // Final fallback - send original image with GTA text overlay instruction
          await sock.sendMessage(msg.key.remoteJid, {
            text: `${emojis.warning} *GTA Style Generation*\n\nCouldn't generate the effect automatically, but here's your image with instructions:\n\n📸 *Original Image:* ${imageUrl}\n\n💡 *Manual Effect Tip:* Add "WASTED" text overlay in red with opacity for GTA effect!\n\n*Powered by HORLA POOKIE Bot*`,
            react: { text: emojis.warning, key: msg.key }
          }, { quoted: msg });
        }

      } catch (fallbackError) {
        await sock.sendMessage(msg.key.remoteJid, {
          text: `${emojis.error} Failed to generate GTA image. All APIs are currently unavailable. Please try again later.\n\nOriginal URL: ${imageUrl}`,
          react: { text: emojis.error, key: msg.key }
        }, { quoted: msg });
      }
    }

  } catch (error) {
    console.error("GTA command error:", error.message || "Une erreur s'est produite");
    await sock.sendMessage(msg.key.remoteJid, {
      text: `${emojis.error} Oops, an error occurred while processing your request`,
      react: { text: emojis.error, key: msg.key }
    }, { quoted: msg });
  }
});
