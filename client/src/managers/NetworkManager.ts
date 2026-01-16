import { io, Socket } from 'socket.io-client';
import { GAME_CONFIG } from '../config/gameConfig';
import { GameState, ExplosionData, GameOverData, WaveData } from '../types/game';

/**
 * NetworkManager - Handles all socket.io communication with the server
 * 网络管理器 - 处理与服务器的所有Socket.IO通信
 */
export class NetworkManager {
  private static instance: NetworkManager;
  private socket: Socket | null = null;
  private connected: boolean = false;
  
  // Event callbacks
  private onGameStateCallback: ((state: GameState) => void) | null = null;
  private onExplosionCallback: ((data: ExplosionData) => void) | null = null;
  private onGameOverCallback: ((data: GameOverData) => void) | null = null;
  private onWaveStartedCallback: ((data: WaveData) => void) | null = null;
  private onWaveCompleteCallback: ((data: WaveData) => void) | null = null;
  private onPlayerJoinedCallback: ((data: { playerId: string; playerName: string }) => void) | null = null;
  private onPlayerLeftCallback: ((data: { playerId: string }) => void) | null = null;

  private constructor() {}

  public static getInstance(): NetworkManager {
    if (!NetworkManager.instance) {
      NetworkManager.instance = new NetworkManager();
    }
    return NetworkManager.instance;
  }

  public connect(): void {
    if (this.socket && this.connected) {
      console.log('Already connected to server');
      return;
    }

    console.log(`Connecting to server: ${GAME_CONFIG.SERVER_URL}`);
    
    this.socket = io(GAME_CONFIG.SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ Connected to server:', this.socket?.id);
      this.connected = true;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from server:', reason);
      this.connected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error.message);
    });

    // Game events
    this.socket.on('gameState', (state: GameState) => {
      if (this.onGameStateCallback) {
        this.onGameStateCallback(state);
      }
    });

    this.socket.on('explosion', (data: ExplosionData) => {
      if (this.onExplosionCallback) {
        this.onExplosionCallback(data);
      }
    });

    this.socket.on('gameOver', (data: GameOverData) => {
      if (this.onGameOverCallback) {
        this.onGameOverCallback(data);
      }
    });

    this.socket.on('waveStarted', (data: WaveData) => {
      if (this.onWaveStartedCallback) {
        this.onWaveStartedCallback(data);
      }
    });

    this.socket.on('waveComplete', (data: WaveData) => {
      if (this.onWaveCompleteCallback) {
        this.onWaveCompleteCallback(data);
      }
    });

    this.socket.on('playerJoined', (data: { playerId: string; playerName: string }) => {
      console.log(`👤 Player joined: ${data.playerName}`);
      if (this.onPlayerJoinedCallback) {
        this.onPlayerJoinedCallback(data);
      }
    });

    this.socket.on('playerLeft', (data: { playerId: string }) => {
      console.log(`👋 Player left: ${data.playerId}`);
      if (this.onPlayerLeftCallback) {
        this.onPlayerLeftCallback(data);
      }
    });

    this.socket.on('towerPlaced', (data: { x: number; y: number; towerType: string }) => {
      console.log(`🏰 Tower placed at (${data.x}, ${data.y}): ${data.towerType}`);
    });
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  public getSocketId(): string {
    return this.socket?.id || '';
  }

  public isConnected(): boolean {
    return this.connected;
  }

  // Game actions
  public joinRoom(roomId: string, playerName: string): void {
    if (!this.socket) {
      console.error('Not connected to server');
      return;
    }
    console.log(`Joining room: ${roomId} as ${playerName}`);
    this.socket.emit('joinRoom', { roomId, playerName });
  }

  public movePlayer(x: number, y: number): void {
    if (!this.socket) return;
    this.socket.emit('movePlayer', { x, y });
  }

  public placeBomb(x: number, y: number): void {
    if (!this.socket) return;
    this.socket.emit('placeBomb', { x, y });
  }

  public placeTower(x: number, y: number, towerType: string): void {
    if (!this.socket) return;
    this.socket.emit('placeTower', { x, y, towerType });
  }

  public startWave(): void {
    if (!this.socket) return;
    this.socket.emit('startWave');
  }

  // Event handlers
  public onGameState(callback: (state: GameState) => void): void {
    this.onGameStateCallback = callback;
  }

  public onExplosion(callback: (data: ExplosionData) => void): void {
    this.onExplosionCallback = callback;
  }

  public onGameOver(callback: (data: GameOverData) => void): void {
    this.onGameOverCallback = callback;
  }

  public onWaveStarted(callback: (data: WaveData) => void): void {
    this.onWaveStartedCallback = callback;
  }

  public onWaveComplete(callback: (data: WaveData) => void): void {
    this.onWaveCompleteCallback = callback;
  }

  public onPlayerJoined(callback: (data: { playerId: string; playerName: string }) => void): void {
    this.onPlayerJoinedCallback = callback;
  }

  public onPlayerLeft(callback: (data: { playerId: string }) => void): void {
    this.onPlayerLeftCallback = callback;
  }
}
