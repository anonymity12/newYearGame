const socket = io();

let currentRoom = null;
let playerName = null;
let gameState = null;
let selectedTower = null;
let myPlayerId = null;

const CELL_SIZE = 40;
const CANVAS_WIDTH = 20 * CELL_SIZE;
const CANVAS_HEIGHT = 15 * CELL_SIZE;

// UI Elements
const loginScreen = document.getElementById('login-screen');
const gameScreen = document.getElementById('game-screen');
const joinBtn = document.getElementById('join-btn');
const playerNameInput = document.getElementById('player-name');
const roomIdInput = document.getElementById('room-id');
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const currentRoomSpan = document.getElementById('current-room');
const playersContainer = document.getElementById('players-container');
const sharedCoinsSpan = document.getElementById('shared-coins');
const waveNumberSpan = document.getElementById('wave-number');
const startWaveBtn = document.getElementById('start-wave-btn');
const towerBtns = document.querySelectorAll('.tower-btn');
const coreHpSpan = document.getElementById('core-hp');
const coreHpFill = document.getElementById('core-hp-fill');

canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

// Join game
joinBtn.addEventListener('click', () => {
  const name = playerNameInput.value.trim();
  const room = roomIdInput.value.trim();
  
  if (!room) {
    alert('请输入房间号！');
    return;
  }
  
  playerName = name || `Player${Math.floor(Math.random() * 1000)}`;
  currentRoom = room;
  myPlayerId = socket.id;
  
  socket.emit('joinRoom', { roomId: room, playerName: playerName });
  
  loginScreen.style.display = 'none';
  gameScreen.style.display = 'block';
  currentRoomSpan.textContent = room;
});

// Tower selection
towerBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    towerBtns.forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedTower = btn.getAttribute('data-tower');
  });
});

// Start wave
startWaveBtn.addEventListener('click', () => {
  socket.emit('startWave');
});

// Canvas click for tower placement
canvas.addEventListener('click', (e) => {
  if (!selectedTower || !gameState) return;
  
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((e.clientX - rect.left) / CELL_SIZE);
  const y = Math.floor((e.clientY - rect.top) / CELL_SIZE);
  
  if (gameState.maze[y] && gameState.maze[y][x] && gameState.maze[y][x].type === 'empty') {
    socket.emit('placeTower', { x, y, towerType: selectedTower });
  }
});

// Keyboard controls
document.addEventListener('keydown', (e) => {
  if (!gameState) return;
  
  const player = gameState.players.find(p => p.id === socket.id);
  if (!player) return;
  
  let newX = player.x;
  let newY = player.y;
  
  switch(e.key.toLowerCase()) {
    case 'w':
      newY--;
      break;
    case 's':
      newY++;
      break;
    case 'a':
      newX--;
      break;
    case 'd':
      newX++;
      break;
    case ' ':
      e.preventDefault();
      socket.emit('placeBomb', { x: player.x, y: player.y });
      return;
  }
  
  if (newX !== player.x || newY !== player.y) {
    socket.emit('movePlayer', { x: newX, y: newY });
  }
});

// Socket events
socket.on('gameState', (state) => {
  gameState = state;
  updateUI();
  render();
});

socket.on('playerJoined', (data) => {
  console.log('Player joined:', data.playerName);
});

socket.on('playerLeft', (data) => {
  console.log('Player left:', data.playerId);
});

socket.on('explosion', (data) => {
  console.log('Explosion at:', data.x, data.y);
  renderExplosion(data.x, data.y);
});

socket.on('towerPlaced', (data) => {
  console.log('Tower placed:', data.towerType, 'at', data.x, data.y);
});

socket.on('waveStarted', (data) => {
  console.log('Wave started:', data.waveNumber);
});

socket.on('waveComplete', (data) => {
  alert(`第 ${data.waveNumber} 波完成！准备下一波！`);
});

socket.on('gameOver', (data) => {
  if (data.victory) {
    alert('胜利！你们成功守卫了年夜饭！');
  } else {
    alert('失败！年夜饭被小年兽吃掉了！');
  }
});

function updateUI() {
  if (!gameState) return;
  
  // Update players list
  playersContainer.innerHTML = gameState.players.map(p => 
    `<div>${p.name} ${p.id === socket.id ? '(你)' : ''}</div>`
  ).join('');
  
  // Update shared resources
  sharedCoinsSpan.textContent = gameState.sharedResources.coins;
  
  // Update wave number
  waveNumberSpan.textContent = gameState.waveNumber;
  
  // Update core HP
  coreHpSpan.textContent = gameState.coreHP || 100;
  const hpPercent = (gameState.coreHP || 100) / 100;
  coreHpFill.style.width = `${hpPercent * 100}%`;
}

