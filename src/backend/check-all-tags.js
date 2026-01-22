const fs = require('fs');
const content = fs.readFileSync('d:\\Sidebar_Menu_Structure_Design\\src\\components\\pages\\QuanLyDoiTac.tsx', 'utf8');

const tagRegex = /<(\/?)([a-zA-Z0-9]+)([^>]*?)(\/?)>/g;
let match;
const stack = [];
const selfClosing = ['input', 'img', 'br', 'hr', 'Plus', 'Search', 'Eye', 'Edit2', 'Ban', 'Users', 'X', 'ChevronLeft', 'ChevronRight', 'ArrowUpDown', 'ArrowUp', 'ArrowDown', 'FileText', 'Phone', 'Mail', 'Building2', 'Trash2', 'AlertCircle'];

let lineNum = 1;
let lastIndex = 0;

while ((match = tagRegex.exec(content)) !== null) {
    const [full, slash, name, attrs, self] = match;

    // Update line number
    const segment = content.substring(lastIndex, match.index);
    lineNum += (segment.match(/\n/g) || []).length;
    lastIndex = match.index;

    const isClosing = slash === '/';
    const isSelfClosing = self === '/' || selfClosing.includes(name);

    if (isSelfClosing && !isClosing) {
        // console.log(`Self-closing: ${name} at line ${lineNum}`);
        continue;
    }

    if (isClosing) {
        const last = stack.pop();
        if (!last || last.name !== name) {
            console.log(`Mismatch: found </${name}> at line ${lineNum}, expected ${last ? '</' + last.name + '>' : 'nothing'}`);
        }
    } else {
        stack.push({ name, line: lineNum });
    }
}

if (stack.length > 0) {
    console.log(`Unclosed tags: ${stack.map(t => `${t.name} (line ${t.line})`).join(', ')}`);
} else {
    console.log('All tags balanced!');
}
