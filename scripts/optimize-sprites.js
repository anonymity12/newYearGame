/**
 * Sprite Optimizer for 守卫年夜饭 Game Assets
 * 优化精灵图大小，将所有图片压缩为指定尺寸
 * 
 * Usage: node scripts/optimize-sprites.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  // Source directories to process
  sourceDirs: [
    path.join(__dirname, '../client/src/assets/sprites'),
    path.join(__dirname, '../client/public/assets/sprites'),
  ],
  // Default size for sprites
  defaultSize: 128,
  // Size configurations for different asset types
  sizes: {
    tiles: 64,
    obstacles: 64,
    players: 64,
    enemies: 80,
    towers: 80,
    resources: 48,
    effects: 96,
    ui: 128,
  },
  // Quality settings
  quality: 80,
};

/**
 * Get all PNG files recursively from a directory
 */
function getAllPngFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) {
    return fileList;
  }

  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      getAllPngFiles(filePath, fileList);
    } else if (file.toLowerCase().endsWith('.png')) {
      fileList.push(filePath);
    }
  }
  
  return fileList;
}

/**
 * Get the target size for a file based on its category
 */
function getTargetSize(filePath) {
  const relativePath = filePath.toLowerCase();
  
  for (const [category, size] of Object.entries(CONFIG.sizes)) {
    if (relativePath.includes(`/${category}/`) || relativePath.includes(`\\${category}\\`)) {
      return size;
    }
  }
  
  return CONFIG.defaultSize;
}

/**
 * Format file size for display
 */
function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Optimize a single image
 */
async function optimizeImage(filePath) {
  const targetSize = getTargetSize(filePath);
  const fileName = path.basename(filePath);
  
  try {
    // Get original file size
    const originalStats = fs.statSync(filePath);
    const originalSize = originalStats.size;
    
    // Read and resize the image
    const imageBuffer = await sharp(filePath)
      .resize(targetSize, targetSize, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }, // Transparent background
      })
      .png({
        quality: CONFIG.quality,
        compressionLevel: 9,
        palette: true, // Use palette-based PNG for smaller size
      })
      .toBuffer();
    
    // Write the optimized image
    fs.writeFileSync(filePath, imageBuffer);
    
    // Get new file size
    const newStats = fs.statSync(filePath);
    const newSize = newStats.size;
    
    const reduction = ((originalSize - newSize) / originalSize * 100).toFixed(1);
    
    console.log(`  ✅ ${fileName}: ${formatSize(originalSize)} → ${formatSize(newSize)} (-${reduction}%) [${targetSize}×${targetSize}]`);
    
    return {
      file: fileName,
      originalSize,
      newSize,
      saved: originalSize - newSize,
    };
  } catch (error) {
    console.error(`  ❌ ${fileName}: ${error.message}`);
    return null;
  }
}

/**
 * Process all images in a directory
 */
async function processDirectory(dir) {
  console.log(`\n📁 Processing: ${dir}`);
  
  if (!fs.existsSync(dir)) {
    console.log(`   ⚠️ Directory does not exist, skipping...`);
    return { processed: 0, totalSaved: 0 };
  }
  
  const pngFiles = getAllPngFiles(dir);
  
  if (pngFiles.length === 0) {
    console.log(`   ⚠️ No PNG files found`);
    return { processed: 0, totalSaved: 0 };
  }
  
  console.log(`   Found ${pngFiles.length} PNG files`);
  
  let processed = 0;
  let totalSaved = 0;
  
  for (const file of pngFiles) {
    const result = await optimizeImage(file);
    if (result) {
      processed++;
      totalSaved += result.saved;
    }
  }
  
  return { processed, totalSaved };
}

/**
 * Main function
 */
async function main() {
  console.log('🎮 守卫年夜饭 - Sprite Optimizer');
  console.log('================================\n');
  console.log('Size configurations:');
  for (const [category, size] of Object.entries(CONFIG.sizes)) {
    console.log(`  - ${category}: ${size}×${size}px`);
  }
  
  let totalProcessed = 0;
  let totalSaved = 0;
  
  for (const dir of CONFIG.sourceDirs) {
    const result = await processDirectory(dir);
    totalProcessed += result.processed;
    totalSaved += result.totalSaved;
  }
  
  console.log('\n================================');
  console.log(`🎉 Optimization complete!`);
  console.log(`   Processed: ${totalProcessed} files`);
  console.log(`   Total saved: ${formatSize(totalSaved)}`);
}

// Run the script
main().catch(console.error);
