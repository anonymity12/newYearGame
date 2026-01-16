import Phaser from 'phaser';
import { GAME_CONFIG, COLORS } from '../config/gameConfig';
import { TowerData } from '../types/game';

// Tower sprite key mapping
const TOWER_SPRITES: Record<string, string> = {
  lantern: 'tower-lantern',
  firecracker: 'tower-firecracker',
  drum: 'tower-drum',
};

// Tower emoji fallback mapping
const TOWER_EMOJI: Record<string, string> = {
  lantern: '🏮',
  firecracker: '🧨',
  drum: '🥁',
};

/**
 * Tower entity - represents a defensive tower
 * 塔实体 - 表示防御塔
 */
export class Tower extends Phaser.GameObjects.Container {
  public gridX: number;
  public gridY: number;
  
  private towerData: TowerData;
  private sprite: Phaser.GameObjects.Image | Phaser.GameObjects.Text;
  private rangeIndicator: Phaser.GameObjects.Graphics;
  private baseGraphic: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, data: TowerData) {
    const pixelX = GAME_CONFIG.MAP_OFFSET_X + data.x * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2;
    const pixelY = GAME_CONFIG.MAP_OFFSET_Y + data.y * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2;
    
    super(scene, pixelX, pixelY);
    
    this.towerData = data;
    this.gridX = data.x;
    this.gridY = data.y;
    
    // Range indicator (shown on hover)
    this.rangeIndicator = scene.add.graphics();
    this.rangeIndicator.setAlpha(0);
    this.add(this.rangeIndicator);
    this.drawRangeIndicator();
    
    // Tower base
    this.baseGraphic = scene.add.graphics();
    this.drawBase();
    this.add(this.baseGraphic);
    
    // Tower sprite - use generated assets or fallback to emoji
    const spriteKey = TOWER_SPRITES[data.type] || TOWER_SPRITES.lantern;
    if (scene.textures.exists(spriteKey)) {
      const imgSprite = scene.add.image(0, -5, spriteKey);
      imgSprite.setDisplaySize(40, 40);
      this.sprite = imgSprite;
    } else {
      // Fallback to emoji
      const emoji = TOWER_EMOJI[data.type] || TOWER_EMOJI.lantern;
      const emojiSprite = scene.add.text(0, -5, emoji, {
        fontSize: '28px',
      });
      emojiSprite.setOrigin(0.5);
      this.sprite = emojiSprite;
    }
    this.add(this.sprite);
    
    scene.add.existing(this);
    
    // Placement animation
    this.setScale(0);
    scene.tweens.add({
      targets: this,
      scale: 1,
      duration: 300,
      ease: 'Back.easeOut',
    });
    
    // Idle animation based on tower type
    if (data.type === 'lantern') {
      // Gentle glow for lantern
      scene.tweens.add({
        targets: this.sprite,
        alpha: 0.8,
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    } else if (data.type === 'drum') {
      // Pulse for drum
      scene.tweens.add({
        targets: this.sprite,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    } else {
      // Slight shake for firecracker
      scene.tweens.add({
        targets: this.sprite,
        angle: 3,
        duration: 200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
    
    // Interactive for showing range
    const hitArea = scene.add.rectangle(0, 0, GAME_CONFIG.TILE_SIZE, GAME_CONFIG.TILE_SIZE, 0x000000, 0);
    hitArea.setInteractive();
    this.add(hitArea);
    
    hitArea.on('pointerover', () => {
      this.showRange();
    });
    
    hitArea.on('pointerout', () => {
      this.hideRange();
    });
  }

  private drawBase(): void {
    this.baseGraphic.clear();
    
    // Base platform
    this.baseGraphic.fillStyle(COLORS.WALL, 1);
    this.baseGraphic.fillRoundedRect(-16, 8, 32, 12, 4);
    
    // Decorative border
    this.baseGraphic.lineStyle(2, COLORS.GOLD, 1);
    this.baseGraphic.strokeRoundedRect(-16, 8, 32, 12, 4);
  }

  private drawRangeIndicator(): void {
    this.rangeIndicator.clear();
    
    const range = this.towerData.range * GAME_CONFIG.TILE_SIZE;
    
    // Range circle
    this.rangeIndicator.fillStyle(COLORS.PRIMARY_RED, 0.15);
    this.rangeIndicator.fillCircle(0, 0, range);
    
    // Range border
    this.rangeIndicator.lineStyle(2, COLORS.PRIMARY_RED, 0.5);
    this.rangeIndicator.strokeCircle(0, 0, range);
  }

  public showRange(): void {
    this.scene.tweens.add({
      targets: this.rangeIndicator,
      alpha: 1,
      duration: 200,
      ease: 'Power1',
    });
  }

  public hideRange(): void {
    this.scene.tweens.add({
      targets: this.rangeIndicator,
      alpha: 0,
      duration: 200,
      ease: 'Power1',
    });
  }

  public playAttackAnimation(): void {
    // Flash effect when attacking
    this.sprite.setScale(1.3);
    this.scene.tweens.add({
      targets: this.sprite,
      scale: 1,
      duration: 150,
      ease: 'Power2',
    });
  }

  public destroy(): void {
    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.killTweensOf(this.sprite);
    super.destroy();
  }
}
