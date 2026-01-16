import Phaser from 'phaser';
import { GAME_CONFIG, COLORS } from '../config/gameConfig';

/**
 * PreloadScene - Load all game assets
 * 预加载场景 - 加载所有游戏资源
 */
export class PreloadScene extends Phaser.Scene {
  private loadingBar!: Phaser.GameObjects.Graphics;
  private progressBar!: Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload(): void {
    this.createLoadingGraphics();

    // Update progress bar as assets load
    this.load.on('progress', (value: number) => {
      this.updateProgress(value);
      this.updateLoadingScreen(value);
    });

    this.load.on('complete', () => {
      this.hideLoadingScreen();
    });

    // Load sprite assets
    this.loadSprites();
    
    // Load audio assets
    this.loadAudio();
    
    // Load tilemap assets
    this.loadTilemaps();
  }

  private createLoadingGraphics(): void {
    const centerX = GAME_CONFIG.SCREEN_WIDTH / 2;
    const centerY = GAME_CONFIG.SCREEN_HEIGHT / 2;
    const barWidth = 400;
    const barHeight = 30;

    // Background bar
    this.loadingBar = this.add.graphics();
    this.loadingBar.fillStyle(0x222222, 0.8);
    this.loadingBar.fillRoundedRect(
      centerX - barWidth / 2,
      centerY - barHeight / 2,
      barWidth,
      barHeight,
      15
    );

    // Progress bar
    this.progressBar = this.add.graphics();
  }

  private updateProgress(value: number): void {
    const centerX = GAME_CONFIG.SCREEN_WIDTH / 2;
    const centerY = GAME_CONFIG.SCREEN_HEIGHT / 2;
    const barWidth = 390;
    const barHeight = 20;

    this.progressBar.clear();
    this.progressBar.fillGradientStyle(COLORS.GOLD, COLORS.ORANGE, COLORS.GOLD, COLORS.ORANGE);
    this.progressBar.fillRoundedRect(
      centerX - barWidth / 2,
      centerY - barHeight / 2,
      barWidth * value,
      barHeight,
      10
    );
  }

  private updateLoadingScreen(progress: number): void {
    const loadingBar = document.getElementById('loading-bar');
    const loadingText = document.getElementById('loading-text');
    
    if (loadingBar) {
      loadingBar.style.width = `${progress * 100}%`;
    }
    
    if (loadingText) {
      const messages = [
        '正在准备年夜饭...',
        '正在挂红灯笼...',
        '正在贴春联...',
        '正在点鞭炮...',
        '正在驱赶年兽...',
      ];
      const messageIndex = Math.floor(progress * (messages.length - 1));
      loadingText.textContent = messages[messageIndex];
    }
  }

