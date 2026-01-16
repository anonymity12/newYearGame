import Phaser from 'phaser';
import { GAME_CONFIG, COLORS } from '../config/gameConfig';
import { NetworkManager } from '../managers/NetworkManager';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Tower } from '../entities/Tower';
import { GameState, MazeCell } from '../types/game';

/**
 * GameScene - Main gameplay scene
 * 游戏场景 - 主要游戏逻辑
 */
export class GameScene extends Phaser.Scene {
  private networkManager!: NetworkManager;
  private playerName!: string;
  private roomId!: string;
  
  // Game objects
  private tileContainer!: Phaser.GameObjects.Container;
  private players: Map<string, Player> = new Map();
  private enemies: Map<string, Enemy> = new Map();
  private towers: Tower[] = [];
  
  // Current player reference
  private myPlayerId: string = '';
  
  // Input handling
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
    SPACE: Phaser.Input.Keyboard.Key;
  };
  
  // Game state
  private gameState: GameState | null = null;
  private lastMoveTime: number = 0;
  private moveDelay: number = 150; // ms between moves

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: { playerName: string; roomId: string }): void {
    this.playerName = data.playerName;
    this.roomId = data.roomId;
  }

  create(): void {
    this.createBackground();
    this.setupContainers();
    this.setupInput();
    this.setupNetwork();
    this.setupEventListeners();
  }

  private createBackground(): void {
    // Dark background with pattern
    const graphics = this.add.graphics();
    graphics.fillStyle(0x1a0a0a, 1);
    graphics.fillRect(0, 0, GAME_CONFIG.SCREEN_WIDTH, GAME_CONFIG.SCREEN_HEIGHT);

    // Decorative border around play area
    const borderX = GAME_CONFIG.MAP_OFFSET_X - 10;
    const borderY = GAME_CONFIG.MAP_OFFSET_Y - 10;
    const borderW = GAME_CONFIG.GRID_WIDTH * GAME_CONFIG.TILE_SIZE + 20;
    const borderH = GAME_CONFIG.GRID_HEIGHT * GAME_CONFIG.TILE_SIZE + 20;

    graphics.lineStyle(4, COLORS.GOLD, 1);
    graphics.strokeRoundedRect(borderX, borderY, borderW, borderH, 10);
    
    // Inner glow
    graphics.lineStyle(2, COLORS.PRIMARY_RED, 0.5);
    graphics.strokeRoundedRect(borderX + 4, borderY + 4, borderW - 8, borderH - 8, 8);
  }

  private setupContainers(): void {
    // Container for tile sprites
    this.tileContainer = this.add.container(GAME_CONFIG.MAP_OFFSET_X, GAME_CONFIG.MAP_OFFSET_Y);
  }

  private setupInput(): void {
    if (!this.input.keyboard) return;

    this.cursors = this.input.keyboard.createCursorKeys();
    
    this.wasdKeys = {
      W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      SPACE: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
    };

    // Click handler for tower placement
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.handleClick(pointer);
    });
  }

  private setupNetwork(): void {
    this.networkManager = NetworkManager.getInstance();
    
    // Connect and join room
    this.networkManager.connect();
    
    // Wait a bit for connection to establish before joining
    this.time.delayedCall(100, () => {
      this.networkManager.joinRoom(this.roomId, this.playerName);
    });
  }

  private setupEventListeners(): void {
    // Listen for game state updates
    this.networkManager.onGameState((state: GameState) => {
      this.gameState = state;
      this.updateGameState(state);
    });

    // Listen for explosions
    this.networkManager.onExplosion((data) => {
      this.playExplosionEffect(data.x, data.y);
    });

    // Listen for game over
    this.networkManager.onGameOver((data) => {
      this.scene.stop('UIScene');
      this.scene.start('GameOverScene', { victory: data.victory });
    });
  }

  private updateGameState(state: GameState): void {
    // Always try to update player ID in case it wasn't set initially
    if (!this.myPlayerId) {
      this.myPlayerId = this.networkManager.getSocketId();
    }
    
    this.renderMaze(state.maze);
    this.renderPlayers(state.players);
    this.renderEnemies(state.enemies);
    this.renderTowers(state.towers);
    
    // Emit state to UI scene
    this.events.emit('stateUpdate', state);
    this.scene.get('UIScene').events.emit('stateUpdate', state);
  }

  private renderMaze(maze: MazeCell[][]): void {
    // Clear existing tiles
    this.tileContainer.removeAll(true);
    
    for (let y = 0; y < maze.length; y++) {
      for (let x = 0; x < maze[y].length; x++) {
        const cell = maze[y][x];
        const px = x * GAME_CONFIG.TILE_SIZE;
        const py = y * GAME_CONFIG.TILE_SIZE;
        
        // Create tile sprite or graphic
        const tile = this.createTile(cell, px, py);
        this.tileContainer.add(tile);
      }
    }
  }

  private createTile(cell: MazeCell, x: number, y: number): Phaser.GameObjects.GameObject {
    const size = GAME_CONFIG.TILE_SIZE;
    const graphics = this.add.graphics();
    
    switch (cell.type) {
      case 'wall':
        graphics.fillStyle(COLORS.WALL, 1);
        graphics.fillRect(x, y, size, size);
        graphics.lineStyle(1, 0x5a3a1a, 1);
        graphics.strokeRect(x, y, size, size);
        break;
        
      case 'empty':
        graphics.fillStyle(COLORS.EMPTY, 1);
        graphics.fillRect(x, y, size, size);
        graphics.lineStyle(1, 0xddd5c5, 0.5);
        graphics.strokeRect(x, y, size, size);
        break;
        
      case 'core':
        // Core tile with special styling
        graphics.fillStyle(COLORS.GOLD, 1);
        graphics.fillRect(x, y, size, size);
        graphics.lineStyle(2, COLORS.PRIMARY_RED, 1);
        graphics.strokeRect(x, y, size, size);
        
        // Add core emoji
        const coreEmoji = this.add.text(x + size / 2, y + size / 2, '🍜', {
          fontSize: '28px',
        });
        coreEmoji.setOrigin(0.5);
        this.tileContainer.add(coreEmoji);
        break;
        
      case 'obstacle':
        graphics.fillStyle(COLORS.EMPTY, 1);
        graphics.fillRect(x, y, size, size);
        
        // Add obstacle emoji
        let emoji = '📦';
        if (cell.obstacleType === 'firecracker') emoji = '🧨';
        else if (cell.obstacleType === 'snow') emoji = '❄️';
        
        const obstacleEmoji = this.add.text(x + size / 2, y + size / 2, emoji, {
          fontSize: '24px',
        });
        obstacleEmoji.setOrigin(0.5);
        this.tileContainer.add(obstacleEmoji);
        break;
    }
    
    return graphics;
  }

  private renderPlayers(players: Array<{ id: string; name: string; x: number; y: number; bombs: number }>): void {
    // Update or create player sprites
    const currentPlayerIds = new Set(players.map(p => p.id));
    
    // Remove players who left
    this.players.forEach((player, id) => {
      if (!currentPlayerIds.has(id)) {
        player.destroy();
        this.players.delete(id);
      }
    });
    
    // Update/add players
    players.forEach((playerData) => {
      let player = this.players.get(playerData.id);
      const isCurrentPlayer = playerData.id === this.myPlayerId;
      
      if (!player) {
        // Create new player
        player = new Player(this, playerData, isCurrentPlayer);
        this.players.set(playerData.id, player);
      } else {
        // Update existing player position and current player status
        player.isCurrentPlayer = isCurrentPlayer;
        player.updatePosition(playerData.x, playerData.y);
        player.updateData(playerData);
      }
    });
  }

  private renderEnemies(enemies: Array<{ id: string; x: number; y: number; hp: number; maxHp?: number }>): void {
    const currentEnemyIds = new Set(enemies.map(e => e.id));
    
    // Remove dead enemies
    this.enemies.forEach((enemy, id) => {
      if (!currentEnemyIds.has(id)) {
        enemy.destroy();
        this.enemies.delete(id);
      }
    });
    
    // Update/add enemies
    enemies.forEach((enemyData) => {
      let enemy = this.enemies.get(enemyData.id);
      
      if (!enemy) {
        enemy = new Enemy(this, enemyData);
        this.enemies.set(enemyData.id, enemy);
      } else {
        enemy.updatePosition(enemyData.x, enemyData.y);
        enemy.updateHP(enemyData.hp, enemyData.maxHp || 100);
      }
    });
  }

  private renderTowers(towers: Array<{ x: number; y: number; type: string; range: number }>): void {
    // Clear existing tower sprites
    this.towers.forEach(tower => tower.destroy());
    this.towers = [];
    
    // Create new tower sprites
    towers.forEach((towerData) => {
      const tower = new Tower(this, towerData);
      this.towers.push(tower);
    });
  }

  private playExplosionEffect(gridX: number, gridY: number): void {
    const x = GAME_CONFIG.MAP_OFFSET_X + gridX * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2;
    const y = GAME_CONFIG.MAP_OFFSET_Y + gridY * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2;
    
    // Create explosion circle
    const explosion = this.add.circle(x, y, 10, COLORS.PRIMARY_RED, 0.8);
    
    this.tweens.add({
      targets: explosion,
      radius: 50,
      alpha: 0,
      duration: 300,
      ease: 'Power2',
      onComplete: () => explosion.destroy(),
    });
    
    // Create particles
    for (let i = 0; i < 8; i++) {
      const particle = this.add.circle(x, y, 5, COLORS.GOLD, 1);
      const angle = (i / 8) * Math.PI * 2;
      
      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * 60,
        y: y + Math.sin(angle) * 60,
        alpha: 0,
        scale: 0.5,
        duration: 400,
        ease: 'Power2',
        onComplete: () => particle.destroy(),
      });
    }
  }

  private handleClick(pointer: Phaser.Input.Pointer): void {
    // Convert screen position to grid position
    const gridX = Math.floor((pointer.x - GAME_CONFIG.MAP_OFFSET_X) / GAME_CONFIG.TILE_SIZE);
    const gridY = Math.floor((pointer.y - GAME_CONFIG.MAP_OFFSET_Y) / GAME_CONFIG.TILE_SIZE);
    
    // Check if within bounds
    if (gridX < 0 || gridX >= GAME_CONFIG.GRID_WIDTH || 
        gridY < 0 || gridY >= GAME_CONFIG.GRID_HEIGHT) {
      return;
    }
    
    // Check if cell is empty
    if (this.gameState && this.gameState.maze[gridY][gridX].type === 'empty') {
      // Get selected tower type from UI (default to lantern)
      const uiScene = this.scene.get('UIScene') as Phaser.Scene & { getSelectedTower?: () => string };
      const towerType = uiScene.getSelectedTower?.() || 'lantern';
      
      this.networkManager.placeTower(gridX, gridY, towerType);
    }
  }

  update(time: number, _delta: number): void {
    if (!this.gameState) return;
    
    // Handle input for current player
    if (time - this.lastMoveTime > this.moveDelay) {
      this.handleMovement(time);
    }
    
    // Handle bomb placement
    if (Phaser.Input.Keyboard.JustDown(this.wasdKeys.SPACE)) {
      this.placeBomb();
    }
  }

  private handleMovement(time: number): void {
    const player = Array.from(this.players.values()).find(p => p.isCurrentPlayer);
    if (!player) return;
    
    let dx = 0;
    let dy = 0;
    
    if (this.wasdKeys.W.isDown || this.cursors.up.isDown) dy = -1;
    else if (this.wasdKeys.S.isDown || this.cursors.down.isDown) dy = 1;
    else if (this.wasdKeys.A.isDown || this.cursors.left.isDown) dx = -1;
    else if (this.wasdKeys.D.isDown || this.cursors.right.isDown) dx = 1;
    
    if (dx !== 0 || dy !== 0) {
      const newX = player.gridX + dx;
      const newY = player.gridY + dy;
      
      // Check bounds and if cell is walkable
      if (this.gameState && 
          newX >= 0 && newX < GAME_CONFIG.GRID_WIDTH &&
          newY >= 0 && newY < GAME_CONFIG.GRID_HEIGHT &&
          this.gameState.maze[newY][newX].type === 'empty') {
        this.networkManager.movePlayer(newX, newY);
        this.lastMoveTime = time;
      }
    }
  }

  private placeBomb(): void {
    const player = Array.from(this.players.values()).find(p => p.isCurrentPlayer);
    if (!player) return;
    
    this.networkManager.placeBomb(player.gridX, player.gridY);
  }

  shutdown(): void {
    this.networkManager.disconnect();
    this.players.clear();
    this.enemies.clear();
    this.towers = [];
  }
}
