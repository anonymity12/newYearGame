/**
 * Gemini Flash Image Generator for 守卫年夜饭 Game Assets
 * 使用 Gemini Flash 模型生成游戏资源图片
 * 
 * Usage: 
 *   GEMINI_API_KEY=your_key node scripts/generate-assets.js
 *   or
 *   node scripts/generate-assets.js --api-key=your_key
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  apiKey: process.env.GEMINI_API_KEY || getApiKeyFromArgs(),
  outputDir: path.join(__dirname, '../client/src/assets/sprites'),
  model: 'gemini-2.0-flash-exp-image-generation',
  baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
};

function getApiKeyFromArgs() {
  const arg = process.argv.find(a => a.startsWith('--api-key='));
  return arg ? arg.split('=')[1] : null;
}

// Art style guide for consistent generation
const ART_STYLE = `
Chinese New Year themed, cute cartoon 2.5D game asset style.
Features:
- Bright red and gold color palette
- Festive Chinese New Year decorations
- Cute, round, chibi-style characters
- Soft shadows and warm lighting
- Clean outlines, suitable for game sprites
- Transparent background (PNG format)
- Resolution: 128x128 pixels for tiles, 64x64 for characters
- Similar style to mobile games like "Zodiac TD" or "Chinese New Year themed tower defense"
`;

// Asset definitions
const ASSETS = {
  // Tile sprites
  tiles: [
    {
      name: 'wall',
      prompt: `A decorative Chinese wall tile with traditional red brick pattern and golden trim. ${ART_STYLE}`,
      size: 40,
    },
    {
      name: 'floor',
      prompt: `A festive red carpet floor tile with subtle golden Chinese cloud patterns. ${ART_STYLE}`,
      size: 40,
    },
    {
      name: 'core',
      prompt: `A golden treasure pot (聚宝盆) with coins and ingots, glowing warmly. The center piece to protect. ${ART_STYLE}`,
      size: 64,
    },
  ],

  // Obstacle sprites
  obstacles: [
    {
      name: 'firecracker',
      prompt: `A pile of red firecrackers (鞭炮) bundled together with golden strings, ready to explode. Cute game item style. ${ART_STYLE}`,
      size: 40,
    },
    {
      name: 'goods',
      prompt: `A colorful Chinese New Year gift box with red wrapping paper and golden ribbon, decorated with prosperity symbols. ${ART_STYLE}`,
      size: 40,
    },
    {
      name: 'snow',
      prompt: `A cute snowpile with a tiny red lantern on top, festive winter decoration. ${ART_STYLE}`,
      size: 40,
    },
  ],

  // Player character sprites (Chinese Zodiac animals)
  players: [
    {
      name: 'tiger',
      prompt: `Cute chibi tiger character (虎) wearing a red Chinese vest with golden buttons, standing pose for game sprite. Zodiac animal style, friendly face. ${ART_STYLE}`,
      size: 40,
      frames: 4, // For animation
    },
    {
      name: 'dragon',
      prompt: `Cute chibi Chinese dragon character (龙) with green scales and golden whiskers, wearing a red scarf, game sprite style. Friendly and playful look. ${ART_STYLE}`,
      size: 40,
      frames: 4,
    },
    {
      name: 'rabbit',
      prompt: `Cute chibi rabbit character (兔) with white fur, wearing a red traditional Chinese outfit, holding a small lantern. Zodiac game sprite style. ${ART_STYLE}`,
      size: 40,
      frames: 4,
    },
    {
      name: 'ox',
      prompt: `Cute chibi ox character (牛) with brown fur, wearing a farmer's hat and red vest, strong but friendly game sprite. ${ART_STYLE}`,
      size: 40,
      frames: 4,
    },
  ],

  // Enemy sprites
  enemies: [
    {
      name: 'nian',
      prompt: `Cute but slightly menacing Nian beast (年兽) character - a mythical Chinese monster with red fur, horn, and sharp teeth, but cartoonish and game-friendly. Walking pose for game sprite. ${ART_STYLE}`,
      size: 48,
      frames: 4,
    },
    {
      name: 'nian-boss',
      prompt: `Larger, more powerful Nian beast boss with golden armor pieces and glowing red eyes, still cartoonish but more intimidating. Boss enemy game sprite. ${ART_STYLE}`,
      size: 64,
      frames: 4,
    },
  ],

  // Tower sprites
  towers: [
    {
      name: 'lantern',
      prompt: `A beautiful red Chinese lantern tower (灯笼塔) on a wooden stand, glowing warmly, ready to shoot light beams at enemies. Defensive tower game sprite. ${ART_STYLE}`,
      size: 48,
    },
    {
      name: 'firecracker-launcher',
      prompt: `A festive firecracker launcher tower (二踢脚发射器) made of bamboo and red decorations, ready to launch firecrackers. Defensive tower game sprite. ${ART_STYLE}`,
      size: 48,
    },
    {
      name: 'drum',
      prompt: `A large red Chinese drum tower (战鼓塔) with golden studs, used for buffing nearby towers. Support tower game sprite. ${ART_STYLE}`,
      size: 48,
    },
  ],

  // Resource/pickup sprites
  resources: [
    {
      name: 'niangao',
      prompt: `Cute sticky rice cake (年糕) item with a happy face, traditional Chinese New Year food, collectible game item. ${ART_STYLE}`,
      size: 32,
    },
    {
      name: 'hongbao',
      prompt: `A red envelope (红包) with golden decorations and the character '福', floating with sparkles, collectible game item. ${ART_STYLE}`,
      size: 32,
    },
    {
      name: 'koi',
      prompt: `A golden koi fish (锦鲤) fragment/shard glowing with luck energy, collectible rare game item. ${ART_STYLE}`,
      size: 32,
    },
    {
      name: 'coin',
      prompt: `A golden Chinese ancient coin (铜钱) with square hole in center, currency game item. ${ART_STYLE}`,
      size: 24,
    },
  ],

  // Effect sprites
  effects: [
    {
      name: 'explosion',
      prompt: `Festive firecracker explosion effect with red and gold sparks, smoke clouds, and confetti. Game explosion effect sprite sheet. ${ART_STYLE}`,
      size: 64,
      frames: 8,
    },
    {
      name: 'lantern-beam',
      prompt: `Red-orange light beam effect shooting from a lantern, magical and warm. Tower attack effect. ${ART_STYLE}`,
      size: 64,
    },
    {
      name: 'coin-pickup',
      prompt: `Golden sparkle effect for collecting coins, with small stars and glitter. Pickup effect. ${ART_STYLE}`,
      size: 32,
      frames: 4,
    },
  ],

  // UI elements
  ui: [
    {
      name: 'panel',
      prompt: `Decorative Chinese-style UI panel frame with red border, golden corners with cloud patterns, semi-transparent center. Game UI element. ${ART_STYLE}`,
      size: 200,
    },
    {
      name: 'button',
      prompt: `Red Chinese-style button with golden border and embossed pattern, suitable for game UI. ${ART_STYLE}`,
      size: 100,
    },
    {
      name: 'treasure-pot',
      prompt: `Golden treasure pot icon (聚宝盆) for UI, showing shared resources. Small UI icon. ${ART_STYLE}`,
      size: 48,
    },
    {
      name: 'hp-bar-frame',
      prompt: `Decorative HP bar frame with dragon heads on each end, red and gold colors. Game UI element. ${ART_STYLE}`,
      size: 120,
    },
  ],
};

/**
 * Generate an image using Gemini Flash Image model
 */
