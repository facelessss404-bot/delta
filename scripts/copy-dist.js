/**
 * Copy the frontend production build (frontend/dist) into backend/public
 * so that the Node.js server can serve the SPA from a single process.
 */
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'frontend', 'dist');
const dest = path.join(__dirname, '..', 'backend', 'public');

if (!fs.existsSync(src)) {
  console.error('Frontend build not found at', src);
  console.error('Run "npm run build:frontend" first.');
  process.exit(1);
}

// Clean previous build
if (fs.existsSync(dest)) {
  fs.rmSync(dest, { recursive: true });
}

// Recursive copy
const copyRecursive = (source, target) => {
  fs.mkdirSync(target, { recursive: true });
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const srcPath = path.join(source, entry.name);
    const destPath = path.join(target, entry.name);
    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
};

copyRecursive(src, dest);
console.log(`Frontend build copied to ${dest}`);
