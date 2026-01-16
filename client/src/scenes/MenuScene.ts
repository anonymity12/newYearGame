import Phaser from 'phaser';
import { GAME_CONFIG, COLORS } from '../config/gameConfig';

/**
 * MenuScene - Main menu and room joining
 * 菜单场景 - 主菜单和房间加入
 */
export class MenuScene extends Phaser.Scene {
  private playerNameInput!: HTMLInputElement;
  private roomIdInput!: HTMLInputElement;
  private joinButton!: HTMLButtonElement;
  private menuContainer!: HTMLDivElement;

  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    this.createBackground();
    this.createTitle();
    this.createHTMLMenu();
    this.createDecorations();
  }

  private createBackground(): void {
    // Create gradient background
    const graphics = this.add.graphics();
    
    // Dark red gradient
    graphics.fillGradientStyle(
      COLORS.DARK_RED, COLORS.DARK_RED,
      COLORS.PRIMARY_RED, COLORS.PRIMARY_RED,
      1
    );
    graphics.fillRect(0, 0, GAME_CONFIG.SCREEN_WIDTH, GAME_CONFIG.SCREEN_HEIGHT);

    // Add subtle pattern overlay
    for (let i = 0; i < 20; i++) {
      const x = Phaser.Math.Between(0, GAME_CONFIG.SCREEN_WIDTH);
      const y = Phaser.Math.Between(0, GAME_CONFIG.SCREEN_HEIGHT);
      const alpha = Phaser.Math.FloatBetween(0.05, 0.15);
      
      graphics.fillStyle(COLORS.GOLD, alpha);
      graphics.fillCircle(x, y, Phaser.Math.Between(20, 50));
    }
  }

  private createTitle(): void {
    const centerX = GAME_CONFIG.SCREEN_WIDTH / 2;

    // Main title
    const title = this.add.text(centerX, 120, '🧧 守卫年夜饭 🧧', {
      fontSize: '64px',
      fontFamily: '"Noto Sans SC", sans-serif',
      color: '#FFD700',
      stroke: '#8B0000',
      strokeThickness: 6,
      shadow: {
        offsetX: 3,
        offsetY: 3,
        color: '#000',
        blur: 5,
        stroke: true,
        fill: true,
      },
    });
    title.setOrigin(0.5);

    // Subtitle
    const subtitle = this.add.text(centerX, 190, 'Defend the New Year\'s Eve Dinner', {
      fontSize: '24px',
      fontFamily: '"Noto Sans SC", sans-serif',
      color: '#FFFFFF',
    });
    subtitle.setOrigin(0.5);

    // Floating animation for title
    this.tweens.add({
      targets: title,
      y: title.y - 10,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private createHTMLMenu(): void {
    // Create HTML overlay for input fields
    this.menuContainer = document.createElement('div');
    this.menuContainer.id = 'menu-container';
    this.menuContainer.innerHTML = `
      <style>
        #menu-container {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 100;
          text-align: center;
        }
        
        .menu-panel {
          background: linear-gradient(135deg, rgba(139, 0, 0, 0.95), rgba(165, 42, 42, 0.95));
          border: 4px solid #FFD700;
          border-radius: 20px;
          padding: 40px 50px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5), inset 0 0 30px rgba(255, 215, 0, 0.1);
        }
        
        .menu-input {
          display: block;
          width: 280px;
          padding: 15px 20px;
          margin: 15px auto;
          font-size: 18px;
          font-family: 'Noto Sans SC', sans-serif;
          border: 2px solid #FFD700;
          border-radius: 10px;
          background: rgba(0, 0, 0, 0.3);
          color: #FFD700;
          text-align: center;
          outline: none;
          transition: all 0.3s ease;
        }
        
        .menu-input::placeholder {
          color: rgba(255, 215, 0, 0.5);
        }
        
        .menu-input:focus {
          border-color: #FFA500;
          box-shadow: 0 0 15px rgba(255, 165, 0, 0.5);
        }
        
        .menu-button {
          display: block;
          width: 280px;
          padding: 18px 30px;
          margin: 25px auto 10px;
          font-size: 22px;
          font-family: 'Noto Sans SC', sans-serif;
          font-weight: bold;
          color: #8B0000;
          background: linear-gradient(180deg, #FFD700, #FFA500);
          border: none;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
        }
        
        .menu-button:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(255, 165, 0, 0.5);
        }
        
        .menu-button:active {
          transform: translateY(0);
        }
        
        .menu-label {
          color: #FFD700;
          font-size: 16px;
          margin-bottom: 5px;
          text-align: left;
          margin-left: 10px;
        }
        
        .menu-instructions {
          color: #FFFFFF;
          font-size: 14px;
          margin-top: 20px;
          line-height: 1.8;
        }
        
        .menu-instructions kbd {
          background: rgba(255, 215, 0, 0.2);
          padding: 3px 8px;
          border-radius: 4px;
          border: 1px solid #FFD700;
        }
      </style>
      
      <div class="menu-panel">
        <p class="menu-label">玩家名称 / Player Name</p>
        <input type="text" class="menu-input" id="player-name" placeholder="输入你的名字..." maxlength="12">
        
        <p class="menu-label">房间号 / Room ID</p>
        <input type="text" class="menu-input" id="room-id" placeholder="输入房间号或创建新房间..." maxlength="20">
        
        <button class="menu-button" id="join-button">🎮 加入游戏 / Join Game</button>
        
        <div class="menu-instructions">
          <p>🎯 <kbd>WASD</kbd> 移动 | <kbd>Space</kbd> 放炸弹</p>
          <p>🏮 点击放置塔防 | 🌊 开始下一波</p>
        </div>
      </div>
    `;

    document.body.appendChild(this.menuContainer);

    // Get references to inputs
    this.playerNameInput = document.getElementById('player-name') as HTMLInputElement;
    this.roomIdInput = document.getElementById('room-id') as HTMLInputElement;
    this.joinButton = document.getElementById('join-button') as HTMLButtonElement;

    // Set default values
    this.roomIdInput.value = 'room-' + Math.random().toString(36).substring(2, 8);
    this.playerNameInput.value = '玩家' + Math.floor(Math.random() * 1000);

    // Event listeners
    this.joinButton.addEventListener('click', () => this.joinGame());
    this.roomIdInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.joinGame();
    });
    this.playerNameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.joinGame();
    });
  }

  private createDecorations(): void {
    // Add floating lanterns
    const lanternPositions = [
      { x: 100, y: 100 },
      { x: GAME_CONFIG.SCREEN_WIDTH - 100, y: 100 },
      { x: 150, y: GAME_CONFIG.SCREEN_HEIGHT - 150 },
      { x: GAME_CONFIG.SCREEN_WIDTH - 150, y: GAME_CONFIG.SCREEN_HEIGHT - 150 },
    ];

    lanternPositions.forEach((pos, index) => {
      const lantern = this.add.text(pos.x, pos.y, '🏮', {
        fontSize: '48px',
      });
      lantern.setOrigin(0.5);

      this.tweens.add({
        targets: lantern,
        y: lantern.y - 15,
        rotation: Phaser.Math.DegToRad(5),
        duration: 2000 + index * 300,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    });

    // Add floating cherry blossoms
    for (let i = 0; i < 10; i++) {
      const blossom = this.add.text(
        Phaser.Math.Between(0, GAME_CONFIG.SCREEN_WIDTH),
        Phaser.Math.Between(-50, GAME_CONFIG.SCREEN_HEIGHT),
        '🌸',
        { fontSize: `${Phaser.Math.Between(16, 28)}px` }
      );

      this.tweens.add({
        targets: blossom,
        y: GAME_CONFIG.SCREEN_HEIGHT + 50,
        x: blossom.x + Phaser.Math.Between(-100, 100),
        rotation: Phaser.Math.DegToRad(360),
        duration: Phaser.Math.Between(8000, 15000),
        repeat: -1,
        onRepeat: () => {
          blossom.x = Phaser.Math.Between(0, GAME_CONFIG.SCREEN_WIDTH);
          blossom.y = -50;
        },
      });
    }
  }

  private joinGame(): void {
    const playerName = this.playerNameInput.value.trim() || '匿名玩家';
    const roomId = this.roomIdInput.value.trim() || 'default-room';

    // Remove menu
    if (this.menuContainer) {
      this.menuContainer.remove();
    }

    // Start game scene with data
    this.scene.start('GameScene', { playerName, roomId });
    this.scene.launch('UIScene', { playerName, roomId });
  }

  shutdown(): void {
    if (this.menuContainer) {
      this.menuContainer.remove();
    }
  }
}
