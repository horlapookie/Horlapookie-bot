import fs from "fs";
import path from "path";

// Zero-width characters
const chars = [
  "\u200B", // ZWSP
  "\u200C", // ZWNJ
  "\u200D", // ZWJ
  "\u200E", // LRM
  "\u200F"  // RLM
];

// Repeat to create a huge single-line string
const repeatCount = 2_000_000; // 2 million characters
let payload = "";

for (let i = 0; i < repeatCount; i++) {
  payload += chars[i % chars.length];
}

// Save to bugs folder
const filePath = path.join(process.cwd(), "bugs", "singleline_crash.txt");
fs.writeFileSync(filePath, payload, "utf8");

console.log(`✅ singleline_crash.txt created with ${repeatCount} chars in bugs folder`);
