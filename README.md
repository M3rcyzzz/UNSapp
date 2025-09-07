# UNS App - Next.js 主题浏览器

这是一个用于 UNS (Universal Namespace System) 主题浏览的 Next.js 应用，提供交互式的工厂主题结构浏览和管理功能。

## 🚀 功能特性

- **UNS 主题浏览器**: 交互式浏览工厂主题结构
- **实时搜索**: 快速搜索主题名称、路径和描述
- **JSON 导入导出**: 支持主题数据的导入和导出
- **响应式设计**: 现代化的用户界面

## 📁 项目结构

```
UNSapp/
├── src/
│   └── app/
│       ├── page.tsx                    # UNS 主题浏览器主页
│       └── layout.tsx                 # 根布局
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
npm run dev        # 启动 Next.js 开发服务器 (端口 3000)
```

### 3. 访问应用

- **主页 (UNS 浏览器)**: http://localhost:3000

## 📋 可用命令

```bash
# 开发
npm run dev              # 启动 Next.js 开发服务器

# 构建和部署
npm run build            # 构建生产版本
npm run start            # 启动生产服务器
npm run lint             # 运行代码检查
```

## ⚙️ 配置

### 主题数据配置

主题数据在 `src/app/page.tsx` 文件中的 `initialDATA` 对象中定义，您可以：

- 修改主题结构
- 添加新的主题节点
- 更新主题模板和描述

## 🔧 开发指南

### 添加新的 UNS 主题

1. 编辑 `src/app/page.tsx` 中的 `initialDATA` 对象
2. 添加新的主题节点和模板
3. 确保路径格式符合 UNS 规范

### 自定义主题类型

1. 在 `TopicType` 类型定义中添加新的类型
2. 在 `TypeBadge` 组件中添加对应的样式
3. 更新主题数据以使用新的类型

## 🚀 部署到 Vercel

1. 确保所有依赖已安装
2. 构建项目: `npm run build`
3. 推送到 Git 仓库
4. 在 Vercel 中导入项目
5. 部署完成，无需额外配置

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

### 构建失败
- 运行 `npm run lint` 检查代码问题
- 确保所有依赖已正确安装
- 检查 TypeScript 类型错误

### 主题数据不显示
- 检查 `initialDATA` 对象格式是否正确
- 确认 JSON 结构符合预期
- 查看浏览器控制台错误信息

## 📚 更多资源

- [Next.js 文档](https://nextjs.org/docs)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [Lucide React 图标](https://lucide.dev/)
- [React 文档](https://react.dev/)

## 📄 许可证

MIT License