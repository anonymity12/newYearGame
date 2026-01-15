const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const rooms = new Map();

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
    
    // Ensure spawn area is clear
    for (let y = 1; y <= 2; y++) {
      for (let x = 1; x <= 2; x++) {
        maze[y][x] = { type: 'empty' };
      }
    }
    
    // Core area (年夜饭)
    maze[height - 2][width - 2] = { type: 'core' };
    
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

  placeTower(x, y, towerType, playerId) {
    const cost = towerType === 'lantern' ? 20 : 30;
    
    if (this.sharedResources.coins >= cost) {
      this.sharedResources.coins -= cost;
      this.towers.push({
        x, y, type: towerType,
        damage: towerType === 'lantern' ? 10 : 20,
        range: towerType === 'lantern' ? 2 : 4,
        attackSpeed: towerType === 'lantern' ? 1000 : 1500
      });
      return true;
    }
    return false;
  }

  getState() {
    return {
      maze: this.maze,
      players: Array.from(this.players.values()),
      sharedResources: this.sharedResources,
      towers: this.towers,
      enemies: this.enemies,
      waveNumber: this.waveNumber
    };
  }
}

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  socket.on('joinRoom', ({ roomId, playerName }) => {
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new GameRoom(roomId));
    }
    
    const room = rooms.get(roomId);
    room.addPlayer(socket.id, playerName || `Player${room.players.size + 1}`);
    
    socket.join(roomId);
    socket.roomId = roomId;
    
    io.to(roomId).emit('gameState', room.getState());
    io.to(roomId).emit('playerJoined', { playerId: socket.id, playerName: playerName || `Player${room.players.size + 1}` });
  });
  
  socket.on('movePlayer', ({ x, y }) => {
    if (!socket.roomId) return;
    
    const room = rooms.get(socket.roomId);
    if (!room) return;
    
    const player = room.players.get(socket.id);
    if (!player) return;
    
    const cell = room.maze[y]?.[x];
    if (cell && cell.type === 'empty') {
      player.x = x;
      player.y = y;
      io.to(socket.roomId).emit('gameState', room.getState());
    }
  });
  
  socket.on('placeBomb', ({ x, y }) => {
    if (!socket.roomId) return;
    
    const room = rooms.get(socket.roomId);
    if (!room) return;
    
    const player = room.players.get(socket.id);
    if (!player || player.bombs <= 0) return;
    
    player.bombs--;
    
    setTimeout(() => {
      const destroyedCells = room.explodeBomb(x, y, socket.id);
      io.to(socket.roomId).emit('explosion', { x, y, destroyedCells });
      io.to(socket.roomId).emit('gameState', room.getState());
      
      setTimeout(() => {
        player.bombs = Math.min(player.bombs + 1, 3);
      }, 3000);
    }, 2000);
  });
  
  socket.on('placeTower', ({ x, y, towerType }) => {
    if (!socket.roomId) return;
    
    const room = rooms.get(socket.roomId);
    if (!room) return;
    
    if (room.placeTower(x, y, towerType, socket.id)) {
      io.to(socket.roomId).emit('gameState', room.getState());
      io.to(socket.roomId).emit('towerPlaced', { x, y, towerType });
    }
  });
  
  socket.on('startWave', () => {
    if (!socket.roomId) return;
    
    const room = rooms.get(socket.roomId);
    if (!room) return;
    
    room.waveNumber++;
    const enemyCount = 5 + room.waveNumber * 2;
    
    for (let i = 0; i < enemyCount; i++) {
      room.enemies.push({
        id: `enemy_${Date.now()}_${i}`,
        x: 1,
        y: 1,
        hp: 50 + room.waveNumber * 10,
        path: []
      });
    }
    
    io.to(socket.roomId).emit('gameState', room.getState());
    io.to(socket.roomId).emit('waveStarted', { waveNumber: room.waveNumber });
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    if (socket.roomId) {
      const room = rooms.get(socket.roomId);
      if (room) {
        room.removePlayer(socket.id);
        
        if (room.players.size === 0) {
          rooms.delete(socket.roomId);
        } else {
          io.to(socket.roomId).emit('gameState', room.getState());
          io.to(socket.roomId).emit('playerLeft', { playerId: socket.id });
        }
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
