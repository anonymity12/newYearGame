/**
 * GameRoom - Manages a single game room instance
 * Handles maze generation, player management, tower defense, and wave mechanics
 */
class GameRoom {
  constructor(roomId) {
    this.roomId = roomId;
    this.players = new Map();
    this.maze = this.generateMaze();
    this.sharedResources = { coins: 0 }; // 聚宝盆 - shared resource pool
    this.towers = [];
    this.enemies = [];
    this.waveNumber = 0;
    this.gameStarted = false;
    this.gameLoop = null;
    this.coreX = 18;
    this.coreY = 13;
    this.coreHP = 100;
  }

  generateMaze() {
    const width = 20;
    const height = 15;
    const maze = [];
    
    for (let y = 0; y < height; y++) {
      maze[y] = [];
      for (let x = 0; x < width; x++) {
        if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
          maze[y][x] = { type: 'wall', destructible: false };
        } else if (Math.random() < 0.4) {
          const obstacleTypes = ['firecracker', 'goods', 'snow'];
          const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
          maze[y][x] = { type: 'obstacle', obstacleType: type, destructible: true };
        } else {
          maze[y][x] = { type: 'empty' };
        }
      }
    }
    
    // Ensure spawn area is clear (top-left for players)
    for (let y = 1; y <= 3; y++) {
      for (let x = 1; x <= 3; x++) {
        maze[y][x] = { type: 'empty' };
      }
    }
    
    // Ensure enemy spawn row is clear (y=1, the row below the top wall)
    for (let x = 1; x < width - 1; x++) {
      maze[1][x] = { type: 'empty' };
    }
    
    // Ensure a path exists from top to bottom-right (clear a corridor)
    // Clear vertical path on the right side
    for (let y = 1; y < height - 1; y++) {
      maze[y][width - 3] = { type: 'empty' };
    }
    // Clear horizontal path at bottom
    for (let x = 1; x < width - 1; x++) {
      maze[height - 3][x] = { type: 'empty' };
    }
    
    // Core area (年夜饭)
    maze[height - 2][width - 2] = { type: 'core' };
    // Ensure core is accessible
    maze[height - 2][width - 3] = { type: 'empty' };
    maze[height - 3][width - 2] = { type: 'empty' };
    
