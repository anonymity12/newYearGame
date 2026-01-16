# 🧨 守卫年夜饭 - Defend the New Year's Eve Dinner

一款融合**炸弹人**、**迷宫**和**塔防**元素的新年主题合家欢小游戏！

🎮 A multiplayer tower defense game combining Bomberman, Maze, and TD mechanics with Chinese New Year theme.

## 📁 Project Structure (v2.0 - Separated Frontend/Backend)

This is a monorepo with separated frontend and backend:

```
newYearGame/
├── client/                 # Frontend (Vite + PhaserJS + TypeScript)
│   ├── src/
│   │   ├── scenes/        # Phaser game scenes
│   │   ├── entities/      # Game entities (Player, Enemy, Tower)
│   │   ├── managers/      # Network and resource managers
│   │   ├── config/        # Game configuration
│   │   ├── types/         # TypeScript definitions
│   │   └── assets/        # Game assets (sprites, audio)
│   └── index.html
├── server/                 # Backend (Express + Socket.IO)
│   └── src/
│       ├── game/          # Game logic (GameRoom, RoomManager)
│       ├── socket/        # Socket event handlers
│       └── middleware/    # Express middleware
├── scripts/               # Utility scripts
│   └── generate-assets.js # Gemini AI asset generator
├── public/                # [Legacy] Original frontend
└── package.json           # Monorepo configuration
```

## 🎮 游戏特色

- **动态迷宫生成** - 炸开爆竹堆、年货箱和雪堆来清理道路
- **资源收集系统** - 收集年糕、红包和锦鲤碎片
- **共享聚宝盆** - 全家人共享资源池，考验默契配合
- **防御塔建设** - 建造大红灯笼塔和二踢脚发射器
- **多人联机** - 通过房间号与家人朋友一起游戏
- **波次挑战** - 抵御一波又一波的小年兽进攻

## 🚀 快速开始

### 安装依赖

```bash
# Install all dependencies (root + workspaces)
npm install
```

### 开发模式

```bash
# Run both frontend and backend in development mode
npm run dev

# Or run separately:
npm run dev:server  # Backend on http://localhost:3000
npm run dev:client  # Frontend on http://localhost:5173
```

### 生产构建

```bash
# Build frontend
npm run build

# Start production server
npm run start
```

## 🎨 使用 Gemini AI 生成游戏资源

项目包含使用 Google Gemini Flash Image 模型生成中国新年主题游戏精灵图的脚本。

```bash
# 设置 API key 并运行
GEMINI_API_KEY=your_api_key npm run generate-assets

# 或作为参数传递
node scripts/generate-assets.js --api-key=your_api_key
```

生成的资源包括:
- 🏠 瓦片精灵 (墙壁、地板、核心)
- 📦 障碍物精灵 (爆竹、礼盒、雪堆)
- 🐯 玩家角色 (中国生肖动物: 虎、龙、兔、牛)
- 🐲 敌人精灵 (年兽)
- 🏮 防御塔精灵 (灯笼塔、二踢脚发射器)
- 🧧 资源拾取物 (年糕、红包、锦鲤)
- ✨ 效果精灵 (爆炸、光束)
- 🎨 UI 元素 (面板、按钮)

### 游戏玩法

1. 输入你的名字和房间号（例如：2026）
2. 点击"加入游戏"进入房间
3. 使用 WASD 键移动角色
4. 按空格键放置炸弹，炸开障碍物
5. 收集掉落的资源（红包会自动进入聚宝盆）
6. 选择防御塔类型，点击空地放置防御塔
7. 点击"开始下一波"召唤小年兽
8. 保护年夜饭不被小年兽吃掉！

## 🎯 游戏元素

### 障碍物（可炸毁）
- 🧨 爆竹堆
- 📦 年货箱
- ❄️ 雪堆

### 资源
- 🍚 年糕 - 建造资源
- 🧧 红包 - 自动存入聚宝盆（每个 +10 金币）
- 🐟 锦鲤碎片 - 特殊资源

### 防御塔
- 🏮 **大红灯笼塔** (20金币) - 基础单体攻击，射程2格
- 🧨 **二踢脚发射器** (30金币) - 远程范围伤害，射程4格

### 敌人
- 🐲 **小年兽** - 会沿着路径前往年夜饭

### 守护目标
- 🍜 **年夜饭** - 必须守护的核心

## 🔧 技术栈

- **后端**: Node.js + Express + Socket.IO
- **前端**: HTML5 Canvas + 原生 JavaScript
- **实时通信**: WebSocket (Socket.IO)

## 📝 游戏机制

### 炸弹系统
- 每个玩家初始有3个炸弹
- 放置炸弹后2秒爆炸
- 爆炸范围：十字型（上下左右各1格）
- 炸弹使用后3秒恢复1个

### 聚宝盆（共享资源池）
- 所有玩家收集的红包都存入聚宝盆
- 任何玩家都可以使用聚宝盆中的金币建造防御塔
- 考验团队协作和资源分配

### 波次系统
- 每波敌人数量：5 + 波次数 × 2
- 敌人生命值：50 + 波次数 × 10
- 敌人会寻找最短路径到达年夜饭

## 🎨 设计理念

- **低门槛** - 简单的操作，易于上手
- **高互动** - 多人协作，共享资源
- **强烈的视觉喜庆感** - 新年主题，红黄配色
- **互坑乐趣** - 可以炸开别人的路径，也可以合作建造防御

## 📄 许可证

MIT License