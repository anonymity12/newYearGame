/**
 * Game configuration constants
 * 游戏配置常量
 */

export const GAME_CONFIG = {
  // Screen dimensions
  SCREEN_WIDTH: 1280,
  SCREEN_HEIGHT: 720,

  // Grid settings
  GRID_WIDTH: 20,
  GRID_HEIGHT: 15,
  TILE_SIZE: 40,

  // Map offset (for centering the game grid)
  MAP_OFFSET_X: 80,
  MAP_OFFSET_Y: 20,

  // Server URL
  SERVER_URL: import.meta.env.VITE_SERVER_URL || 'http://localhost:3000',
};

export const TOWER_CONFIG = {
  lantern: {
    name: '大红灯笼塔',
    nameEn: 'Lantern Tower',
    cost: 20,
    damage: 10,
    range: 2,
    attackSpeed: 1000,
    description: '发射红光攻击敌人',
  },
  firecracker: {
    name: '二踢脚发射器',
    nameEn: 'Firecracker Launcher',
    cost: 30,
    damage: 20,
    range: 4,
    attackSpeed: 1500,
    description: '发射鞭炮造成范围伤害',
  },
};

export const ENEMY_CONFIG = {
  nian: {
    name: '小年兽',
    baseHp: 50,
    hpPerWave: 10,
    speed: 0.5,
    damage: 10,
  },
};

export const RESOURCE_CONFIG = {
  niangao: {
    name: '年糕',
    icon: '🍚',
  },
  hongbao: {
    name: '红包',
    icon: '🧧',
    coinValue: 10,
  },
  koi: {
    name: '锦鲤碎片',
    icon: '🐟',
  },
};

export const COLORS = {
  // Chinese New Year palette
  PRIMARY_RED: 0xDC143C,
  DARK_RED: 0x8B0000,
  GOLD: 0xFFD700,
  ORANGE: 0xFFA500,
  WHITE: 0xFFFFFF,
  BLACK: 0x000000,
  
  // UI colors
  HP_BAR_BG: 0x333333,
  HP_BAR_FILL: 0xFF0000,
  HP_BAR_CORE: 0x00FF00,
  
  // Grid colors
  WALL: 0x8B4513,
  EMPTY: 0xF5DEB3,
  CORE: 0xFFD700,
};
