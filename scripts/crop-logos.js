#!/usr/bin/env node

/**
 * Logo Cropping Utility
 *
 * Automatically crops logos to remove excess whitespace/transparency,
 * making them ready for optimal display in the HerCap portfolio.
 *
 * Usage:
 *   node scripts/crop-logos.js [input-dir] [output-dir]
 *
 * Example:
 *   node scripts/crop-logos.js logos logos-cropped
 */

import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const DEFAULT_INPUT_DIR = '/Users/joshdaghir/Documents/logos_uncropped';
const DEFAULT_OUTPUT_DIR = path.join(__dirname, '..', 'public', 'logos');
const PADDING = 10; // pixels of padding to keep around the logo
const SUPPORTED_FORMATS = ['.png', '.jpg', '.jpeg', '.webp', '.avif', '.svg'];

/**
 * Recursively get all image files in a directory
 */
async function getImageFiles(dir) {
  const files = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await getImageFiles(fullPath)));
    } else if (SUPPORTED_FORMATS.includes(path.extname(entry.name).toLowerCase())) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Crop a single image to remove excess whitespace
 */
async function cropImage(inputPath, outputPath) {
  try {
    const image = sharp(inputPath);
    const metadata = await image.metadata();

    // For SVG files, just copy them (they're vector and don't need cropping)
    if (metadata.format === 'svg') {
      await fs.copyFile(inputPath, outputPath);
      console.log(`  ✓ Copied SVG: ${path.basename(inputPath)}`);
      return;
    }

    // Get image statistics to find the bounding box
    const { data, info } = await image
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Find bounding box by scanning for non-transparent/non-white pixels
    let minX = info.width;
    let minY = info.height;
    let maxX = 0;
    let maxY = 0;

    const channels = info.channels;
    const hasAlpha = channels === 4;

    for (let y = 0; y < info.height; y++) {
      for (let x = 0; x < info.width; x++) {
        const idx = (y * info.width + x) * channels;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const a = hasAlpha ? data[idx + 3] : 255;

        // Check if pixel is not transparent or not white
        const isVisible = a > 10 && (r < 250 || g < 250 || b < 250);

        if (isVisible) {
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    }

    // If no visible pixels found, keep original
    if (minX > maxX || minY > maxY) {
      await fs.copyFile(inputPath, outputPath);
      console.log(`  ⚠ No content found, copied original: ${path.basename(inputPath)}`);
      return;
    }

    // Add padding and ensure we don't go out of bounds
    const left = Math.max(0, minX - PADDING);
    const top = Math.max(0, minY - PADDING);
    const width = Math.min(info.width - left, maxX - minX + 1 + PADDING * 2);
    const height = Math.min(info.height - top, maxY - minY + 1 + PADDING * 2);

    // Crop the image
    await sharp(inputPath)
      .extract({ left, top, width, height })
      .toFile(outputPath);

    const reduction = Math.round((1 - (width * height) / (info.width * info.height)) * 100);
    console.log(`  ✓ Cropped: ${path.basename(inputPath)} (${reduction}% reduction)`);
  } catch (error) {
    console.error(`  ✗ Error processing ${path.basename(inputPath)}:`, error.message);
  }
}

/**
 * Main function
 */
async function main() {
  const inputDir = process.argv[2] || DEFAULT_INPUT_DIR;
  const outputDir = process.argv[3] || DEFAULT_OUTPUT_DIR;

  console.log('\n🎨 Logo Cropping Utility\n');
  console.log(`Input directory:  ${inputDir}`);
  console.log(`Output directory: ${outputDir}`);
  console.log(`Padding:          ${PADDING}px\n`);

  // Create output directory
  await fs.mkdir(outputDir, { recursive: true });

  // Get all image files
  console.log('📂 Scanning for images...\n');
  const imageFiles = await getImageFiles(inputDir);

  if (imageFiles.length === 0) {
    console.log('❌ No images found!\n');
    process.exit(1);
  }

  console.log(`Found ${imageFiles.length} images\n`);

  // Process each image
  console.log('✂️  Cropping images...\n');
  for (const inputPath of imageFiles) {
    const relativePath = path.relative(inputDir, inputPath);
    const outputPath = path.join(outputDir, relativePath);

    // Create subdirectories if needed
    await fs.mkdir(path.dirname(outputPath), { recursive: true });

    await cropImage(inputPath, outputPath);
  }

  console.log(`\n✅ Done! Cropped logos saved to: ${outputDir}\n`);
}

// Run the script
main().catch(error => {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
});
