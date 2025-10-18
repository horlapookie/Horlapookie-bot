export default {
  name: 'welcome',
  description: 'Configure welcome and goodbye messages for the group',
  aliases: ['setwelcome', 'welcomeconfig'],
  async execute(msg, { sock, args, settings }) {
    const from = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;

    // Only work in groups
    if (!from.endsWith('@g.us')) {
      return await sock.sendMessage(from, {
        text: '❌ This command only works in groups!'
      }, { quoted: msg });
    }

    try {
      // Check if sender is admin
      const groupMeta = await sock.groupMetadata(from);
      const senderIsAdmin = groupMeta.participants.find(p => p.id === sender && (p.admin === 'admin' || p.admin === 'superadmin'));
      
      if (!senderIsAdmin) {
        return await sock.sendMessage(from, {
          text: '❌ Only group admins can configure welcome messages!'
        }, { quoted: msg });
      }

      if (!args[0]) {
        return await sock.sendMessage(from, {
          text: `🎊 *Welcome Configuration*

*Usage:*
• \`${settings.prefix}welcome on\` - Enable welcome messages
• \`${settings.prefix}welcome off\` - Disable welcome messages  
• \`${settings.prefix}welcome set\` - Set custom messages
• \`${settings.prefix}welcome status\` - Check current settings

*Available placeholders:*
• @user - Mentions the user
• @group - Group name
• @desc - Group description
• @count - Member count`
        }, { quoted: msg });
      }

      const action = args[0].toLowerCase();

      // Load current welcome config
      const fs = await import('fs');
      const path = await import('path');
      const dataDir = path.default.join(process.cwd(), 'data');
      const welcomeConfigPath = path.default.join(dataDir, 'welcomeConfig.json');
      
      // Ensure data directory exists
      if (!fs.default.existsSync(dataDir)) {
        fs.default.mkdirSync(dataDir, { recursive: true });
      }
      
      let welcomeConfig = {};
      if (fs.default.existsSync(welcomeConfigPath)) {
        welcomeConfig = JSON.parse(fs.default.readFileSync(welcomeConfigPath, 'utf8'));
      }

      if (!welcomeConfig[from]) {
        welcomeConfig[from] = {
          enabled: false,
          welcomeMessage: '🎉 Welcome @user to *@group*!\n\n📝 *Group Description:*\n@desc\n\n👥 You are member #@count',
          goodbyeMessage: '👋 @user left *@group*\n\n😢 We will miss you!\n\n👥 Now we have @count members'
        };
      }

      switch (action) {
        case 'on':
        case 'enable':
          welcomeConfig[from].enabled = true;
          fs.default.writeFileSync(welcomeConfigPath, JSON.stringify(welcomeConfig, null, 2));
          await sock.sendMessage(from, {
            text: '✅ Welcome messages enabled for this group!'
          }, { quoted: msg });
          break;

        case 'off':
        case 'disable':
          welcomeConfig[from].enabled = false;
          fs.default.writeFileSync(welcomeConfigPath, JSON.stringify(welcomeConfig, null, 2));
          await sock.sendMessage(from, {
            text: '❌ Welcome messages disabled for this group!'
          }, { quoted: msg });
          break;

        case 'set':
          await sock.sendMessage(from, {
            text: `📝 *Set Custom Messages*

Reply to this message with your custom welcome message, or type:
• \`${settings.prefix}welcome setwelcome <message>\` - Set welcome message
• \`${settings.prefix}welcome setgoodbye <message>\` - Set goodbye message

*Example:*
\`${settings.prefix}welcome setwelcome 🎉 Hey @user! Welcome to @group! We now have @count members!\`

*Available placeholders:*
• @user - Mentions the user
• @group - Group name  
• @desc - Group description
• @count - Member count`
          }, { quoted: msg });
          break;

        case 'setwelcome':
          if (!args[1]) {
            return await sock.sendMessage(from, {
              text: '❌ Please provide a welcome message!\n\nExample: `' + settings.prefix + 'welcome setwelcome 🎉 Welcome @user to @group!`'
            }, { quoted: msg });
          }
          
          const welcomeMsg = args.slice(1).join(' ');
          welcomeConfig[from].welcomeMessage = welcomeMsg;
          fs.default.writeFileSync(welcomeConfigPath, JSON.stringify(welcomeConfig, null, 2));
          
          await sock.sendMessage(from, {
            text: '✅ Welcome message updated!\n\n**Preview:**\n' + welcomeMsg.replace('@user', 'NewUser').replace('@group', groupMeta.subject).replace('@desc', groupMeta.desc || 'No description').replace('@count', groupMeta.participants.length.toString())
          }, { quoted: msg });
          break;

        case 'setgoodbye':
          if (!args[1]) {
            return await sock.sendMessage(from, {
              text: '❌ Please provide a goodbye message!\n\nExample: `' + settings.prefix + 'welcome setgoodbye 👋 Goodbye @user! We will miss you!`'
            }, { quoted: msg });
          }
          
          const goodbyeMsg = args.slice(1).join(' ');
          welcomeConfig[from].goodbyeMessage = goodbyeMsg;
          fs.default.writeFileSync(welcomeConfigPath, JSON.stringify(welcomeConfig, null, 2));
          
          await sock.sendMessage(from, {
            text: '✅ Goodbye message updated!\n\n**Preview:**\n' + goodbyeMsg.replace('@user', 'ExUser').replace('@group', groupMeta.subject).replace('@desc', groupMeta.desc || 'No description').replace('@count', groupMeta.participants.length.toString())
          }, { quoted: msg });
          break;

        case 'status':
        case 'info':
          const config = welcomeConfig[from];
          const statusText = `🎊 *Welcome Configuration for @group*

📊 **Status:** ${config.enabled ? '✅ Enabled' : '❌ Disabled'}
👥 **Members:** ${groupMeta.participants.length}

📝 **Welcome Message:**
${config.welcomeMessage}

📝 **Goodbye Message:**  
${config.goodbyeMessage}

💡 **Available Commands:**
• \`${settings.prefix}welcome on/off\` - Toggle messages
• \`${settings.prefix}welcome set\` - Customize messages`;

          await sock.sendMessage(from, {
            text: statusText.replace('@group', groupMeta.subject)
          }, { quoted: msg });
          break;

        default:
          await sock.sendMessage(from, {
            text: '❌ Invalid action! Use `' + settings.prefix + 'welcome` to see available options.'
          }, { quoted: msg });
      }

    } catch (error) {
      console.error('Welcome command error:', error);
      await sock.sendMessage(from, {
        text: '❌ Error configuring welcome messages: ' + error.message
      }, { quoted: msg });
    }
  }
};