    return maze;
  }

  addPlayer(playerId, playerName) {
    this.players.set(playerId, {
      id: playerId,
      name: playerName,
      x: 1,
      y: 1,
      resources: { niangao: 0, hongbao: 0, koi: 0 },
      bombs: 3
    });
  }

  removePlayer(playerId) {
    this.players.delete(playerId);
  }

  movePlayer(playerId, x, y) {
    const player = this.players.get(playerId);
    if (!player) return false;

    const cell = this.maze[y]?.[x];
    if (cell && cell.type === 'empty') {
      player.x = x;
      player.y = y;
      return true;
    }
    return false;
  }

  explodeBomb(x, y, playerId) {
    const destroyedCells = [];
    const directions = [[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1]];
    
    directions.forEach(([dx, dy]) => {
      const nx = x + dx;
      const ny = y + dy;
      
      if (ny >= 0 && ny < this.maze.length && nx >= 0 && nx < this.maze[0].length) {
        const cell = this.maze[ny][nx];
        if (cell.destructible) {
          this.maze[ny][nx] = { type: 'empty' };
          
          // Drop resources
          const dropType = Math.random();
          let resource = null;
          if (dropType < 0.4) resource = 'niangao';
          else if (dropType < 0.7) resource = 'hongbao';
          else if (dropType < 0.85) resource = 'koi';
          
          if (resource) {
            destroyedCells.push({ x: nx, y: ny, resource });
            
            // Add to shared pool for hongbao
            if (resource === 'hongbao') {
              this.sharedResources.coins += 10;
            }
          } else {
            destroyedCells.push({ x: nx, y: ny, resource: null });
          }
        }
      }
    });
    
    return destroyedCells;
  }

  placeBomb(playerId, x, y, callback) {
    const player = this.players.get(playerId);
    if (!player || player.bombs <= 0) return false;

    player.bombs--;

    // Bomb explodes after 2 seconds
    setTimeout(() => {
      const destroyedCells = this.explodeBomb(x, y, playerId);
      this.invalidateEnemyPaths();
      callback(destroyedCells);

      // Regenerate bomb after 3 more seconds
      setTimeout(() => {
        const currentPlayer = this.players.get(playerId);
        if (currentPlayer) {
          currentPlayer.bombs = Math.min(currentPlayer.bombs + 1, 3);
        }
      }, 3000);
    }, 2000);

    return true;
  }

  placeTower(x, y, towerType, playerId) {
    const cost = towerType === 'lantern' ? 20 : 30;
    
    if (this.sharedResources.coins >= cost) {
      this.sharedResources.coins -= cost;
      this.towers.push({
        x, y, type: towerType,
        damage: towerType === 'lantern' ? 10 : 20,
        range: towerType === 'lantern' ? 2 : 4,
        attackSpeed: towerType === 'lantern' ? 1000 : 1500,
        lastAttack: 0
      });
      return true;
    }
    return false;
  }

  findPath(startX, startY, endX, endY) {
    // Simple BFS pathfinding
    const queue = [[startX, startY, []]];
    const visited = new Set();
    visited.add(`${startX},${startY}`);
    
    while (queue.length > 0) {
      const [x, y, path] = queue.shift();
      
      if (x === endX && y === endY) {
        return path;
      }
      
      const directions = [[0, -1], [1, 0], [0, 1], [-1, 0]];
      for (const [dx, dy] of directions) {
        const nx = x + dx;
        const ny = y + dy;
        const key = `${nx},${ny}`;
        
        if (!visited.has(key) && 
            ny >= 0 && ny < this.maze.length && 
            nx >= 0 && nx < this.maze[0].length) {
          const cell = this.maze[ny][nx];
          if (cell.type === 'empty' || cell.type === 'core') {
            visited.add(key);
            queue.push([nx, ny, [...path, { x: nx, y: ny }]]);
          }
        }
      }
    }
    
    return [];
  }

  updateEnemies() {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      
      if (enemy.hp <= 0) {
        this.enemies.splice(i, 1);
        this.sharedResources.coins += 5; // Reward for killing enemy
        continue;
      }
      
      // Update path if needed or not cached
      if (!enemy.path || enemy.path.length === 0 || !enemy.pathCached) {
        enemy.path = this.findPath(enemy.x, enemy.y, this.coreX, this.coreY);
        enemy.pathCached = true;
      }
      
      // Move along path
      if (enemy.path && enemy.path.length > 0) {
        const nextPos = enemy.path[0];
        enemy.x = nextPos.x;
        enemy.y = nextPos.y;
        enemy.path.shift();
        
        // Check if reached core
        if (enemy.x === this.coreX && enemy.y === this.coreY) {
          this.coreHP -= 10;
          this.enemies.splice(i, 1);
        }
      }
    }
  }

  invalidateEnemyPaths() {
    this.enemies.forEach(enemy => {
      enemy.pathCached = false;
    });
  }

  updateTowers() {
    const now = Date.now();
    
    this.towers.forEach(tower => {
      if (now - tower.lastAttack < tower.attackSpeed) {
        return;
      }
      
      // Find enemies in range
      for (const enemy of this.enemies) {
        const dist = Math.sqrt(
          Math.pow(enemy.x - tower.x, 2) + 
          Math.pow(enemy.y - tower.y, 2)
        );
        
        if (dist <= tower.range) {
          enemy.hp -= tower.damage;
          tower.lastAttack = now;
          break; // One target per attack
        }
      }
    });
  }

  startWave() {
    this.waveNumber++;
    const enemyCount = 5 + this.waveNumber * 2;
    
    // Spawn enemies at different positions along the top edge
    for (let i = 0; i < enemyCount; i++) {
      const spawnX = 1 + (i % (this.maze[0].length - 2));
      const spawnY = 1;
      this.enemies.push({
        id: `enemy_${Date.now()}_${i}`,
        x: spawnX,
        y: spawnY,
        hp: 50 + this.waveNumber * 10,
        maxHp: 50 + this.waveNumber * 10,
        path: []
      });
    }

    return this.waveNumber;
  }

  startGameLoop(io) {
    if (this.gameLoop) {
      return;
    }
    
    this.gameLoop = setInterval(() => {
      const hadEnemies = this.enemies.length > 0;
      
      if (hadEnemies) {
        this.updateEnemies();
        this.updateTowers();
      }
      
      io.to(this.roomId).emit('gameState', this.getState());
      
      if (this.coreHP <= 0) {
        io.to(this.roomId).emit('gameOver', { victory: false });
        this.stopGameLoop();
      } else if (hadEnemies && this.enemies.length === 0) {
        io.to(this.roomId).emit('waveComplete', { waveNumber: this.waveNumber });
      }
    }, 500);
  }

  stopGameLoop() {
    if (this.gameLoop) {
      clearInterval(this.gameLoop);
      this.gameLoop = null;
    }
  }

  getState() {
    return {
      maze: this.maze,
      players: Array.from(this.players.values()),
      sharedResources: this.sharedResources,
      towers: this.towers,
      enemies: this.enemies,
      waveNumber: this.waveNumber,
      coreHP: this.coreHP
    };
  }
}

module.exports = { GameRoom };
