# UNS Interactive Browser

[中文文档](#中文文档) | English

A modern web application for browsing and managing UNS (Unified Namespace) topic structures in industrial environments. Built with Next.js and TypeScript.

## ✨ Features

- **Interactive Tree Browser**: Navigate UNS topic hierarchies with expand/collapse functionality
- **Real-time Search**: Find topics by name, path, or description
- **Live MQTT Connection**: Connect to MQTT brokers for real-time data visualization
- **JSON Import/Export**: Import custom UNS structures or export current configurations
- **Self-test Validation**: Built-in validation for UNS structure integrity
- **Statistics Dashboard**: View message rates and topic counts by type

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd UNSapp

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:3000` to access the application.

## 📖 Usage

### Browsing Topics
- Use the namespace tree to explore topic hierarchies
- Click on topics to view detailed information
- Use the search bar to quickly find specific topics

### MQTT Connection
- Configure MQTT broker settings in the connection panel
- Connect to view live data with message rates
- Monitor connection status and statistics

### Import/Export
- Import JSON files containing UNS topic structures
- Export current configurations for backup or sharing
- Validate imported structures with built-in self-tests

## 🏗️ UNS Standard

UNS follows the pattern: `Version/Site/Function/Station/Type/Topic`

### Topic Types
- **metrics**: Time-series data (sensors, measurements)
- **state**: Current system state (device status, configurations)  
- **action**: Commands and triggers (control instructions)

### Example Topics
```
v1/FY-Fab/erp/state/order-registry
v1/FY-Fab/sm/LASER1/metrics/cycle-ms
v1/FY-Fab/warehouse/AGV1/action/start
```

## 🛠️ Development

### Project Structure
```
src/app/
├── page.tsx          # Main application component
├── mqtt-config.tsx   # MQTT connection management
├── types.ts          # TypeScript definitions
└── uns_export.json   # Default UNS structure
```

### Key Technologies
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **MQTT.js**: MQTT client for real-time data
- **IBM Plex Mono**: Monospace font for technical content

## 📄 License

MIT License - see LICENSE file for details.

---

## 中文文档

UNS交互式浏览器 - 用于浏览和管理工业环境中UNS（统一命名空间）主题结构的现代Web应用程序。

### ✨ 主要功能

- **交互式树形浏览器**: 浏览UNS主题层次结构，支持展开/折叠
- **实时搜索**: 按名称、路径或描述搜索主题
- **MQTT实时连接**: 连接MQTT代理服务器，实时数据可视化
- **JSON导入导出**: 导入自定义UNS结构或导出当前配置
- **自检验证**: 内置UNS结构完整性验证
- **统计仪表板**: 查看消息速率和按类型统计的主题数量

### 🚀 快速开始

```bash
# 克隆仓库
git clone <repository-url>
cd UNSapp

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问 `http://localhost:3000` 使用应用程序。

### 📖 使用说明

**浏览主题**: 使用命名空间树探索主题层次结构，点击主题查看详细信息

**MQTT连接**: 在连接面板中配置MQTT代理设置，连接后查看实时数据和消息速率

**导入导出**: 导入包含UNS主题结构的JSON文件，导出当前配置进行备份或分享

### 🏗️ UNS标准

UNS遵循模式: `版本/站点/功能/工站/类型/主题`

**主题类型**:
- **metrics**: 时间序列数据（传感器、测量值）
- **state**: 当前系统状态（设备状态、配置）
- **action**: 命令和触发器（控制指令）

**示例主题**:
```
v1/FY-Fab/erp/state/order-registry
v1/FY-Fab/sm/LASER1/metrics/cycle-ms
v1/FY-Fab/warehouse/AGV1/action/start
```