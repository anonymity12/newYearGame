import Phaser from 'phaser';
import { GAME_CONFIG, COLORS, TOWER_CONFIG } from '../config/gameConfig';
import { NetworkManager } from '../managers/NetworkManager';
import { GameState } from '../types/game';

/**
 * UIScene - HUD and UI overlay
 * UI场景 - 游戏界面覆盖层
 */
export class UIScene extends Phaser.Scene {
  private networkManager!: NetworkManager;
  private selectedTowerType: string = 'lantern';
  
  // UI elements
  private coinText!: Phaser.GameObjects.Text;
  private waveText!: Phaser.GameObjects.Text;
  private coreHPBar!: Phaser.GameObjects.Graphics;
  private coreHPText!: Phaser.GameObjects.Text;
  private towerButtons: Phaser.GameObjects.Container[] = [];
  private startWaveButton!: Phaser.GameObjects.Container;
  
  private playerName!: string;
  private roomId!: string;

  constructor() {
    super({ key: 'UIScene' });
  }

  init(data: { playerName: string; roomId: string }): void {
    this.playerName = data.playerName;
    this.roomId = data.roomId;
  }

  create(): void {
    this.networkManager = NetworkManager.getInstance();
    
    this.createTopBar();
    this.createTowerPanel();
    this.createWaveButton();
    this.createResourceLegend();
    
    // Listen for state updates from game scene
    this.events.on('stateUpdate', this.updateUI, this);
  }

  private createTopBar(): void {
    const barHeight = 60;
    
    // Top bar background
    const topBar = this.add.graphics();
    topBar.fillStyle(0x000000, 0.7);
    topBar.fillRect(0, 0, GAME_CONFIG.SCREEN_WIDTH, barHeight);
    topBar.lineStyle(2, COLORS.GOLD, 1);
    topBar.lineBetween(0, barHeight, GAME_CONFIG.SCREEN_WIDTH, barHeight);
    
    // Room info
    this.add.text(20, 15, `🏠 ${this.roomId}`, {
      fontSize: '18px',
      color: '#FFFFFF',
      fontFamily: '"Noto Sans SC", sans-serif',
    });
    
    // Player name
    this.add.text(20, 35, `👤 ${this.playerName}`, {
      fontSize: '14px',
      color: '#AAAAAA',
      fontFamily: '"Noto Sans SC", sans-serif',
    });
    
    // Core HP (年夜饭)
    const coreLabel = this.add.text(GAME_CONFIG.SCREEN_WIDTH / 2 - 100, 10, '🍜 年夜饭', {
      fontSize: '18px',
      color: '#FFD700',
      fontFamily: '"Noto Sans SC", sans-serif',
    });
    coreLabel.setOrigin(0, 0);
    
    // HP bar background
    this.coreHPBar = this.add.graphics();
    this.drawCoreHP(100);
    
    // HP text
    this.coreHPText = this.add.text(GAME_CONFIG.SCREEN_WIDTH / 2 + 50, 35, '100/100', {
      fontSize: '14px',
      color: '#FFFFFF',
      fontFamily: '"Noto Sans SC", sans-serif',
    });
    this.coreHPText.setOrigin(0.5, 0);
    
    // Coins (聚宝盆)
    this.add.text(GAME_CONFIG.SCREEN_WIDTH - 200, 20, '🏆 聚宝盆:', {
      fontSize: '18px',
      color: '#FFD700',
      fontFamily: '"Noto Sans SC", sans-serif',
    });
    
    this.coinText = this.add.text(GAME_CONFIG.SCREEN_WIDTH - 50, 20, '0', {
      fontSize: '24px',
      color: '#FFD700',
      fontFamily: '"Noto Sans SC", sans-serif',
      fontStyle: 'bold',
    });
    this.coinText.setOrigin(1, 0);
    
    // Wave info
    this.waveText = this.add.text(GAME_CONFIG.SCREEN_WIDTH - 120, 40, '波次: 0', {
      fontSize: '14px',
      color: '#AAAAAA',
      fontFamily: '"Noto Sans SC", sans-serif',
    });
  }

