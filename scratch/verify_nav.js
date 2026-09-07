import fs from 'fs';
import path from 'path';

const presentationsDir = 'c:/Users/aii/Desktop/MCPtoFigma/presentations';
const files = fs.readdirSync(presentationsDir).filter(f => f.endsWith('.html'));

files.forEach(file => {
    const content = fs.readFileSync(path.join(presentationsDir, file), 'utf-8');
    const matches = content.match(/<a href=".*?" class="overlay-link">.*?<\/a>/g);
    console.log(`${file}: ${matches ? matches.length : 0} items`);
});
