# UNS App - Next.js + Node-RED 集成

这是一个集成了 Node-RED 事件流处理引擎的 Next.js 应用，用于 UNS (Universal Namespace System) 主题浏览和事件流管理。

## 🚀 功能特性

- **UNS 主题浏览器**: 交互式浏览工厂主题结构
- **Node-RED 集成**: 事件流处理引擎
- **实时状态监控**: 服务状态检查
- **响应式设计**: 现代化的用户界面

## 📁 项目结构

```
UNSapp/
├── src/
│   └── app/
│       ├── page.tsx                    # UNS 主题浏览器主页
│       ├── eventflow/
│       │   ├── page.tsx               # EventFlow 状态页面
│       │   └── [...path]/route.ts     # Node-RED 代理路由
│       └── layout.tsx                 # 根布局
├── nodered-data/                      # Node-RED 数据目录
├── nodered-settings.js               # Node-RED 配置
├── package.json                      # 项目依赖和脚本
└── README.md                         # 项目说明
```

## 🛠️ 安装和运行

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发环境

```bash
# 同时启动 Next.js 和 Node-RED
npm run dev:full

# 或者分别启动
npm run dev        # 启动 Next.js (端口 3000)
npm run nodered    # 启动 Node-RED (端口 1880)
```

### 3. 访问应用

- **主页 (UNS 浏览器)**: http://localhost:3000
- **EventFlow 状态页**: http://localhost:3000/eventflow
- **Node-RED 编辑器**: http://localhost:3000/eventflow/editor
- **Node-RED API**: http://localhost:3000/eventflow/api

## 📋 可用命令

```bash
# 开发
npm run dev              # 启动 Next.js 开发服务器
npm run nodered          # 启动 Node-RED
npm run nodered:dev      # 启动 Node-RED (详细日志)
npm run dev:full         # 同时启动 Next.js 和 Node-RED

# 构建和部署
npm run build            # 构建生产版本
npm run start            # 启动生产服务器
npm run lint             # 运行代码检查
```

## ⚙️ 配置

### 环境变量

```bash
# Node-RED 配置
NODE_RED_PORT=1880
NODE_RED_HOST=localhost
```

### Node-RED 设置

- **管理界面路径**: `/eventflow`
- **API 路径**: `/eventflow/api`
- **用户目录**: `./nodered-data`
- **默认登录**: admin/password

## 🔧 开发指南

### 添加新的 UNS 主题

1. 编辑 `src/app/page.tsx` 中的 `initialDATA` 对象
2. 添加新的主题节点和模板
3. 确保路径格式符合 UNS 规范

### 创建 Node-RED 流程

1. 访问 http://localhost:3000/eventflow/editor
2. 拖拽节点创建事件流
3. 配置节点参数和连接
4. 部署流程

### 自定义 API 端点

1. 在 Node-RED 中创建 HTTP 输入节点
2. 设置路径为 `/eventflow/api/your-endpoint`
3. 添加处理逻辑和输出节点

## 🚀 部署到 Vercel

1. 确保所有依赖已安装
2. 构建项目: `npm run build`
3. 推送到 Git 仓库
4. 在 Vercel 中导入项目
5. 设置环境变量:
   - `NODE_RED_PORT`: 1880
   - `NODE_RED_HOST`: localhost (或您的 Node-RED 服务器地址)

## 🔗 与 UNS 系统集成

### 主题格式

UNS 主题遵循以下格式:
```
v1/FY-Fab/{domain}/{site}/{type}/{topic}
```

例如:
- `v1/FY-Fab/erp/site/state/order_registry`
- `v1/FY-Fab/sm/LASER1/metrics/cycle_ms`

### 主题类型

- **metrics**: 时间序列数据 (如传感器读数)
- **state**: 状态数据 (如设备状态)
- **action**: 动作命令 (如控制指令)
- **info**: 信息数据 (如配置信息)

## 🛠️ 故障排除

### Node-RED 无法启动
- 检查端口 1880 是否被占用
- 确认 `nodered-data` 目录存在
- 查看控制台错误信息

### 代理不工作
- 确认 Node-RED 在指定端口运行
- 检查环境变量配置
- 查看 Next.js 控制台日志

### 构建失败
- 运行 `npm run lint` 检查代码问题
- 确保所有依赖已正确安装
- 检查 TypeScript 类型错误

## 📚 更多资源

- [Next.js 文档](https://nextjs.org/docs)
- [Node-RED 文档](https://nodered.org/docs/)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [Lucide React 图标](https://lucide.dev/)

## 📄 许可证

MIT License