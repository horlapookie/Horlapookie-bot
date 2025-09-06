import fs from "fs";
import path from "path";

function formatSize(bytes) {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(2)} MB`;
}

// Create a huge media bomb (100MB of invisible Unicode)
const bigPayload = "\u200B".repeat(100 * 1024 * 1024); // 100 MB of Zero Width Space
const filePath = path.join(process.cwd(), "bugs", "media_bomb.txt");

fs.writeFileSync(filePath, bigPayload, "utf8");

const stats = fs.statSync(filePath);
console.log(`✅ Media bomb created: ${filePath} | Size: ${formatSize(stats.size)}`);
