const { roomManager } = require('../game/RoomManager');

/**
 * Setup Socket.IO event handlers
 */
function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log('🔌 New client connected:', socket.id);
    
    socket.on('joinRoom', ({ roomId, playerName }) => {
      const room = roomManager.getOrCreateRoom(roomId);
      room.addPlayer(socket.id, playerName || `Player${room.players.size + 1}`);
      
      socket.join(roomId);
      socket.roomId = roomId;
      
      io.to(roomId).emit('gameState', room.getState());
      io.to(roomId).emit('playerJoined', { 
        playerId: socket.id, 
        playerName: playerName || `Player${room.players.size}` 
      });
      
      console.log(`👤 Player joined room ${roomId}: ${playerName}`);
    });
    
    socket.on('movePlayer', ({ x, y }) => {
      if (!socket.roomId) return;
      
      const room = roomManager.getRoom(socket.roomId);
      if (!room) return;
      
      if (room.movePlayer(socket.id, x, y)) {
        io.to(socket.roomId).emit('gameState', room.getState());
      }
    });
    
    socket.on('placeBomb', ({ x, y }) => {
      if (!socket.roomId) return;
      
      const room = roomManager.getRoom(socket.roomId);
      if (!room) return;
      
      room.placeBomb(socket.id, x, y, (destroyedCells) => {
        io.to(socket.roomId).emit('explosion', { x, y, destroyedCells });
        io.to(socket.roomId).emit('gameState', room.getState());
      });
    });
    
    socket.on('placeTower', ({ x, y, towerType }) => {
      if (!socket.roomId) return;
      
      const room = roomManager.getRoom(socket.roomId);
      if (!room) return;
      
      if (room.placeTower(x, y, towerType, socket.id)) {
        io.to(socket.roomId).emit('gameState', room.getState());
        io.to(socket.roomId).emit('towerPlaced', { x, y, towerType });
      }
    });
    
    socket.on('startWave', () => {
      if (!socket.roomId) return;
      
      const room = roomManager.getRoom(socket.roomId);
      if (!room) return;
      
      const waveNumber = room.startWave();
      room.startGameLoop(io);
      
      io.to(socket.roomId).emit('gameState', room.getState());
      io.to(socket.roomId).emit('waveStarted', { waveNumber });
      
      console.log(`🌊 Wave ${waveNumber} started in room ${socket.roomId}`);
    });
    
    socket.on('disconnect', () => {
      console.log('🔌 Client disconnected:', socket.id);
      
      if (socket.roomId) {
        const room = roomManager.getRoom(socket.roomId);
        if (room) {
          room.removePlayer(socket.id);
          
          if (room.players.size === 0) {
            roomManager.removeRoom(socket.roomId);
            console.log(`🚪 Room ${socket.roomId} closed (no players)`);
          } else {
            io.to(socket.roomId).emit('gameState', room.getState());
            io.to(socket.roomId).emit('playerLeft', { playerId: socket.id });
          }
        }
      }
    });
  });
}

module.exports = { setupSocketHandlers };
