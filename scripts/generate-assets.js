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
import { config } from 'dotenv';
import fetch from 'node-fetch';
import sharp from 'sharp';
import { HttpsProxyAgent } from 'https-proxy-agent';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file from project root
config({ path: path.join(__dirname, '../.env') });

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

// Proxy configuration
const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || process.env.https_proxy || process.env.http_proxy;
const proxyAgent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : null;

if (proxyAgent) {
  console.log(`🌐 Using proxy: ${proxyUrl}`);
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
- IMPORTANT: Pure solid black background (#000000), no gradients, no shadows on background
- The subject must be clearly separated from the black background
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
 * Remove black background from an image and make it transparent
 * @param {Buffer} inputBuffer - The input image buffer
 * @returns {Promise<Buffer>} - The processed image buffer with transparent background
 */
async function removeBlackBackground(inputBuffer) {
  try {
    // Read the image and get raw pixel data
    const image = sharp(inputBuffer);
    const { data, info } = await image
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    const { width, height, channels } = info;
    
    // Process each pixel - if it's close to black, make it transparent
    const threshold = 30; // Tolerance for "black" (0-255)
    
    for (let i = 0; i < data.length; i += channels) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Check if pixel is close to black
      if (r < threshold && g < threshold && b < threshold) {
        // Make transparent
        data[i + 3] = 0; // Set alpha to 0
      }
    }
    
    // Create new image with transparent background
    const outputBuffer = await sharp(data, {
      raw: {
        width,
        height,
        channels,
      },
    })
      .png()
      .toBuffer();
    
    return outputBuffer;
  } catch (error) {
    console.error('   ⚠️ Failed to remove background:', error.message);
    return inputBuffer; // Return original if processing fails
  }
}

/**
 * Generate an image using Gemini 2.0 Flash Image Generation model
 */
async function generateImage(prompt, outputPath) {
  if (!CONFIG.apiKey) {
    throw new Error('GEMINI_API_KEY is required. Set it via environment variable or --api-key argument.');
  }

  const url = `${CONFIG.baseUrl}/${CONFIG.model}:generateContent?key=${CONFIG.apiKey}`;

  // Gemini Image Generation API format
  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: `Generate an image: ${prompt}`
          }
        ]
      }
    ],
    generationConfig: {
      responseModalities: ["TEXT", "IMAGE"]
    }
  };

  console.log(`🎨 Generating: ${path.basename(outputPath)}`);
  console.log(`   Prompt: ${prompt.substring(0, 100)}...`);
  console.log(`   URL: ${url.replace(CONFIG.apiKey, 'API_KEY_HIDDEN')}`);

  try {
    const fetchOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    };
    
    // Add proxy agent if available
    if (proxyAgent) {
      fetchOptions.agent = proxyAgent;
    }

    const response = await fetch(url, fetchOptions);

    const responseText = await response.text();
    
    if (!response.ok) {
      console.error(`   ❌ API error: ${response.status}`);
      console.error(`   Response: ${responseText.substring(0, 500)}`);
      throw new Error(`API error: ${response.status} - ${responseText}`);
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      throw new Error('Failed to parse response: ' + responseText.substring(0, 200));
    }

    // Extract image from Gemini response
    const candidates = data.candidates;
    if (!candidates || candidates.length === 0) {
      throw new Error('No candidates in response: ' + JSON.stringify(data).substring(0, 500));
    }

    const parts = candidates[0].content?.parts;
    if (!parts) {
      throw new Error('No parts in response: ' + JSON.stringify(candidates[0]).substring(0, 500));
    }

    // Find the image part
    const imagePart = parts.find(part => part.inlineData);
    if (!imagePart) {
      console.log('   ⚠️ No image in response, got text only');
      const textPart = parts.find(part => part.text);
      if (textPart) {
        console.log(`   Text response: ${textPart.text.substring(0, 200)}`);
      }
      return false;
    }

    const imageData = imagePart.inlineData.data;
    if (!imageData) {
      console.log('   ⚠️ No image data in response');
      return false;
    }

    // Process the image to remove black background
    const rawBuffer = Buffer.from(imageData, 'base64');
    console.log(`   🔧 Removing black background...`);
    const transparentBuffer = await removeBlackBackground(rawBuffer);
    
    // Ensure directory exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, transparentBuffer);
    console.log(`   ✅ Saved with transparent background: ${outputPath}`);
    return true;
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    if (error.cause) {
      console.error(`   Cause: ${error.cause}`);
    }
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
