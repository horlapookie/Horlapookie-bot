
export default {
  name: 'png',
  description: 'Take a PNG screenshot of a website',
  async execute(msg, { sock, args }) {
    const dest = msg.key.remoteJid;

    if (!args[0]) {
      return await sock.sendMessage(dest, {
        text: '❌ Please insert a website link to take a screenshot!\n\nExample: ?png https://google.com'
      }, { quoted: msg });
    }

    try {
      const url = args[0];
      const imageUrl = `https://image.thum.io/get/png/${url}`;
      
      await sock.sendMessage(dest, {
        image: { url: imageUrl },
        caption: `📸 *PNG Screenshot taken by HORLA POOKIE Bot*\n🌐 URL: ${url}`
      }, { quoted: msg });

    } catch (error) {
      console.error('PNG screenshot error:', error);
      await sock.sendMessage(dest, {
        text: `❌ An error occurred while processing the screenshot: ${error.message}`
      }, { quoted: msg });
    }
  }
};