  private drawCoreHP(hp: number): void {
    this.coreHPBar.clear();
    
    const barX = GAME_CONFIG.SCREEN_WIDTH / 2 - 50;
    const barY = 32;
    const barWidth = 100;
    const barHeight = 16;
    
    // Background
    this.coreHPBar.fillStyle(COLORS.HP_BAR_BG, 1);
    this.coreHPBar.fillRoundedRect(barX, barY, barWidth, barHeight, 4);
    
    // HP fill
    const hpPercent = Math.max(0, Math.min(1, hp / 100));
    const fillColor = hp > 50 ? COLORS.HP_BAR_CORE : (hp > 25 ? 0xFFAA00 : 0xFF0000);
    this.coreHPBar.fillStyle(fillColor, 1);
    this.coreHPBar.fillRoundedRect(barX + 2, barY + 2, (barWidth - 4) * hpPercent, barHeight - 4, 3);
    
    // Border
    this.coreHPBar.lineStyle(2, COLORS.GOLD, 1);
    this.coreHPBar.strokeRoundedRect(barX, barY, barWidth, barHeight, 4);
  }

  private createTowerPanel(): void {
    const panelX = GAME_CONFIG.SCREEN_WIDTH - 180;
    const panelY = 80;
    const panelWidth = 170;
    const panelHeight = 250;
    
    // Panel background
    const panel = this.add.graphics();
    panel.fillStyle(0x000000, 0.8);
    panel.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 10);
    panel.lineStyle(2, COLORS.GOLD, 1);
    panel.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 10);
    
    // Panel title
    this.add.text(panelX + panelWidth / 2, panelY + 15, '建造防御塔', {
      fontSize: '16px',
      color: '#FFD700',
      fontFamily: '"Noto Sans SC", sans-serif',
    }).setOrigin(0.5, 0);
    
    // Tower buttons
    const towers = [
      { type: 'lantern', ...TOWER_CONFIG.lantern, emoji: '🏮' },
      { type: 'firecracker', ...TOWER_CONFIG.firecracker, emoji: '🧨' },
    ];
    
    towers.forEach((tower, index) => {
      const btnY = panelY + 50 + index * 95;
      const button = this.createTowerButton(panelX + 10, btnY, tower);
      this.towerButtons.push(button);
    });
  }

  private createTowerButton(x: number, y: number, tower: { type: string; name: string; cost: number; emoji: string; description: string }): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    
    // Button background
    const bg = this.add.graphics();
    const isSelected = tower.type === this.selectedTowerType;
    bg.fillStyle(isSelected ? 0x8B4513 : 0x333333, 1);
    bg.fillRoundedRect(0, 0, 150, 80, 8);
    bg.lineStyle(2, isSelected ? COLORS.GOLD : 0x666666, 1);
    bg.strokeRoundedRect(0, 0, 150, 80, 8);
    container.add(bg);
    
    // Icon
    const icon = this.add.text(20, 40, tower.emoji, { fontSize: '32px' });
    icon.setOrigin(0.5);
    container.add(icon);
    
    // Name
    const name = this.add.text(50, 15, tower.name, {
      fontSize: '14px',
      color: '#FFFFFF',
      fontFamily: '"Noto Sans SC", sans-serif',
    });
    container.add(name);
    
    // Cost
    const cost = this.add.text(50, 35, `💰 ${tower.cost}`, {
      fontSize: '12px',
      color: '#FFD700',
      fontFamily: '"Noto Sans SC", sans-serif',
    });
    container.add(cost);
    
    // Description
    const desc = this.add.text(50, 55, tower.description, {
      fontSize: '10px',
      color: '#AAAAAA',
      fontFamily: '"Noto Sans SC", sans-serif',
      wordWrap: { width: 95 },
    });
    container.add(desc);
    
    // Interactive
    const hitArea = this.add.rectangle(75, 40, 150, 80, 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true });
    container.add(hitArea);
    
    hitArea.on('pointerdown', () => {
      this.selectedTowerType = tower.type;
      this.updateTowerSelection();
    });
    
    hitArea.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x4a3520, 1);
      bg.fillRoundedRect(0, 0, 150, 80, 8);
      bg.lineStyle(2, COLORS.GOLD, 1);
      bg.strokeRoundedRect(0, 0, 150, 80, 8);
    });
    
    hitArea.on('pointerout', () => {
      const selected = tower.type === this.selectedTowerType;
      bg.clear();
      bg.fillStyle(selected ? 0x8B4513 : 0x333333, 1);
      bg.fillRoundedRect(0, 0, 150, 80, 8);
      bg.lineStyle(2, selected ? COLORS.GOLD : 0x666666, 1);
      bg.strokeRoundedRect(0, 0, 150, 80, 8);
    });
    
    return container;
  }

  private updateTowerSelection(): void {
    // Refresh tower buttons to show selection
    const panelX = GAME_CONFIG.SCREEN_WIDTH - 180;
    const panelY = 80;
    
    // Remove old buttons
    this.towerButtons.forEach(btn => btn.destroy());
    this.towerButtons = [];
    
    // Recreate buttons
    const towers = [
      { type: 'lantern', ...TOWER_CONFIG.lantern, emoji: '🏮' },
      { type: 'firecracker', ...TOWER_CONFIG.firecracker, emoji: '🧨' },
    ];
    
    towers.forEach((tower, index) => {
      const btnY = panelY + 50 + index * 95;
      const button = this.createTowerButton(panelX + 10, btnY, tower);
      this.towerButtons.push(button);
    });
  }

  private createWaveButton(): void {
    const btnX = GAME_CONFIG.SCREEN_WIDTH - 95;
    const btnY = GAME_CONFIG.SCREEN_HEIGHT - 80;
    
    this.startWaveButton = this.add.container(btnX, btnY);
    
    // Button background (drum style)
    const bg = this.add.graphics();
    bg.fillStyle(COLORS.PRIMARY_RED, 1);
    bg.fillRoundedRect(-85, -30, 170, 60, 10);
    bg.lineStyle(3, COLORS.GOLD, 1);
    bg.strokeRoundedRect(-85, -30, 170, 60, 10);
    this.startWaveButton.add(bg);
    
    // Drum emoji
    const drum = this.add.text(-60, 0, '🥁', { fontSize: '28px' });
    drum.setOrigin(0.5);
    this.startWaveButton.add(drum);
    
    // Text
    const text = this.add.text(15, 0, '开始下一波', {
      fontSize: '18px',
      color: '#FFFFFF',
      fontFamily: '"Noto Sans SC", sans-serif',
      fontStyle: 'bold',
    });
    text.setOrigin(0.5);
    this.startWaveButton.add(text);
    
    // Interactive area
    const hitArea = this.add.rectangle(0, 0, 170, 60, 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true });
    this.startWaveButton.add(hitArea);
    
    hitArea.on('pointerdown', () => {
      this.networkManager.startWave();
      
      // Animation feedback
      this.tweens.add({
        targets: this.startWaveButton,
        scale: 0.95,
        duration: 100,
        yoyo: true,
      });
    });
    
    hitArea.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0xFF2020, 1);
      bg.fillRoundedRect(-85, -30, 170, 60, 10);
      bg.lineStyle(3, COLORS.GOLD, 1);
      bg.strokeRoundedRect(-85, -30, 170, 60, 10);
    });
    
    hitArea.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(COLORS.PRIMARY_RED, 1);
      bg.fillRoundedRect(-85, -30, 170, 60, 10);
      bg.lineStyle(3, COLORS.GOLD, 1);
      bg.strokeRoundedRect(-85, -30, 170, 60, 10);
    });
  }

  private createResourceLegend(): void {
    const legendX = 10;
    const legendY = GAME_CONFIG.SCREEN_HEIGHT - 120;
    
    // Legend background
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.7);
    bg.fillRoundedRect(legendX, legendY, 150, 110, 8);
    bg.lineStyle(1, 0x666666, 1);
    bg.strokeRoundedRect(legendX, legendY, 150, 110, 8);
    
    // Title
    this.add.text(legendX + 75, legendY + 12, '资源说明', {
      fontSize: '12px',
      color: '#FFD700',
      fontFamily: '"Noto Sans SC", sans-serif',
    }).setOrigin(0.5, 0);
    
    // Resources
    const resources = [
      { emoji: '🍚', name: '年糕' },
      { emoji: '🧧', name: '红包 (+10金币)' },
      { emoji: '🐟', name: '锦鲤碎片' },
    ];
    
    resources.forEach((res, i) => {
      this.add.text(legendX + 15, legendY + 35 + i * 22, `${res.emoji} ${res.name}`, {
        fontSize: '12px',
        color: '#FFFFFF',
        fontFamily: '"Noto Sans SC", sans-serif',
      });
    });
  }

  private updateUI(state: GameState): void {
    // Update coins
    this.coinText.setText(state.sharedResources.coins.toString());
    
    // Update wave
    this.waveText.setText(`波次: ${state.waveNumber}`);
    
    // Update core HP
    this.drawCoreHP(state.coreHP);
    this.coreHPText.setText(`${state.coreHP}/100`);
  }

  // Public method for GameScene to get selected tower
  public getSelectedTower(): string {
    return this.selectedTowerType;
  }
}
