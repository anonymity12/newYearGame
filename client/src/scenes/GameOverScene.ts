import Phaser from 'phaser';
import { GAME_CONFIG, COLORS } from '../config/gameConfig';

/**
 * GameOverScene - Victory or defeat screen
 * 游戏结束场景 - 胜利或失败画面
 */
export class GameOverScene extends Phaser.Scene {
  private victory: boolean = false;

  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data: { victory: boolean }): void {
    this.victory = data.victory;
  }

  create(): void {
    this.createBackground();
    this.createContent();
    this.createButtons();
  }

  private createBackground(): void {
    const graphics = this.add.graphics();
    
    if (this.victory) {
      // Golden victory background
      graphics.fillGradientStyle(0x8B4513, 0x8B4513, COLORS.GOLD, COLORS.GOLD, 1);
    } else {
      // Dark defeat background
      graphics.fillGradientStyle(0x1a0000, 0x1a0000, 0x4a0000, 0x4a0000, 1);
    }
    
    graphics.fillRect(0, 0, GAME_CONFIG.SCREEN_WIDTH, GAME_CONFIG.SCREEN_HEIGHT);
  }

  private createContent(): void {
    const centerX = GAME_CONFIG.SCREEN_WIDTH / 2;
    const centerY = GAME_CONFIG.SCREEN_HEIGHT / 2 - 50;
    
    if (this.victory) {
      // Victory content
      const emoji = this.add.text(centerX, centerY - 80, '🎉🏆🎉', {
        fontSize: '72px',
      });
      emoji.setOrigin(0.5);
      
      const title = this.add.text(centerX, centerY, '恭喜胜利!', {
        fontSize: '64px',
        color: '#FFD700',
        fontFamily: '"Noto Sans SC", sans-serif',
        stroke: '#8B4513',
        strokeThickness: 6,
      });
      title.setOrigin(0.5);
      
      const subtitle = this.add.text(centerX, centerY + 70, '成功守护了年夜饭!', {
        fontSize: '28px',
        color: '#FFFFFF',
        fontFamily: '"Noto Sans SC", sans-serif',
      });
      subtitle.setOrigin(0.5);
      
      // Celebration particles
      this.createFireworks();
    } else {
      // Defeat content
      const emoji = this.add.text(centerX, centerY - 80, '😢💔😢', {
        fontSize: '72px',
      });
      emoji.setOrigin(0.5);
      
      const title = this.add.text(centerX, centerY, '游戏结束', {
        fontSize: '64px',
        color: '#FF4444',
        fontFamily: '"Noto Sans SC", sans-serif',
        stroke: '#000000',
        strokeThickness: 6,
      });
      title.setOrigin(0.5);
      
      const subtitle = this.add.text(centerX, centerY + 70, '年夜饭被年兽吃掉了...', {
        fontSize: '28px',
        color: '#AAAAAA',
        fontFamily: '"Noto Sans SC", sans-serif',
      });
      subtitle.setOrigin(0.5);
    }
  }

  private createFireworks(): void {
    // Create periodic firework effects
    this.time.addEvent({
      delay: 500,
      callback: () => {
        const x = Phaser.Math.Between(100, GAME_CONFIG.SCREEN_WIDTH - 100);
        const y = Phaser.Math.Between(100, GAME_CONFIG.SCREEN_HEIGHT - 200);
        
        for (let i = 0; i < 12; i++) {
          const angle = (i / 12) * Math.PI * 2;
          const colors = [COLORS.GOLD, COLORS.PRIMARY_RED, 0xFF6600, 0x00FF00];
          const color = Phaser.Utils.Array.GetRandom(colors);
          
          const particle = this.add.circle(x, y, 4, color, 1);
          
          this.tweens.add({
            targets: particle,
            x: x + Math.cos(angle) * 80,
            y: y + Math.sin(angle) * 80,
            alpha: 0,
            scale: 0.2,
            duration: 600,
            ease: 'Power2',
            onComplete: () => particle.destroy(),
          });
        }
      },
      loop: true,
    });
  }

  private createButtons(): void {
    const centerX = GAME_CONFIG.SCREEN_WIDTH / 2;
    const btnY = GAME_CONFIG.SCREEN_HEIGHT - 150;
    
    // Play again button
    this.createButton(centerX - 120, btnY, '🔄 再来一局', () => {
      this.scene.start('MenuScene');
    });
    
    // Return to menu button
    this.createButton(centerX + 120, btnY, '🏠 返回菜单', () => {
      this.scene.start('MenuScene');
    });
  }

  private createButton(x: number, y: number, text: string, callback: () => void): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    
    const bg = this.add.graphics();
    bg.fillStyle(COLORS.PRIMARY_RED, 1);
    bg.fillRoundedRect(-100, -25, 200, 50, 10);
    bg.lineStyle(2, COLORS.GOLD, 1);
    bg.strokeRoundedRect(-100, -25, 200, 50, 10);
    container.add(bg);
    
    const label = this.add.text(0, 0, text, {
      fontSize: '20px',
      color: '#FFFFFF',
      fontFamily: '"Noto Sans SC", sans-serif',
    });
    label.setOrigin(0.5);
    container.add(label);
    
    const hitArea = this.add.rectangle(0, 0, 200, 50, 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true });
    container.add(hitArea);
    
    hitArea.on('pointerdown', callback);
    
    hitArea.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0xFF2020, 1);
      bg.fillRoundedRect(-100, -25, 200, 50, 10);
      bg.lineStyle(2, COLORS.GOLD, 1);
      bg.strokeRoundedRect(-100, -25, 200, 50, 10);
    });
    
    hitArea.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(COLORS.PRIMARY_RED, 1);
      bg.fillRoundedRect(-100, -25, 200, 50, 10);
      bg.lineStyle(2, COLORS.GOLD, 1);
      bg.strokeRoundedRect(-100, -25, 200, 50, 10);
    });
    
    return container;
  }
}
