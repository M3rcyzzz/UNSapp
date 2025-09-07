# Node-RED EventFlow 集成

本项目集成了 Node-RED 作为事件流处理引擎，可以通过 `/eventflow` 路由访问。

## 🚀 快速开始

### 1. 启动开发环境

```bash
# 同时启动 Next.js 和 Node-RED
npm run dev:full

# 或者分别启动
npm run dev        # 启动 Next.js (端口 3000)
npm run nodered    # 启动 Node-RED (端口 1880)
```

### 2. 访问 Node-RED

- **Node-RED 编辑器**: http://localhost:3000/eventflow
- **直接访问**: http://localhost:1880/eventflow

### 3. 默认登录信息

- 用户名: `admin`
- 密码: `password`

## 📁 项目结构

```
UNSapp/
├── src/app/eventflow/[...path]/route.ts  # Node-RED 代理路由
├── nodered-settings.js                   # Node-RED 配置
├── nodered-data/                         # Node-RED 数据目录
│   ├── flows.json                        # 流程定义
│   └── flows_cred.json                   # 凭据文件
└── package.json                          # 包含 Node-RED 脚本
```

## ⚙️ 配置说明

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
- **端口**: 1880 (可通过环境变量修改)

## 🔧 开发命令

```bash
# 开发模式 (详细日志)
npm run nodered:dev

# 生产模式
npm run nodered

# 同时启动 Next.js 和 Node-RED
npm run dev:full
```

## 📝 使用说明

1. **创建流程**: 在 Node-RED 编辑器中拖拽节点创建事件流
2. **API 端点**: 通过 `/eventflow/api/your-endpoint` 访问自定义 API
3. **数据存储**: 流程数据保存在 `nodered-data/` 目录
4. **集成**: Node-RED 可以与 UNS 主题系统集成处理事件流

## 🔗 与 UNS 集成

Node-RED 可以订阅和发布 UNS 主题：

```javascript
// 在 Node-RED 中订阅 UNS 主题
// 主题格式: v1/FY-Fab/erp/site/state/order_registry
```

## 🚀 部署到 Vercel

1. 确保 Node-RED 配置正确
2. 构建项目: `npm run build`
3. 部署到 Vercel
4. 设置环境变量 `NODE_RED_PORT` 和 `NODE_RED_HOST`

## 🛠️ 故障排除

### Node-RED 无法启动
- 检查端口 1880 是否被占用
- 确认 `nodered-data` 目录存在
- 查看控制台错误信息

### 代理不工作
- 确认 Node-RED 在指定端口运行
- 检查环境变量配置
- 查看 Next.js 控制台日志

## 📚 更多资源

- [Node-RED 官方文档](https://nodered.org/docs/)
- [Next.js API 路由](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [UNS 主题系统文档](./README.md)
