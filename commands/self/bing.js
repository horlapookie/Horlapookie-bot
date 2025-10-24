
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { horla } from '../../lib/horla.js';

const bingUrl = 'https://www.bing.com';

class BingApi {
  constructor(cookie) {
    this.cookie = cookie;
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Alt-Used': 'www.bing.com',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'same-origin',
      'Sec-Fetch-User': '?1',
      'Cookie': '_U=' + cookie + ';',
      'X-Forwarded-For': '20.' + this.getRandomNum() + '.' + this.getRandomNum() + '.' + this.getRandomNum()
    };
  }

  async createImages(prompt, fast = false) {
    try {
      const data = 'q=' + encodeURIComponent(prompt);
      let credits = 0;
      
      // Try to get credits, but don't fail if we can't
      try {
        credits = await this.getCredits();
        if (!credits) credits = 0;
      } catch (creditError) {
        console.log('Could not get credits, continuing anyway:', creditError.message);
      }

      let response = await this.sendRequest(credits > 0 ? fast : true, data);
      
      if (response.status !== 200) {
        throw `HTTP ${response.status}: ${response.statusText}`;
      }

      const eventId = response.headers.get('x-eventid');
      if (!eventId) {
        // Check for errors in response
        const html = await response.text();
        const $ = cheerio.load(html);
        const errorLength = $('#gilen_son').length;

        if (!fast && credits > 0 && $('#gil_err_img.rms_img').hasClass('show_n')) {
          throw 'Dalle-3 is currently unavailable due to high demand';
        } else if ($('#gilen_son').hasClass('show_n') || (errorLength === 2 && credits > 0 && fast)) {
          throw 'Slow mode is currently unavailable due to high demand';
        } else if (errorLength === 2) {
          throw 'Invalid cookie - authentication expired';
        } else if (errorLength === 4) {
          throw 'Prompt has been blocked by content filter';
        } else {
          throw 'No event ID received - service may be down';
        }
      }

      return await this.retrieveImages(eventId);
    } catch (error) {
      console.log('Error in createImages:', error.message || error);
      throw error;
    }
  }

  async getCredits() {
    const response = await fetch(bingUrl + '/create', {
      headers: this.headers,
      method: 'GET',
      mode: 'cors'
    });
    const html = await response.text();
    const $ = cheerio.load(html);
    return $('#token_bal').text();
  }

  getRandomNum() {
    return Math.floor(Math.random() * 254) + 1;
  }

  async sendRequest(fast, data) {
    try {
      const response = await fetch(bingUrl + '/images/create?' + data + '&rt=' + (fast ? '3' : '4'), {
        headers: this.headers,
        method: 'POST',
        mode: 'cors',
        redirect: 'manual'
      });
      return response;
    } catch (error) {
      console.log('Error in sendRequest:', error);
      throw error;
    }
  }

  async retrieveImages(eventId) {
    try {
      let attempts = 0;
      const maxAttempts = 20; // Maximum wait time of 100 seconds
      
      while (attempts < maxAttempts) {
        const response = await fetch(bingUrl + '/images/create/async/results/1-' + eventId, {
          headers: this.headers,
          method: 'GET',
          mode: 'cors',
          timeout: 10000 // 10 second timeout
        });
        
        const html = await response.text();

        if (html.includes('"errorMessage":"Pending"') || html.includes('errorMessage')) {
          throw 'Generation failed or was rejected';
        }

        if (html === '' || html.trim() === '') {
          attempts++;
          console.log(`[Bing] Waiting for images... attempt ${attempts}/${maxAttempts}`);
          await new Promise(resolve => setTimeout(resolve, 5000));
          continue;
        }

        const $ = cheerio.load(html);
        const imageElements = $('.mimg');
        
        if (imageElements.length === 0) {
          attempts++;
          if (attempts >= maxAttempts) {
            throw 'Images not ready after maximum wait time';
          }
          await new Promise(resolve => setTimeout(resolve, 5000));
          continue;
        }

        let images = [];
        for (let i = 0; i < imageElements.length; i++) {
          const src = imageElements[i].attribs.src;
          if (src) {
            const cleanSrc = src.includes('?') ? src.slice(0, src.indexOf('?')) : src;
            images.push(cleanSrc);
          }
        }
        
        if (images.length > 0) {
          console.log(`[Bing] Retrieved ${images.length} images successfully`);
          return images;
        }
        
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
      
      throw 'Timeout: Images not generated within expected time';
    } catch (error) {
      console.log('Error in retrieveImages:', error.message || error);
      throw error;
    }
  }
}

