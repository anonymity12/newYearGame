import Phaser from 'phaser';
import { GAME_CONFIG, COLORS } from '../config/gameConfig';
import { EnemyData } from '../types/game';

/**
 * Enemy entity - represents a Nian beast enemy
 * 敌人实体 - 表示年兽敌人
 */
export class Enemy extends Phaser.GameObjects.Container {
  public gridX: number;
  public gridY: number;
  
  private enemyData: EnemyData;
  private sprite: Phaser.GameObjects.Text;
  private hpBar: Phaser.GameObjects.Graphics;
  private maxHp: number;

  constructor(scene: Phaser.Scene, data: EnemyData) {
    const pixelX = GAME_CONFIG.MAP_OFFSET_X + data.x * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2;
    const pixelY = GAME_CONFIG.MAP_OFFSET_Y + data.y * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2;
    
    super(scene, pixelX, pixelY);
    
    this.enemyData = data;
    this.gridX = data.x;
    this.gridY = data.y;
    this.maxHp = data.maxHp || data.hp;
    
    // Enemy sprite (emoji for now)
    this.sprite = scene.add.text(0, 0, '🐲', {
      fontSize: '28px',
    });
    this.sprite.setOrigin(0.5);
    this.add(this.sprite);
    
    // HP bar
    this.hpBar = scene.add.graphics();
    this.add(this.hpBar);
    this.drawHPBar(data.hp);
    
    scene.add.existing(this);
    
    // Entrance animation
    this.setScale(0);
    scene.tweens.add({
      targets: this,
      scale: 1,
      duration: 200,
      ease: 'Back.easeOut',
    });
    
    // Idle wobble animation
    scene.tweens.add({
      targets: this.sprite,
      angle: 5,
      duration: 300,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private drawHPBar(hp: number): void {
    this.hpBar.clear();
    
    const barWidth = 30;
    const barHeight = 4;
    const barY = -22;
    
    // Background
    this.hpBar.fillStyle(COLORS.HP_BAR_BG, 1);
    this.hpBar.fillRect(-barWidth / 2, barY, barWidth, barHeight);
    
    // HP fill
    const hpPercent = Math.max(0, Math.min(1, hp / this.maxHp));
    const fillColor = hpPercent > 0.5 ? 0x00FF00 : (hpPercent > 0.25 ? 0xFFAA00 : 0xFF0000);
    this.hpBar.fillStyle(fillColor, 1);
    this.hpBar.fillRect(-barWidth / 2, barY, barWidth * hpPercent, barHeight);
    
    // Border
    this.hpBar.lineStyle(1, 0xFFFFFF, 0.5);
    this.hpBar.strokeRect(-barWidth / 2, barY, barWidth, barHeight);
  }

  public updatePosition(newX: number, newY: number): void {
    if (this.gridX !== newX || this.gridY !== newY) {
      this.gridX = newX;
      this.gridY = newY;
      
      const targetX = GAME_CONFIG.MAP_OFFSET_X + newX * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2;
      const targetY = GAME_CONFIG.MAP_OFFSET_Y + newY * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2;
      
      // Movement tween
      this.scene.tweens.add({
        targets: this,
        x: targetX,
        y: targetY,
        duration: 400,
        ease: 'Linear',
      });
    }
  }

  public updateHP(hp: number, maxHp: number): void {
    this.maxHp = maxHp;
    this.drawHPBar(hp);
    
    // Flash red when damaged
    if (hp < this.enemyData.hp) {
      this.sprite.setTint(0xFF0000);
      this.scene.time.delayedCall(100, () => {
        this.sprite.clearTint();
      });
    }
    
    this.enemyData.hp = hp;
  }

  public destroy(): void {
    // Death animation
    this.scene.tweens.add({
      targets: this,
      scale: 0,
      alpha: 0,
      duration: 200,
      ease: 'Power2',
      onComplete: () => {
        super.destroy();
      },
    });
  }
}
