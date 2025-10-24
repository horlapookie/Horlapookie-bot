import fs from 'fs';
import path from 'path';
import {
    loadWerewolfData,
    saveWerewolfData,
    sleep,
    emoji_role,
    sesi,
    playerOnGame,
    playerOnRoom,
    dataPlayer,
    playerExit,
    roleGenerator,
    roleAmount,
    vote,
    voteResult,
    toMs
} from '../lib/werewolf.js';

// Load emojis
const emojisPath = path.join(process.cwd(), 'data', 'emojis.json');
const emojis = JSON.parse(fs.readFileSync(emojisPath, 'utf8'));

export default {
  name: "wolf",
  description: "Werewolf mafia-style game with roles and voting",
  aliases: ["werewolf", "mafia", "ww"],
  async execute(msg, { sock, args, settings }) {
    const from = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;
    const senderNumber = sender.split('@')[0];
    const prefix = settings?.prefix || '.';

    // Load game data
    let werewolfData = loadWerewolfData();

    try {
      if (!args[0]) {
        return await sock.sendMessage(from, {
          text: `🐺 *WEREWOLF GAME* 🐺\n\n📝 *Commands:*\n• ${prefix}wolf create - Create new game\n• ${prefix}wolf join - Join existing game\n• ${prefix}wolf start - Start the game (owner only)\n• ${prefix}wolf players - View players list\n• ${prefix}wolf exit - Leave the game\n• ${prefix}wolf vote [number] - Vote to eliminate player\n• ${prefix}wolf role - Check your role (DM only)\n\n🎮 *How to Play:*\n• Minimum 4 players needed\n• Roles: 🐺 Werewolf, 👳 Seer, 👼 Guardian, 👱‍♂️ Villager\n• Goal: Villagers eliminate all werewolves\n• Werewolves eliminate all villagers\n\n🎯 *Game created by HORLA POOKIE Bot*`
        }, { quoted: msg });
      }

      const command = args[0].toLowerCase();

      switch (command) {
        case 'create':
          if (werewolfData[from]) {
            return await sock.sendMessage(from, {
              text: `${emojis.error || '❌'} *Game already exists in this group!*\n\nUse ${prefix}wolf players to see current players or ${prefix}wolf exit to leave.`
            }, { quoted: msg });
          }

          werewolfData[from] = {
            owner: sender,
            status: false,
            player: [{
              id: sender,
              number: 1,
              sesi: from,
              name: senderNumber,
              role: false,
              effect: [],
              vote: 0,
              isdead: false,
              isvote: false
            }],
            dead: [],
            time: "pagi",
            day: 1,
            cooldown: null
          };

          saveWerewolfData(werewolfData);

          await sock.sendMessage(from, {
            text: `🐺 *WEREWOLF GAME CREATED!* 🐺\n\n👑 *Owner:* @${senderNumber}\n👥 *Players:* 1/15\n\n📢 *Waiting for players...*\nOthers can join using: ${prefix}wolf join\n\n⭐ *Need at least 4 players to start*\n🎮 *Owner can start with:* ${prefix}wolf start`,
            mentions: [sender]
          }, { quoted: msg });
          break;

        case 'join':
          if (!werewolfData[from]) {
            return await sock.sendMessage(from, {
              text: `${emojis.error || '❌'} *No game found in this group!*\n\nCreate a new game with: ${prefix}wolf create`
            }, { quoted: msg });
          }

          if (werewolfData[from].status) {
            return await sock.sendMessage(from, {
              text: `${emojis.error || '❌'} *Game already started!*\n\nWait for current game to finish.`
            }, { quoted: msg });
          }

          if (playerOnRoom(sender, from, werewolfData)) {
            return await sock.sendMessage(from, {
              text: `${emojis.error || '❌'} *You're already in this game!*`
            }, { quoted: msg });
          }

          if (werewolfData[from].player.length >= 15) {
            return await sock.sendMessage(from, {
              text: `${emojis.error || '❌'} *Game is full!*\n\nMaximum 15 players allowed.`
            }, { quoted: msg });
          }

          werewolfData[from].player.push({
            id: sender,
            number: werewolfData[from].player.length + 1,
            sesi: from,
            name: senderNumber,
            role: false,
            effect: [],
            vote: 0,
            isdead: false,
            isvote: false
          });

          saveWerewolfData(werewolfData);

          await sock.sendMessage(from, {
            text: `✅ *@${senderNumber} joined the game!*\n\n👥 *Players:* ${werewolfData[from].player.length}/15\n\n${werewolfData[from].player.length >= 4 ? '🎮 *Ready to start!*' : `⭐ *Need ${4 - werewolfData[from].player.length} more players*`}`,
            mentions: [sender]
          }, { quoted: msg });
          break;

        case 'start':
          if (!werewolfData[from]) {
            return await sock.sendMessage(from, {
              text: `${emojis.error || '❌'} *No game found!*\n\nCreate a game first with: ${prefix}wolf create`
            }, { quoted: msg });
          }

          if (werewolfData[from].owner !== sender) {
            return await sock.sendMessage(from, {
              text: `${emojis.error || '❌'} *Only the game owner can start!*`
            }, { quoted: msg });
          }

          if (werewolfData[from].status) {
            return await sock.sendMessage(from, {
              text: `${emojis.error || '❌'} *Game already started!*`
            }, { quoted: msg });
          }

          if (werewolfData[from].player.length < 4) {
            return await sock.sendMessage(from, {
              text: `${emojis.error || '❌'} *Need at least 4 players to start!*\n\nCurrent players: ${werewolfData[from].player.length}/4`
            }, { quoted: msg });
          }

          // Generate roles
          if (!roleGenerator(from, werewolfData)) {
            return await sock.sendMessage(from, {
              text: `${emojis.error || '❌'} *Failed to assign roles!*\n\nPlease try again.`
            }, { quoted: msg });
          }

          werewolfData[from].status = true;
          werewolfData[from].cooldown = Date.now() + toMs("90s");
          saveWerewolfData(werewolfData);

          // Send roles to players privately
          for (let player of werewolfData[from].player) {
            if (!player.role || typeof player.role !== 'string') {
              console.log(`Player ${player.id} has invalid role:`, player.role);
              continue;
            }
            const roleText = `🎭 *YOUR ROLE* 🎭\n\n${emoji_role(player.role)} *Role:* ${player.role.charAt(0).toUpperCase() + player.role.slice(1)}\n\n🎯 *Description:*\n${getRoleDescription(player.role)}\n\n🎮 *Game started in group!*`;
            
            try {
              await sock.sendMessage(player.id, {
                text: roleText
              });
            } catch (e) {
              console.log(`Failed to send role to ${player.id}`);
            }
          }

          const roles = roleAmount(from, werewolfData);
          await sock.sendMessage(from, {
            text: `🎮 *WEREWOLF GAME STARTED!* 🎮\n\n👥 *${werewolfData[from].player.length} Players*\n🐺 Werewolves: ${roles.werewolf}\n👳 Seers: ${roles.seer}\n👼 Guardians: ${roles.guardian}\n👱‍♂️ Villagers: ${roles.warga}\n${roles.sorcerer > 0 ? `🔮 Sorcerers: ${roles.sorcerer}\n` : ''}\n☀️ *Day ${werewolfData[from].day}*\n\n📋 *Roles sent privately to each player*\n⏰ *Game will auto-progress in 90 seconds*\n\n🎯 *Use ${prefix}wolf vote [number] to vote!*`
          }, { quoted: msg });
          break;

        case 'players':
          if (!werewolfData[from]) {
            return await sock.sendMessage(from, {
              text: `${emojis.error || '❌'} *No game found!*`
            }, { quoted: msg });
          }

          let playerList = "👥 *PLAYERS LIST* 👥\n\n";
          werewolfData[from].player.forEach((player, index) => {
            const status = player.isdead ? "💀" : "❤️";
            playerList += `${player.number}. ${status} @${player.name}${werewolfData[from].status && player.isdead ? ` (${player.role})` : ''}\n`;
          });

          playerList += `\n📊 *Total:* ${werewolfData[from].player.length}/15`;
          playerList += `\n🎮 *Status:* ${werewolfData[from].status ? 'In Progress' : 'Waiting'}`;

          if (werewolfData[from].status) {
            playerList += `\n🌅 *Time:* ${werewolfData[from].time}`;
            playerList += `\n📅 *Day:* ${werewolfData[from].day}`;
          }

          const mentions = werewolfData[from].player.map(p => p.id);

          await sock.sendMessage(from, {
            text: playerList,
            mentions: mentions
          }, { quoted: msg });
          break;

        case 'vote':
          if (!werewolfData[from] || !werewolfData[from].status) {
            return await sock.sendMessage(from, {
              text: `${emojis.error || '❌'} *No active game found!*`
            }, { quoted: msg });
          }

          if (!playerOnRoom(sender, from, werewolfData)) {
            return await sock.sendMessage(from, {
              text: `${emojis.error || '❌'} *You're not in this game!*`
            }, { quoted: msg });
          }

          const voterData = dataPlayer(sender, werewolfData);
          if (voterData.isdead) {
            return await sock.sendMessage(from, {
              text: `${emojis.error || '❌'} *Dead players cannot vote!*`
            }, { quoted: msg });
          }

          if (voterData.isvote) {
            return await sock.sendMessage(from, {
              text: `${emojis.error || '❌'} *You already voted!*`
            }, { quoted: msg });
          }

          if (!args[1] || isNaN(args[1])) {
            return await sock.sendMessage(from, {
              text: `${emojis.error || '❌'} *Invalid player number!*\n\nUsage: ${prefix}wolf vote [number]\nExample: ${prefix}wolf vote 3`
            }, { quoted: msg });
          }

          const targetNumber = parseInt(args[1]);
          const targetPlayer = werewolfData[from].player.find(p => p.number === targetNumber);

          if (!targetPlayer) {
            return await sock.sendMessage(from, {
              text: `${emojis.error || '❌'} *Player #${targetNumber} not found!*`
            }, { quoted: msg });
          }

          if (targetPlayer.isdead) {
            return await sock.sendMessage(from, {
              text: `${emojis.error || '❌'} *Cannot vote for dead player!*`
            }, { quoted: msg });
          }

          vote(from, targetNumber, sender, werewolfData);
          saveWerewolfData(werewolfData);

          await sock.sendMessage(from, {
            text: `✅ *@${senderNumber} voted for player #${targetNumber} (@${targetPlayer.name})*`,
            mentions: [sender, targetPlayer.id]
          }, { quoted: msg });
          break;

        case 'exit':
          if (!werewolfData[from]) {
            return await sock.sendMessage(from, {
              text: `${emojis.error || '❌'} *No game found!*`
            }, { quoted: msg });
          }

          if (!playerOnRoom(sender, from, werewolfData)) {
            return await sock.sendMessage(from, {
              text: `${emojis.error || '❌'} *You're not in this game!*`
            }, { quoted: msg });
          }

          playerExit(from, sender, werewolfData);

          if (werewolfData[from].player.length === 0) {
            delete werewolfData[from];
          }

          saveWerewolfData(werewolfData);

          await sock.sendMessage(from, {
            text: `👋 *@${senderNumber} left the game!*`,
            mentions: [sender]
          }, { quoted: msg });
          break;

        case 'role':
          if (!werewolfData[from] || !werewolfData[from].status) {
            return await sock.sendMessage(from, {
              text: `${emojis.error || '❌'} *No active game found!*`
            }, { quoted: msg });
          }

          if (!playerOnRoom(sender, from, werewolfData)) {
            return await sock.sendMessage(from, {
              text: `${emojis.error || '❌'} *You're not in this game!*`
            }, { quoted: msg });
          }

          const playerData = dataPlayer(sender, werewolfData);
          
          if (!playerData || !playerData.role || typeof playerData.role !== 'string') {
            return await sock.sendMessage(from, {
              text: `${emojis.error || '❌'} *Role not assigned yet!*\n\nWait for the game to start.`
            }, { quoted: msg });
          }
          
          const roleText = `🎭 *YOUR ROLE* 🎭\n\n${emoji_role(playerData.role)} *Role:* ${playerData.role.charAt(0).toUpperCase() + playerData.role.slice(1)}\n\n🎯 *Description:*\n${getRoleDescription(playerData.role)}\n\n${playerData.isdead ? '💀 *You are dead*' : '❤️ *You are alive*'}`;

          await sock.sendMessage(sender, {
            text: roleText
          });

          await sock.sendMessage(from, {
            text: `✅ *Role sent to your private message, @${senderNumber}*`,
            mentions: [sender]
          }, { quoted: msg });
          break;

        default:
          await sock.sendMessage(from, {
            text: `${emojis.error || '❌'} *Unknown command!*\n\nUse ${prefix}wolf without parameters to see available commands.`
          }, { quoted: msg });
      }

    } catch (error) {
      console.error('Werewolf game error:', error);
      await sock.sendMessage(from, {
        text: `${emojis.error || '❌'} *Error in werewolf game*\n\n🔧 *Error:* ${error.message}`
      }, { quoted: msg });
    }
  }
};

// Helper function to get role descriptions
function getRoleDescription(role) {
  switch (role) {
    case 'werewolf':
      return '🐺 You are a WEREWOLF! Work with other werewolves to eliminate villagers. You win when werewolves equal or outnumber villagers.';
    case 'seer':
      return '👳 You are a SEER! You can investigate one player each night to learn their role. Help the villagers identify werewolves.';
    case 'guardian':
      return '👼 You are a GUARDIAN! You can protect one player each night from werewolf attacks. Choose wisely to save lives.';
    case 'sorcerer':
      return '🔮 You are a SORCERER! You have special abilities to see through deceptions. Use your powers to help the village.';
    case 'warga':
    default:
      return '👱‍♂️ You are a VILLAGER! Work with other villagers to identify and eliminate all werewolves through voting.';
  }
}