function render() {
  if (!gameState) return;
  
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Draw maze
  for (let y = 0; y < gameState.maze.length; y++) {
    for (let x = 0; x < gameState.maze[y].length; x++) {
      const cell = gameState.maze[y][x];
      const cellX = x * CELL_SIZE;
      const cellY = y * CELL_SIZE;
      
      // Background
      ctx.fillStyle = '#f5f5f5';
      ctx.fillRect(cellX, cellY, CELL_SIZE, CELL_SIZE);
      
      // Grid
      ctx.strokeStyle = '#ddd';
      ctx.strokeRect(cellX, cellY, CELL_SIZE, CELL_SIZE);
      
      // Cell content
      ctx.fillStyle = '#333';
      ctx.font = '24px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      if (cell.type === 'wall') {
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(cellX, cellY, CELL_SIZE, CELL_SIZE);
      } else if (cell.type === 'obstacle') {
        const emoji = {
          'firecracker': '🧨',
          'goods': '📦',
          'snow': '❄️'
        }[cell.obstacleType] || '📦';
        ctx.fillText(emoji, cellX + CELL_SIZE / 2, cellY + CELL_SIZE / 2);
      } else if (cell.type === 'core') {
        ctx.fillStyle = '#ffe6e6';
        ctx.fillRect(cellX, cellY, CELL_SIZE, CELL_SIZE);
        ctx.fillText('🍜', cellX + CELL_SIZE / 2, cellY + CELL_SIZE / 2);
      }
    }
  }
  
  // Draw towers
  gameState.towers.forEach(tower => {
    const emoji = tower.type === 'lantern' ? '🏮' : '🧨';
    ctx.fillStyle = '#333';
    ctx.font = '28px Arial';
    ctx.fillText(emoji, tower.x * CELL_SIZE + CELL_SIZE / 2, tower.y * CELL_SIZE + CELL_SIZE / 2);
    
    // Draw range indicator
    ctx.strokeStyle = 'rgba(255, 107, 107, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(
      tower.x * CELL_SIZE + CELL_SIZE / 2,
      tower.y * CELL_SIZE + CELL_SIZE / 2,
      tower.range * CELL_SIZE,
      0,
      Math.PI * 2
    );
    ctx.stroke();
  });
  
  // Draw enemies
  gameState.enemies.forEach(enemy => {
    ctx.fillStyle = '#333';
    ctx.font = '28px Arial';
    ctx.fillText('🐲', enemy.x * CELL_SIZE + CELL_SIZE / 2, enemy.y * CELL_SIZE + CELL_SIZE / 2);
    
    // Draw health bar
    const hpBarWidth = CELL_SIZE - 10;
    const hpBarHeight = 5;
    const hpPercent = enemy.hp / (50 + gameState.waveNumber * 10);
    
    ctx.fillStyle = '#333';
    ctx.fillRect(enemy.x * CELL_SIZE + 5, enemy.y * CELL_SIZE + 5, hpBarWidth, hpBarHeight);
    ctx.fillStyle = '#ff6b6b';
    ctx.fillRect(enemy.x * CELL_SIZE + 5, enemy.y * CELL_SIZE + 5, hpBarWidth * hpPercent, hpBarHeight);
  });
  
  // Draw players
  gameState.players.forEach(player => {
    const isMe = player.id === socket.id;
    
    // Player circle
    ctx.fillStyle = isMe ? '#4ecdc4' : '#ff6b6b';
    ctx.beginPath();
    ctx.arc(
      player.x * CELL_SIZE + CELL_SIZE / 2,
      player.y * CELL_SIZE + CELL_SIZE / 2,
      CELL_SIZE / 3,
      0,
      Math.PI * 2
    );
    ctx.fill();
    
    // Player name
    ctx.fillStyle = '#333';
    ctx.font = 'bold 12px Arial';
    ctx.fillText(player.name, player.x * CELL_SIZE + CELL_SIZE / 2, player.y * CELL_SIZE - 10);
    
    // Bomb count
    ctx.font = '16px Arial';
    ctx.fillText(`💣${player.bombs}`, player.x * CELL_SIZE + CELL_SIZE / 2, player.y * CELL_SIZE + CELL_SIZE + 10);
  });
}

function renderExplosion(x, y) {
  const explosionRadius = 1.5 * CELL_SIZE;
  
  ctx.save();
  ctx.globalAlpha = 0.7;
  ctx.fillStyle = '#ff6b6b';
  ctx.beginPath();
  ctx.arc(
    x * CELL_SIZE + CELL_SIZE / 2,
    y * CELL_SIZE + CELL_SIZE / 2,
    explosionRadius,
    0,
    Math.PI * 2
  );
  ctx.fill();
  ctx.restore();
  
  setTimeout(() => {
    render();
  }, 200);
}

// Initial render
render();
