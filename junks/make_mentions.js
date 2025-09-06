import fs from "fs";
import path from "path";

// How many unique numbers to start with
const UNIQUE_COUNT = 2000;

// How many total (duplicates included)
const TOTAL_COUNT = 50000;

// Prefix for numbers (Nigeria example: 23491...)
const PREFIX = "23491";

const baseMentions = [];

// Generate unique numbers first
for (let i = 0; i < UNIQUE_COUNT; i++) {
  const num = PREFIX + String(1000000 + i).slice(-7);
  baseMentions.push(num + "@s.whatsapp.net");
}

// Duplicate until TOTAL_COUNT
const mentions = [];
while (mentions.length < TOTAL_COUNT) {
  mentions.push(...baseMentions);
}
mentions.length = TOTAL_COUNT; // trim to exact size

const filePath = path.join(process.cwd(), "bugs", "mentions.json");

// Save into bugs/mentions.json
fs.writeFileSync(filePath, JSON.stringify(mentions, null, 2), "utf8");

console.log(
  `✅ Created mentions.json with ${TOTAL_COUNT} entries (${UNIQUE_COUNT} unique, rest duplicates) at ${filePath}`
);
