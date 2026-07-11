/**
 * ZeroLock Icon Generator
 *
 * Converts the SVG icon to PNG files at the required sizes:
 * - 16x16 (favicon, toolbar)
 * - 32x32 (toolbar)
 * - 48x48 (extensions management)
 * - 128x128 (Chrome Web Store)
 *
 * Uses sharp for rendering.
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const SVG_PATH = path.resolve(__dirname, '..', 'public', 'icons', 'icon.svg');
const ICONS_DIR = path.resolve(__dirname, '..', 'public', 'icons');

const SIZES = [16, 32, 48, 128];

async function generateIcons() {
  const svgBuffer = fs.readFileSync(SVG_PATH);

  console.log('📦 Reading SVG icon...');
  console.log(`   File: ${SVG_PATH}`);

  for (const size of SIZES) {
    const outputPath = path.join(ICONS_DIR, `icon${size}.png`);
    
    try {
      await sharp(svgBuffer)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toFile(outputPath);

      const stats = fs.statSync(outputPath);
      console.log(`   ✅ icon${size}.png (${size}x${size}) - ${(stats.size / 1024).toFixed(1)} KB`);
    } catch (err) {
      console.error(`   ❌ Failed to generate icon${size}.png:`, err.message);
    }
  }

  console.log('\n🎉 All icons generated successfully!');
}

generateIcons().catch((err) => {
  console.error('Failed to generate icons:', err);
  process.exit(1);
});
