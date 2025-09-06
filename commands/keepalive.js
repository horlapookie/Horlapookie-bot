import axios from 'axios';

let keepAliveInterval = null;
const AUTHORIZED_NUMBER = '2349122222622';
const PING_URL = 'https://horlapookie-botweb-deploy.onrender.com';
const PING_INTERVAL = 7 * 60 * 1000; // 7 minutes in milliseconds

export default {
  name: 'keepon',
  description: 'Start keepalive ping system for Render deployment',
  category: 'system',
  usage: '§keepon',
  aliases: ['keepoff'],
  
  async execute(sock, chatId, userId, args, command) {
    // Check if user is authorized
    if (userId !== AUTHORIZED_NUMBER) {
      return sock.sendMessage(chatId, { text: '❌ Unauthorized access. Only specific users can control the keepalive system.' });
    }

    if (command === 'keepon' || command === 'keepalive') {
      if (keepAliveInterval) {
        return sock.sendMessage(chatId, { text: '✅ Keepalive system is already running!' });
      }

      // Start the keepalive ping
      keepAliveInterval = setInterval(async () => {
        try {
          const response = await axios.get(PING_URL, { timeout: 30000 });
          console.log(`[KEEPALIVE] Ping successful - Status: ${response.status}`);
        } catch (error) {
          console.log(`[KEEPALIVE] Ping failed: ${error.message}`);
        }
      }, PING_INTERVAL);

      // Send initial ping
      try {
        const response = await axios.get(PING_URL, { timeout: 30000 });
        console.log(`[KEEPALIVE] Initial ping successful - Status: ${response.status}`);
      } catch (error) {
        console.log(`[KEEPALIVE] Initial ping failed: ${error.message}`);
      }

      return sock.sendMessage(chatId, { 
        text: `✅ Keepalive system started!\n🌐 Pinging: ${PING_URL}\n⏰ Interval: Every 7 minutes\n📡 Status: Active` 
      });
    }

    if (command === 'keepoff') {
      if (!keepAliveInterval) {
        return sock.sendMessage(chatId, { text: '❌ Keepalive system is not running!' });
      }

      clearInterval(keepAliveInterval);
      keepAliveInterval = null;

      return sock.sendMessage(chatId, { 
        text: '🛑 Keepalive system stopped!\n📡 Status: Inactive' 
      });
    }
  }
};