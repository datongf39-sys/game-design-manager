# 游戏设计管理平台

一个轻量级的游戏设计文档管理工具，支持模块化、层级结构、富文本编辑和跨表引用。

## 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

## 部署到 Render

### 方法 1：使用 render.yaml（推荐）

1. 将代码推送到 GitHub 仓库
2. 在 Render  dashboard 点击 "New +"
3. 选择你的 GitHub 仓库
4. Render 会自动检测 `render.yaml` 配置
5. 点击 "Apply" 开始部署

### 方法 2：手动配置

1. 在 Render dashboard 点击 "New +" → "Static Site"
2. 连接你的 GitHub 仓库
3. 配置以下参数：
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `./dist`
   - **Node Version**: `18`

4. 点击 "Create Static Site"

## 技术栈

- **前端框架**: React 18
- **UI 组件库**: Ant Design 5
- **状态管理**: Zustand
- **构建工具**: Vite 6
- **富文本编辑器**: TipTap
- **数据存储**: LocalStorage（纯前端方案）

## 主要功能

- ✅ 项目管理（多项目支持）
- ✅ 模块化设计
- ✅ 自定义字段类型（文本、数字、日期、选择、富文本等）
- ✅ 层级树形结构
- ✅ 分组视图
- ✅ 前缀库管理（自动生成编号）
- ✅ 跨表引用功能
- ✅ 删除保护（有引用时禁止删除）
- ✅ 富文本编辑器

## 目录结构

```
游戏设计管理平台/
├── src/
│   ├── components/        # React 组件
│   │   ├── table/        # 表格相关组件
│   │   ├── relation/     # 关联功能组件
│   │   └── ...
│   ├── store/            # Zustand 状态管理
│   ├── utils/            # 工具函数
│   └── App.jsx           # 主应用组件
├── public/               # 静态资源
├── backend_backup/       # 后端代码（未使用）
├── render.yaml           # Render 部署配置
└── package.json
```

## 注意事项

1. **纯前端方案**：所有数据存储在浏览器 LocalStorage，无需后端服务器
2. **数据备份**：定期导出重要数据，避免浏览器缓存清空导致数据丢失
3. **浏览器兼容性**：需要支持 ES6 的现代浏览器

## 许可证

MIT
