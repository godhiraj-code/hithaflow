const fs = require('fs');
fs.cpSync('src', 'dist/src', { recursive: true });
console.log('Successfully copied src to dist for Vercel deployment');
