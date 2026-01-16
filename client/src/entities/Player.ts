import Phaser from 'phaser';
import { GAME_CONFIG, COLORS } from '../config/gameConfig';
import { PlayerData } from '../types/game';

/**
 * Player entity - represents a player character
 * 玩家实体 - 表示玩家角色
 */
export class Player extends Phaser.GameObjects.Container {
  public gridX: number;
  public gridY: number;
  public isCurrentPlayer: boolean;
  
  private _playerData: PlayerData;
  private sprite: Phaser.GameObjects.Graphics;
  private nameText: Phaser.GameObjects.Text;
  private bombIndicator: Phaser.GameObjects.Text;

  public get playerData(): PlayerData {
    return this._playerData;
  }

  constructor(scene: Phaser.Scene, data: PlayerData, isCurrentPlayer: boolean) {
    const pixelX = GAME_CONFIG.MAP_OFFSET_X + data.x * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2;
    const pixelY = GAME_CONFIG.MAP_OFFSET_Y + data.y * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2;
    
    super(scene, pixelX, pixelY);
    
    this._playerData = data;
    this.gridX = data.x;
    this.gridY = data.y;
    this.isCurrentPlayer = isCurrentPlayer;
    
    // Create player sprite (circle for now, will be replaced by actual sprites)
    this.sprite = scene.add.graphics();
    this.drawPlayer();
    this.add(this.sprite);
    
    // Player name
    this.nameText = scene.add.text(0, -25, data.name, {
      fontSize: '12px',
      color: '#FFFFFF',
      fontFamily: '"Noto Sans SC", sans-serif',
      stroke: '#000000',
      strokeThickness: 2,
    });
    this.nameText.setOrigin(0.5);
    this.add(this.nameText);
    
    // Bomb count indicator
    this.bombIndicator = scene.add.text(0, 20, `💣×${data.bombs}`, {
      fontSize: '10px',
      color: '#FFFFFF',
      fontFamily: '"Noto Sans SC", sans-serif',
    });
    this.bombIndicator.setOrigin(0.5);
    this.add(this.bombIndicator);
    
    scene.add.existing(this);
    
    // Add idle animation
    if (isCurrentPlayer) {
      scene.tweens.add({
        targets: this,
        scaleX: 1.05,
        scaleY: 0.95,
        duration: 500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  private drawPlayer(): void {
    this.sprite.clear();
    
    // Different colors for current player vs others
    const mainColor = this.isCurrentPlayer ? COLORS.GOLD : COLORS.PRIMARY_RED;
    const outlineColor = this.isCurrentPlayer ? COLORS.PRIMARY_RED : COLORS.GOLD;
    
    // Player body
    this.sprite.fillStyle(mainColor, 1);
    this.sprite.fillCircle(0, 0, 16);
    
    // Outline
    this.sprite.lineStyle(3, outlineColor, 1);
    this.sprite.strokeCircle(0, 0, 16);
    
    // Eyes
    this.sprite.fillStyle(0x000000, 1);
    this.sprite.fillCircle(-5, -3, 3);
    this.sprite.fillCircle(5, -3, 3);
    
    // Smile
    this.sprite.lineStyle(2, 0x000000, 1);
    this.sprite.beginPath();
    this.sprite.arc(0, 0, 8, 0.2, Math.PI - 0.2, false);
    this.sprite.strokePath();
  }

  public updatePosition(newX: number, newY: number): void {
    if (this.gridX !== newX || this.gridY !== newY) {
      this.gridX = newX;
      this.gridY = newY;
      
      const targetX = GAME_CONFIG.MAP_OFFSET_X + newX * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2;
      const targetY = GAME_CONFIG.MAP_OFFSET_Y + newY * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2;
      
      // Smooth movement tween
      this.scene.tweens.add({
        targets: this,
        x: targetX,
        y: targetY,
        duration: 100,
        ease: 'Power1',
      });
    }
  }

  public updateData(data: PlayerData): void {
    this._playerData = data;
    this.bombIndicator.setText(`💣×${data.bombs}`);
    this.nameText.setText(data.name);
  }

  public destroy(): void {
    this.scene.tweens.killTweensOf(this);
    super.destroy();
  }
}
