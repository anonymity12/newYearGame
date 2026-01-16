import Phaser from 'phaser';

/**
 * BootScene - Initial boot scene for basic setup
 * 启动场景 - 初始化基本配置
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Load minimal assets needed for loading screen
    // The main loading happens in PreloadScene
  }

  create(): void {
    // Basic game settings
    this.scale.on('resize', this.resize, this);
    
    // Start preload scene
    this.scene.start('PreloadScene');
  }

  private resize(gameSize: Phaser.Structs.Size): void {
    const width = gameSize.width;
    const height = gameSize.height;

    this.cameras.resize(width, height);
  }
}