  private hideLoadingScreen(): void {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      loadingScreen.classList.add('hidden');
      setTimeout(() => {
        loadingScreen.style.display = 'none';
      }, 500);
    }
  }

  private loadSprites(): void {
    // Base path for sprites
    const spritePath = 'assets/sprites';

    // Generate placeholder graphics if real sprites don't exist
    // These will be replaced by AI-generated assets later
    this.createPlaceholderSprites();
    
    // Load real sprites
    this.load.image('tile-wall', `${spritePath}/tiles/wall.png`);
    this.load.image('tile-floor', `${spritePath}/tiles/floor.png`);
    this.load.image('tile-core', `${spritePath}/tiles/core.png`);
    
    // Obstacles
    this.load.image('obstacle-firecracker', `${spritePath}/obstacles/firecracker.png`);
    this.load.image('obstacle-goods', `${spritePath}/obstacles/goods.png`);
    this.load.image('obstacle-snow', `${spritePath}/obstacles/snow.png`);
    
    // Players (zodiac animals) - single image sprites
    this.load.image('player-tiger', `${spritePath}/players/tiger.png`);
    this.load.image('player-dragon', `${spritePath}/players/dragon.png`);
    this.load.image('player-rabbit', `${spritePath}/players/rabbit.png`);
    this.load.image('player-ox', `${spritePath}/players/ox.png`);
    
    // Enemies - single image sprites
    this.load.image('enemy-nian', `${spritePath}/enemies/nian.png`);
    this.load.image('enemy-nian-boss', `${spritePath}/enemies/nian-boss.png`);
    
    // Towers
    this.load.image('tower-lantern', `${spritePath}/towers/lantern.png`);
    this.load.image('tower-firecracker', `${spritePath}/towers/firecracker-launcher.png`);
    this.load.image('tower-drum', `${spritePath}/towers/drum.png`);
    
    // Resources
    this.load.image('resource-niangao', `${spritePath}/resources/niangao.png`);
    this.load.image('resource-hongbao', `${spritePath}/resources/hongbao.png`);
    this.load.image('resource-koi', `${spritePath}/resources/koi.png`);
    this.load.image('resource-coin', `${spritePath}/resources/coin.png`);
    
    // Effects - single image sprites
    this.load.image('effect-explosion', `${spritePath}/effects/explosion.png`);
    this.load.image('effect-lantern-beam', `${spritePath}/effects/lantern-beam.png`);
    this.load.image('effect-coin-pickup', `${spritePath}/effects/coin-pickup.png`);
    
    // UI elements
    this.load.image('ui-panel', `${spritePath}/ui/panel.png`);
    this.load.image('ui-button', `${spritePath}/ui/button.png`);
    this.load.image('ui-treasure-pot', `${spritePath}/ui/treasure-pot.png`);
  }

  private createPlaceholderSprites(): void {
    // Create placeholder graphics for missing sprites
    // This allows the game to run without real assets
    
    // Create a simple colored rectangle as placeholder
    const createPlaceholder = (key: string, color: number, size: number = 40) => {
      const graphics = this.make.graphics({ x: 0, y: 0 });
      graphics.fillStyle(color, 1);
      graphics.fillRect(0, 0, size, size);
      graphics.generateTexture(key, size, size);
      graphics.destroy();
    };

    // Tiles
    createPlaceholder('placeholder-wall', COLORS.WALL);
    createPlaceholder('placeholder-empty', COLORS.EMPTY);
    createPlaceholder('placeholder-core', COLORS.GOLD);
    
    // Players
    createPlaceholder('placeholder-player', COLORS.PRIMARY_RED);
    
    // Enemy
    createPlaceholder('placeholder-enemy', 0x00FF00);
    
    // Towers
    createPlaceholder('placeholder-lantern', 0xFF6600);
    createPlaceholder('placeholder-firecracker', 0x00FFFF);
  }

  private loadAudio(): void {
    // Audio will be added later
    // this.load.audio('bgm', 'assets/audio/bgm.mp3');
    // this.load.audio('explosion', 'assets/audio/explosion.mp3');
    // this.load.audio('coin', 'assets/audio/coin.mp3');
  }

  private loadTilemaps(): void {
    // Tilemaps can be added for more complex map editing
    // this.load.tilemapTiledJSON('map', 'assets/maps/main.json');
  }

  create(): void {
    // Create animations
    this.createAnimations();
    
    // Proceed to menu
    this.scene.start('MenuScene');
  }

  private createAnimations(): void {
    // Player animations
    if (this.textures.exists('player-tiger')) {
      this.anims.create({
        key: 'player-idle',
        frames: this.anims.generateFrameNumbers('player-tiger', { start: 0, end: 3 }),
        frameRate: 8,
        repeat: -1,
      });
      
      this.anims.create({
        key: 'player-walk',
        frames: this.anims.generateFrameNumbers('player-tiger', { start: 4, end: 7 }),
        frameRate: 12,
        repeat: -1,
      });
    }

    // Enemy animations
    if (this.textures.exists('enemy-nian')) {
      this.anims.create({
        key: 'enemy-walk',
        frames: this.anims.generateFrameNumbers('enemy-nian', { start: 0, end: 3 }),
        frameRate: 8,
        repeat: -1,
      });
    }

    // Explosion animation
    if (this.textures.exists('explosion')) {
      this.anims.create({
        key: 'explosion-anim',
        frames: this.anims.generateFrameNumbers('explosion', { start: 0, end: 7 }),
        frameRate: 16,
        repeat: 0,
      });
    }
  }
}
