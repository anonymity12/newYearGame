import Phaser from 'phaser';
import { GAME_CONFIG, COLORS } from '../config/gameConfig';
import { PlayerData } from '../types/game';

// Available player character sprites
const PLAYER_SPRITES = ['player-tiger', 'player-dragon', 'player-rabbit', 'player-ox'];

/**
 * Player entity - represents a player character
 * 玩家实体 - 表示玩家角色
 */
export class Player extends Phaser.GameObjects.Container {
  public gridX: number;
  public gridY: number;
  public isCurrentPlayer: boolean;
  
  private _playerData: PlayerData;
  private sprite: Phaser.GameObjects.Image | Phaser.GameObjects.Graphics;
  private nameText: Phaser.GameObjects.Text;
  private bombIndicator: Phaser.GameObjects.Text;
  private highlightCircle: Phaser.GameObjects.Graphics;

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
    
    // Highlight circle for current player
    this.highlightCircle = scene.add.graphics();
    if (isCurrentPlayer) {
      this.drawHighlight();
    }
    this.add(this.highlightCircle);
    
    // Create player sprite - use generated assets or fallback to graphics
    const spriteKey = this.getPlayerSpriteKey(data.id);
    if (scene.textures.exists(spriteKey)) {
      const imgSprite = scene.add.image(0, 0, spriteKey);
      imgSprite.setDisplaySize(36, 36);
      this.sprite = imgSprite;
    } else {
      // Fallback to graphics-based sprite
      const graphicsSprite = scene.add.graphics();
      this.drawPlayerFallback(graphicsSprite);
      this.sprite = graphicsSprite;
    }
    this.add(this.sprite);
    
    // Player name
    this.nameText = scene.add.text(0, -28, data.name, {
      fontSize: '12px',
      color: '#FFFFFF',
      fontFamily: '"Noto Sans SC", sans-serif',
      stroke: '#000000',
      strokeThickness: 2,
    });
    this.nameText.setOrigin(0.5);
    this.add(this.nameText);
    
    // Bomb count indicator
    this.bombIndicator = scene.add.text(0, 22, `💣×${data.bombs}`, {
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
        targets: this.sprite,
        scaleX: 1.08,
        scaleY: 0.92,
        duration: 600,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  private getPlayerSpriteKey(playerId: string): string {
    // Use player ID hash to consistently assign the same character sprite
    let hash = 0;
    for (let i = 0; i < playerId.length; i++) {
      hash = ((hash << 5) - hash) + playerId.charCodeAt(i);
      hash |= 0;
    }
    const index = Math.abs(hash) % PLAYER_SPRITES.length;
    return PLAYER_SPRITES[index];
  }

  private drawHighlight(): void {
    this.highlightCircle.clear();
    this.highlightCircle.lineStyle(3, COLORS.GOLD, 0.8);
    this.highlightCircle.strokeCircle(0, 0, 22);
    
    // Add a subtle glow effect
    this.highlightCircle.lineStyle(6, COLORS.GOLD, 0.2);
    this.highlightCircle.strokeCircle(0, 0, 25);
  }

  private drawPlayerFallback(graphics: Phaser.GameObjects.Graphics): void {
    graphics.clear();
    
    // Different colors for current player vs others
    const mainColor = this.isCurrentPlayer ? COLORS.GOLD : COLORS.PRIMARY_RED;
    const outlineColor = this.isCurrentPlayer ? COLORS.PRIMARY_RED : COLORS.GOLD;
    
    // Player body
    graphics.fillStyle(mainColor, 1);
    graphics.fillCircle(0, 0, 16);
    
    // Outline
    graphics.lineStyle(3, outlineColor, 1);
    graphics.strokeCircle(0, 0, 16);
    
    // Eyes
    graphics.fillStyle(0x000000, 1);
    graphics.fillCircle(-5, -3, 3);
    graphics.fillCircle(5, -3, 3);
    
    // Smile
    graphics.lineStyle(2, 0x000000, 1);
    graphics.beginPath();
    graphics.arc(0, 0, 8, 0.2, Math.PI - 0.2, false);
    graphics.strokePath();
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
