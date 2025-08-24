
const { ezra } = require("../fredi/ezra");
const fs = require('fs');
const config = require('../config');

let antiDeleteActive = false;

ezra({
  nomCom: "anti-delete",
  aliases: ["antidelete", "anti_delete"],
  categorie: "Group Management",
  reaction: "😏"
}, async (origineMessage, zk, commandeOptions) => {
  const { ms, arg, repondre } = commandeOptions;

  if (arg[0]) {
    const action = arg[0].toLowerCase();
    if (action === "on") {
      antiDeleteActive = true;
      await repondre("Anti-delete command is activated.");
      return;
    } else if (action === "off") {
      antiDeleteActive = false;
      await repondre("Anti-delete command is deactivated.");
      return;
    }
  }

  if (!antiDeleteActive) {
    await repondre("Anti-delete command is currently deactivated.");
    return;
  }

  if (ms.message.protocolMessage && ms.message.protocolMessage.type === 0 && (config.ANTI_DELETE_MESSAGE || 'no').toLowerCase() === 'yes') {
    if (ms.key.fromMe || ms.message.protocolMessage.key.fromMe) {
      console.log('Deleted message concerning me');
      return;
    }

    console.log('Message deleted');
    const key = ms.message.protocolMessage.key;

    try {
      const st = './store.json';
      if (!fs.existsSync(st)) {
        console.log('Store file not found');
        return;
      }

      const data = fs.readFileSync(st, 'utf8');
      const jsonData = JSON.parse(data);
      const message = jsonData.messages[key.remoteJid];

      if (!message) {
        console.log('No messages found for this chat');
        return;
      }

      let msg;
      for (let i = 0; i < message.length; i++) {
        if (message[i].key.id === key.id) {
          msg = message[i];
          break;
        }
      }

      if (!msg) {
        console.log('Message not found');
        return;
      }

      const senderId = msg.key.participant.split('@')[0];
      const caption = `Anti-delete-message by HORLA POOKIE\nMessage from @${senderId}`;
      
      await zk.sendMessage(origineMessage, { 
        text: caption, 
        mentions: [msg.key.participant] 
      });
      await zk.sendMessage(origineMessage, { forward: msg }, { quoted: msg });
    } catch (error) {
      console.error(error);
      await repondre("Error processing deleted message: " + error.message);
    }
  }
});
