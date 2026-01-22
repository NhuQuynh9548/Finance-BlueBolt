const fs = require('fs');
const content = fs.readFileSync('d:\\Sidebar_Menu_Structure_Design\\src\\components\\pages\\QuanLyDoiTac.tsx', 'utf8');
const lines = content.split('\n');
let balance = 0;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const opens = (line.match(/<div/g) || []).length;
    const closes = (line.match(/<\/div/g) || []).length;
    balance += opens;
    balance -= closes;
    if (balance < 0) {
        console.log(`Negative balance at line ${i + 1}: ${line.trim()} (Balance: ${balance})`);
        // Reset or continue? Let's stop.
        // break;
    }
}
console.log(`Final balance: ${balance}`);
