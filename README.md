# UNS App - Next.js 主题浏览器

这是一个用于 UNS (Universal Namespace System) 主题浏览的 Next.js 应用，提供交互式的工厂主题结构浏览和管理功能。

- **UNS 主题浏览器**: 交互式浏览工厂主题结构
- **实时搜索**: 快速搜索主题名称、路径和描述
- **JSON 导入导出**: 支持主题数据的导入和导出



## 安装和运行

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发环境

```bash
npm run dev        # 启动 Next.js 开发服务器 (端口 3000)
```

### 3. 访问应用

- **主页 (UNS 浏览器)**: http://localhost:3000


## ⚙️ 配置

### 主题数据配置

主题数据在 `src/app/page.tsx` 文件中的 `initialDATA` 对象中定义，您可以：

- 修改主题结构
- 添加新的主题节点
- 更新主题模板和描述


## 与 UNS 系统集成

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
