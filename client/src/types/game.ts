/**
 * Game type definitions
 * 游戏类型定义
 */

export interface MazeCell {
  type: 'wall' | 'empty' | 'core' | 'obstacle';
  destructible?: boolean;
  obstacleType?: 'firecracker' | 'goods' | 'snow';
}

export interface PlayerData {
  id: string;
  name: string;
  x: number;
  y: number;
  bombs: number;
  resources?: {
    niangao: number;
    hongbao: number;
    koi: number;
  };
}

export interface EnemyData {
  id: string;
  x: number;
  y: number;
  hp: number;
  maxHp?: number;
  path?: { x: number; y: number }[];
}

export interface TowerData {
  x: number;
  y: number;
  type: string;
  damage?: number;
  range: number;
  attackSpeed?: number;
  lastAttack?: number;
}

export interface SharedResources {
  coins: number;
}

export interface GameState {
  maze: MazeCell[][];
  players: PlayerData[];
  sharedResources: SharedResources;
  towers: TowerData[];
  enemies: EnemyData[];
  waveNumber: number;
  coreHP: number;
}

export interface ExplosionData {
  x: number;
  y: number;
  destroyedCells: Array<{
    x: number;
    y: number;
    resource: string | null;
  }>;
}

export interface GameOverData {
  victory: boolean;
}

export interface WaveData {
  waveNumber: number;
}
