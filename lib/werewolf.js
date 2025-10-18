import fs from 'fs';
import path from 'path';

// Load game data storage
const dataPath = path.join(process.cwd(), 'data', 'werewolf.json');

// Initialize werewolf data
const initializeWerewolfData = () => {
  if (!fs.existsSync(dataPath)) {
    fs.writeFileSync(dataPath, JSON.stringify({}, null, 2));
  }
};

// Load werewolf data
const loadWerewolfData = () => {
  try {
    initializeWerewolfData();
    const data = fs.readFileSync(dataPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading werewolf data:', error);
    return {};
  }
};

// Save werewolf data
const saveWerewolfData = (data) => {
  try {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving werewolf data:', error);
  }
};

let toMs = (time) => {
  const units = {
    's': 1000,
    'm': 60000,
    'h': 3600000,
    'd': 86400000
  };
  
  const match = time.match(/^(\d+)([smhd])$/);
  if (!match) return 0;
  
  const value = parseInt(match[1]);
  const unit = match[2];
  
  return value * (units[unit] || 0);
};

async function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function emoji_role(role) {
    if (role === "warga") {
        return "👱‍♂️";
    } else if (role === "seer") {
        return "👳";
    } else if (role === "guardian") {
        return "👼";
    } else if (role === "sorcerer") {
        return "🔮";
    } else if (role === "werewolf") {
        return "🐺";
    } else {
        return "";
    }
}

const findObject = (obj = {}, key, value) => {
    const result = [];
    const recursiveSearch = (obj = {}) => {
        if (!obj || typeof obj !== "object") {
            return;
        }
        if (obj[key] === value) {
            result.push(obj);
        }
        Object.keys(obj).forEach(function(k) {
            recursiveSearch(obj[k]);
        });
    };
    recursiveSearch(obj);
    return result;
};

// Sesi
const sesi = (from, data) => {
    if (!data[from]) return false;
    return data[from];
};

// Memastikan player tidak dalam sesi game apapun
const playerOnGame = (sender, data) => {
    let result = findObject(data, "id", sender);
    let index = false;
    if (result.length === 0) {
        return index;
    } else {
        index = true;
    }
    return index;
};

// cek apakah player sudah dalam room
const playerOnRoom = (sender, from, data) => {
    let result = findObject(data, "id", sender);
    let index = false;
    if (result.length > 0 && result[0].sesi === from) {
        index = true;
    } else {
        return index;
    }
    return index;
};

// get data player
const dataPlayer = (sender, data) => {
    let result = findObject(data, "id", sender);
    let index = false;
    if (result.length > 0 && result[0].id === sender) {
        index = result[0];
    } else {
        return index;
    }
    return index;
};

// keluar game
const playerExit = (from, id, data) => {
    let room = sesi(from, data);
    if (!room) return false;
    const indexPlayer = room.player.findIndex((i) => i.id === id);
    if (indexPlayer !== -1) {
        room.player.splice(indexPlayer, 1);
    }
};

// pengacakan role
const roleShuffle = (array) => {
    let currentIndex = array.length, randomIndex;
    while (currentIndex != 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]
        ];
    }
    return array;
};

// memberikan role ke player
const roleChanger = (from, id, role, data) => {
    let room = sesi(from, data);
    if (!room) return false;
    var index = room.player.findIndex((i) => i.id === id);
    if (index === -1) return false;
    room.player[index].role = role;
};

// memberikan peran ke semua player
const roleAmount = (from, data) => {
    const result = sesi(from, data);
    if (!result) return false;
    if (result.player.length == 4) {
        return { werewolf: 1, seer: 1, guardian: 1, warga: 1, sorcerer: 0 };
    } else if (result.player.length == 5) {
        return { werewolf: 1, seer: 1, guardian: 1, warga: 2, sorcerer: 0 };
    } else if (result.player.length == 6) {
        return { werewolf: 2, seer: 1, guardian: 1, warga: 2, sorcerer: 0 };
    } else if (result.player.length == 7) {
        return { werewolf: 2, seer: 1, guardian: 1, warga: 3, sorcerer: 0 };
    } else if (result.player.length == 8) {
        return { werewolf: 2, seer: 1, guardian: 1, warga: 4, sorcerer: 0 };
    } else if (result.player.length >= 9) {
        return { werewolf: 2, seer: 1, guardian: 1, warga: result.player.length - 5, sorcerer: 1 };
    }
};

const roleGenerator = (from, data) => {
    let room = sesi(from, data);
    if (!room) return false;
    var role = roleAmount(from, data);
    
    // Reset all roles first
    room.player.forEach(player => player.role = false);
    
    // Assign werewolf
    for (var i = 0; i < role.werewolf; i++) {
        var player = room.player.filter((x) => x.role === false);
        var list = roleShuffle(player);
        if (list.length === 0) return false;
        var random = Math.floor(Math.random() * list.length);
        roleChanger(from, list[random].id, "werewolf", data);
    }
    
    // Assign seer
    for (var i = 0; i < role.seer; i++) {
        var player = room.player.filter((x) => x.role === false);
        var list = roleShuffle(player);
        if (list.length === 0) return false;
        var random = Math.floor(Math.random() * list.length);
        roleChanger(from, list[random].id, "seer", data);
    }
    
    // Assign guardian
    for (var i = 0; i < role.guardian; i++) {
        var player = room.player.filter((x) => x.role === false);
        var list = roleShuffle(player);
        if (list.length === 0) return false;
        var random = Math.floor(Math.random() * list.length);
        roleChanger(from, list[random].id, "guardian", data);
    }
    
    // Assign sorcerer
    for (var i = 0; i < role.sorcerer; i++) {
        var player = room.player.filter((x) => x.role === false);
        var list = roleShuffle(player);
        if (list.length === 0) return false;
        var random = Math.floor(Math.random() * list.length);
        roleChanger(from, list[random].id, "sorcerer", data);
    }
    
    // Assign remaining as warga
    for (var i = 0; i < role.warga; i++) {
        var player = room.player.filter((x) => x.role === false);
        var list = roleShuffle(player);
        if (list.length === 0) return false;
        var random = Math.floor(Math.random() * list.length);
        roleChanger(from, list[random].id, "warga", data);
    }
    
    return true;
};

// voting
const vote = (from, id, sender, data) => {
    let room = sesi(from, data);
    if (!room) return false;
    const idGet = room.player.findIndex((i) => i.id === sender);
    if (idGet === -1) return false;
    const indexPlayer = room.player.findIndex((i) => i.number === id);
    if (indexPlayer === -1) return false;
    if (idGet !== -1) {
        room.player[idGet].isvote = true;
    }
    room.player[indexPlayer].vote += 1;
    return true;
};

// hasil voting
const voteResult = (from, data) => {
    let room = sesi(from, data);
    if (!room) return false;
    room.player.sort((a, b) => (a.vote < b.vote ? 1 : -1));
    if (room.player[0].vote === 0) return 0;
    if (room.player[0].vote === room.player[1].vote) return 1;
    return room.player[0];
};

// Export functions
export {
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
};