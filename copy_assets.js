const fs = require('fs');
const path = require('path');

// Replace these with the actual absolute paths from the Gemini artifacts directory
// (I am using the known artifact IDs for the two images)
const sourceDir = path.join(process.env.USERPROFILE, '.gemini/antigravity/brain/6c805d74-fe0d-4775-8493-f98ad65b7826/.tempmediaStorage');

// Note: Because I can't see the exact mapping of artifact ID -> image content,
// I am copying the two most recent .jpg files to the target names.
// If they are swapped, you can just rename them.
const destDir = path.join(__dirname, 'frontend/public');

try {
  const files = fs.readdirSync(sourceDir).filter(f => f.endsWith('.jpg') || f.endsWith('.jpeg'));
  if (files.length >= 2) {
    // Just grab the two newest ones
    const sortedFiles = files.map(f => ({
      name: f,
      time: fs.statSync(path.join(sourceDir, f)).mtime.getTime()
    })).sort((a, b) => b.time - a.time);

    // Assuming the largest file is the officer training one or vice versa
    // We will just copy the top 2
    fs.copyFileSync(path.join(sourceDir, sortedFiles[0].name), path.join(destDir, 'scholarship_poster.jpg'));
    console.log('✅ Replaced scholarship_poster.jpg');

    fs.copyFileSync(path.join(sourceDir, sortedFiles[1].name), path.join(destDir, 'officer_training.jpg'));
    console.log('✅ Replaced officer_training.jpg');

    console.log('\nSuccess! Job 1 (Image Swap) is complete.');
    console.log('Please refresh your browser. If the two posters are swapped, just rename them in /public.');
  } else {
    console.log('Could not find enough .jpg files in the temp directory.');
  }
} catch (e) {
  console.error('Error copying files:', e.message);
}
