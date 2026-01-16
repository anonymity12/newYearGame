const { GameRoom } = require('./GameRoom');

/**
 * RoomManager - Manages all game rooms
 */
class RoomManager {
  constructor() {
    this.rooms = new Map();
  }

  getRoom(roomId) {
    return this.rooms.get(roomId);
  }

  getOrCreateRoom(roomId) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new GameRoom(roomId));
    }
    return this.rooms.get(roomId);
  }

  removeRoom(roomId) {
    const room = this.rooms.get(roomId);
    if (room) {
      room.stopGameLoop();
      this.rooms.delete(roomId);
    }
  }

  getRoomCount() {
    return this.rooms.size;
  }

  getAllRooms() {
    return Array.from(this.rooms.values());
  }
}

// Singleton instance
const roomManager = new RoomManager();

module.exports = { roomManager };