async function generateImage(prompt, outputPath) {
  if (!CONFIG.apiKey) {
    throw new Error('GEMINI_API_KEY is required. Set it via environment variable or --api-key argument.');
  }

  const url = `${CONFIG.baseUrl}/${CONFIG.model}:generateContent?key=${CONFIG.apiKey}`;

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ],
    generationConfig: {
      responseModalities: ['TEXT', 'IMAGE'],
    },
  };

  console.log(`🎨 Generating: ${path.basename(outputPath)}`);
  console.log(`   Prompt: ${prompt.substring(0, 100)}...`);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API error: ${response.status} - ${error}`);
    }

    const data = await response.json();

    // Extract image from response
    const candidates = data.candidates;
    if (!candidates || candidates.length === 0) {
      throw new Error('No candidates in response');
    }

    const parts = candidates[0].content.parts;
    const imagePart = parts.find(part => part.inlineData);

    if (!imagePart) {
      console.log('   ⚠️ No image generated, response:', JSON.stringify(parts.map(p => p.text || 'image'), null, 2));
      return false;
    }

    // Save the image
    const imageData = imagePart.inlineData.data;
    const buffer = Buffer.from(imageData, 'base64');
    
    // Ensure directory exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, buffer);
    console.log(`   ✅ Saved: ${outputPath}`);
    return true;
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return false;
  }
}

/**
 * Generate all assets for a category
 */
async function generateCategory(category, assets) {
  console.log(`\n📁 Generating ${category} assets...`);
  
  const categoryDir = path.join(CONFIG.outputDir, category);
  if (!fs.existsSync(categoryDir)) {
    fs.mkdirSync(categoryDir, { recursive: true });
  }

  let successCount = 0;
  for (const asset of assets) {
    const outputPath = path.join(categoryDir, `${asset.name}.png`);
    
    // Skip if already exists
    if (fs.existsSync(outputPath)) {
      console.log(`   ⏭️ Skipping ${asset.name} (already exists)`);
      successCount++;
      continue;
    }

    const success = await generateImage(asset.prompt, outputPath);
    if (success) successCount++;

    // Rate limiting - wait between requests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log(`   📊 ${category}: ${successCount}/${assets.length} generated`);
  return successCount;
}

/**
 * Main function
 */
async function main() {
  console.log('🎮 守卫年夜饭 - Game Asset Generator');
  console.log('====================================\n');

  if (!CONFIG.apiKey) {
    console.error('❌ Error: GEMINI_API_KEY is required.');
    console.error('   Usage: GEMINI_API_KEY=your_key node scripts/generate-assets.js');
    console.error('   Or:    node scripts/generate-assets.js --api-key=your_key');
    process.exit(1);
  }

  console.log(`📂 Output directory: ${CONFIG.outputDir}`);
  console.log(`🤖 Model: ${CONFIG.model}`);

  // Create output directory
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  }

  // Generate all categories
  let totalSuccess = 0;
  let totalAssets = 0;

  for (const [category, assets] of Object.entries(ASSETS)) {
    totalAssets += assets.length;
    totalSuccess += await generateCategory(category, assets);
  }

  console.log('\n====================================');
  console.log(`🎉 Generation complete: ${totalSuccess}/${totalAssets} assets`);
  console.log(`📁 Assets saved to: ${CONFIG.outputDir}`);
}

// Run the script
main().catch(console.error);
