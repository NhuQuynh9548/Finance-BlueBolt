const fs = require('fs');
const content = fs.readFileSync('d:\\Sidebar_Menu_Structure_Design\\src\\components\\pages\\QuanLyDoiTac.tsx', 'utf8');
const lines = content.split('\n');
const start = 647;
const end = 935;
let opens = 0;
let closes = 0;
let braces = 0;
let parens = 0;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Only start counting deep balance within the range if we are looking for local errors
    // But let's check global balance first
    braces += (line.match(/\{/g) || []).length;
    braces -= (line.match(/\}/g) || []).length;
    parens += (line.match(/\(/g) || []).length;
    parens -= (line.match(/\)/g) || []).length;

    if (i >= start - 1 && i < end) {
        opens += (line.match(/<div/g) || []).length;
        closes += (line.match(/<\/div/g) || []).length;
    }
}

console.log(`Global Braces: ${braces}`);
console.log(`Global Parens: ${parens}`);
console.log(`Range Opens: ${opens}, Range Closes: ${closes}`);
