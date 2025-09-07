# Vercel 部署指南

## 🚀 部署步骤

### 1. 准备项目
确保项目已经正确构建：
```bash
npm run build
```

### 2. 推送到 Git 仓库
```bash
git add .
git commit -m "准备部署到 Vercel"
git push origin main
```

### 3. 在 Vercel 中部署

#### 方法1: 通过 Vercel 网站
1. 访问 [vercel.com](https://vercel.com)
2. 点击 "New Project"
3. 导入您的 Git 仓库
4. 选择项目根目录
5. 点击 "Deploy"

#### 方法2: 通过 Vercel CLI
```bash
npm install -g vercel
vercel
```

### 4. 配置设置

#### 自动检测配置
Vercel 会自动检测到这是一个 Next.js 项目，使用以下配置：
- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

#### 环境变量（如果需要）
在 Vercel 项目设置中添加环境变量：
- `NODE_ENV`: `production`

## 📁 项目文件说明

### 关键配置文件
- `vercel.json`: Vercel 部署配置
- `next.config.ts`: Next.js 配置
- `package.json`: 项目依赖和脚本

### 构建输出
- `.next/`: Next.js 构建输出目录
- `public/`: 静态资源目录

## 🔧 故障排除

### 常见问题

#### 1. 构建失败
**错误**: Build failed
**解决方案**:
- 检查 `package.json` 中的依赖
- 确保所有 TypeScript 类型错误已修复
- 运行 `npm run lint` 检查代码问题

#### 2. 404 错误
**错误**: Page not found
**解决方案**:
- 确保 `vercel.json` 配置正确
- 检查路由配置
- 确认构建成功

#### 3. 依赖问题
**错误**: Module not found
**解决方案**:
- 检查 `package.json` 中的依赖版本
- 确保所有依赖都已正确安装
- 删除 `node_modules` 和 `package-lock.json`，重新安装

### 调试步骤

1. **本地测试**:
   ```bash
   npm run build
   npm run start
   ```

2. **检查构建日志**:
   - 在 Vercel 控制台查看构建日志
   - 检查是否有错误或警告

3. **检查部署日志**:
   - 查看 Vercel 部署日志
   - 确认部署成功

## 📊 性能优化

### 构建优化
- 使用 `npm run build` 进行生产构建
- 确保所有静态资源正确引用
- 优化图片和字体资源

### 运行时优化
- 启用 Vercel 的 CDN
- 使用 Vercel 的 Edge Functions（如果需要）
- 配置适当的缓存策略

## 🔄 持续部署

### 自动部署
- 每次推送到主分支都会自动触发部署
- 可以通过 Vercel 控制台查看部署状态
- 支持预览部署（Pull Request）

### 手动部署
```bash
vercel --prod
```

## 📈 监控和分析

### Vercel Analytics
- 启用 Vercel Analytics 查看访问统计
- 监控页面性能指标
- 分析用户行为

### 错误监控
- 配置错误监控服务
- 设置告警通知
- 定期检查应用健康状态

## 🛡️ 安全配置

### 环境变量
- 不要在代码中硬编码敏感信息
- 使用 Vercel 的环境变量功能
- 定期轮换 API 密钥

### 访问控制
- 配置适当的 CORS 设置
- 使用 HTTPS（Vercel 自动提供）
- 设置安全头部

## 📚 相关资源

- [Vercel 文档](https://vercel.com/docs)
- [Next.js 部署文档](https://nextjs.org/docs/deployment)
- [Vercel CLI 文档](https://vercel.com/docs/cli)
