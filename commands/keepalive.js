import axios from 'axios';

let keepAliveInterval = null;
let currentPingUrl = null;
const PING_INTERVAL = 7 * 60 * 1000; // 7 minutes in milliseconds

export default {
  name: 'keepon',
  description: 'Start keepalive ping system for Render deployment',
  category: 'system',
  usage: '§keepon',
  aliases: ['keepoff'],
  
  async execute(sock, chatId, userId, args, command) {
    // Authorization is handled in index.js, so we can proceed

    if (command === 'keepon' || command.startsWith('keepalive')) {
      // Extract URL from command if provided
      const urlMatch = command.match(/keepalive\s+(https?:\/\/[^\s]+)/) || command.match(/keepon\s+(https?:\/\/[^\s]+)/);
      const providedUrl = urlMatch ? urlMatch[1] : null;
      
      if (!providedUrl && !currentPingUrl) {
        return sock.sendMessage(chatId, { 
          text: '❌ Please provide a URL to ping!\n\n📋 **Usage:**\n• `.keepon <url>` - Start keepalive with URL\n• `.keepalive <url>` - Start keepalive with URL\n• `.keepoff` - Stop keepalive\n\n**Example:** `.keepon https://myapp.onrender.com`' 
        });
      }
      
      if (keepAliveInterval) {
        return sock.sendMessage(chatId, { 
          text: `✅ Keepalive system is already running!\n🌐 Currently pinging: ${currentPingUrl}\n\nUse \`.keepoff\` to stop, then start with new URL.` 
        });
      }

      // Set the URL to ping
      if (providedUrl) {
        currentPingUrl = providedUrl;
      }

      // Start the keepalive ping
      keepAliveInterval = setInterval(async () => {
        try {
          const response = await axios.get(currentPingUrl, { timeout: 30000 });
          console.log(`[KEEPALIVE] Ping successful - Status: ${response.status}`);
        } catch (error) {
          console.log(`[KEEPALIVE] Ping failed: ${error.message}`);
        }
      }, PING_INTERVAL);

      // Send initial ping
      try {
        const response = await axios.get(currentPingUrl, { timeout: 30000 });
        console.log(`[KEEPALIVE] Initial ping successful - Status: ${response.status}`);
        return sock.sendMessage(chatId, { 
          text: `✅ Keepalive system started!\n🌐 Pinging: ${currentPingUrl}\n⏰ Interval: Every 7 minutes\n📡 Status: Active\n🎯 Initial ping: Success (${response.status})` 
        });
      } catch (error) {
        console.log(`[KEEPALIVE] Initial ping failed: ${error.message}`);
        return sock.sendMessage(chatId, { 
          text: `⚠️ Keepalive system started!\n🌐 Pinging: ${currentPingUrl}\n⏰ Interval: Every 7 minutes\n📡 Status: Active\n❌ Initial ping failed: ${error.message}` 
        });
      }
    }

    if (command === 'keepoff') {
      if (!keepAliveInterval) {
        return sock.sendMessage(chatId, { text: '❌ Keepalive system is not running!' });
      }

      const stoppedUrl = currentPingUrl;
      clearInterval(keepAliveInterval);
      keepAliveInterval = null;
      currentPingUrl = null;

      return sock.sendMessage(chatId, { 
        text: `🛑 Keepalive system stopped!\n🌐 Was pinging: ${stoppedUrl}\n📡 Status: Inactive` 
      });
    }
  }
};