const apikyst = [
  '1aHR0cHM6Ly93d3cuYmluZy5jb20vY3JlYXRl',
  '1bWljcm9zb2Z0LmNvbS9lbi11cy9iaW5nL2NyZWF0ZQ',
  '1Y3JlYXRlLm1pY3Jvc29mdC5jb20vZW4tdXM',
  '1cHJvbXB0LXBhc3MtdGhyb3VnaC1iYXNlNjQ',
  '1eWFob28uY29tL3NlYXJjaD9wPWJpbmcrYWk',
  '1Z29vZ2xlLmNvbS9zZWFyY2g_cT1iaW5nK2Fp'
];

let currentApiIndex = 0;

function getNextApiKey() {
  const key = apikyst[currentApiIndex];
  currentApiIndex = (currentApiIndex + 1) % apikyst.length;
  return key;
}

export default horla({
  nomCom: 'bing',
  categorie: 'AI Image Generator',
  reaction: '🎨'
}, async (msg, { sock, args }) => {
  const from = msg.key.remoteJid;
  const senderName = msg.pushName || 'User';

  if (!args || args.length === 0) {
    return await sock.sendMessage(from, {
      text: `🎨 *Bing AI Image Generator*\n\nUsage: ?bing <prompt>\n\nExample: ?bing a beautiful sunset over mountains`
    }, { quoted: msg });
  }

  try {
    await sock.sendMessage(from, {
      text: "🎨 *Generating AI image with Bing...*"
    }, { quoted: msg });

    const prompt = args.join(' ');
    let images = null;
    let lastError = null;

    // Try with different API keys
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const apiKey = getNextApiKey();
        console.log(`[Bing] Attempting with API key ${attempt + 1}/3`);
        
        const bingApi = new BingApi(apiKey);
        images = await bingApi.createImages(prompt, true);
        
        if (images && images.length > 0) {
          break; // Success, exit loop
        }
      } catch (error) {
        console.log(`[Bing] API attempt ${attempt + 1} failed:`, error.message);
        lastError = error;
        
        // Wait before next attempt
        if (attempt < 2) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    if (images && images.length > 0) {
      console.log(`[Bing] Successfully generated ${images.length} images`);
      
      for (let i = 0; i < Math.min(images.length, 4); i++) {
        try {
          await sock.sendMessage(from, {
            image: { url: images[i] },
            caption: `🎨 *Bing AI Generated Image*\n\n*Prompt:* ${prompt}\n*Image ${i + 1}/${Math.min(images.length, 4)}*\n\n*Generated for:* ${senderName}`
          }, { quoted: msg });
        } catch (sendError) {
          console.log(`[Bing] Failed to send image ${i + 1}:`, sendError.message);
        }
      }
    } else {
      throw lastError || new Error('No images generated');
    }

  } catch (error) {
    console.error('Bing image generation error:', error);
    
    let errorMessage = '❌ Failed to generate image. ';
    if (error.toString().includes('blocked') || error.toString().includes('Prompt has been blocked')) {
      errorMessage += 'Your prompt was blocked by content filter. Try a different prompt.';
    } else if (error.toString().includes('demand') || error.toString().includes('high demand')) {
      errorMessage += 'Service is busy due to high demand. Try again in a few minutes.';
    } else if (error.toString().includes('cookie') || error.toString().includes('Invalid cookie')) {
      errorMessage += 'Authentication expired. Service will refresh automatically.';
    } else if (error.toString().includes('Pending')) {
      errorMessage += 'Generation timed out. Try again with a simpler prompt.';
    } else {
      errorMessage += 'Service temporarily unavailable. Try again later.';
    }
    
    await sock.sendMessage(from, {
      text: errorMessage
    }, { quoted: msg });
  }
});
