# Render 部署检查清单

## ✅ 已完成配置

### 1. 项目配置文件
- [x] `render.yaml` - Render 部署配置
- [x] `.nvmrc` - Node.js 版本指定 (18.x)
- [x] `.gitignore` - Git 忽略文件配置
- [x] `package.json` - 项目依赖和脚本

### 2. 构建配置
- [x] `vite.config.js` - Vite 构建配置
  - base: '/'
  - rollupOptions 配置了正确的输出文件名
- [x] `public/_headers` - MIME 类型配置
  - JS: application/javascript; charset=utf-8
  - CSS: text/css; charset=utf-8
  - JSON: application/json; charset=utf-8
  - 图片、字体文件类型

### 3. 入口文件
- [x] `index.html` - HTML 入口
  - 使用相对路径 `./src/main.jsx`
- [x] `src/main.jsx` - React 入口

### 4. 代码质量
- [x] 所有 JSX 文件语法检查通过
- [x] 无 TypeScript/ESLint 错误
- [x] 依赖导入正确

### 5. 功能模块
- [x] 项目管理
- [x] 模块管理
- [x] 记录管理（CRUD）
- [x] 层级树形结构
- [x] 富文本编辑器
- [x] 跨表引用功能
- [x] 删除保护

## 🚀 部署步骤

### 首次部署
1. **推送到 GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **在 Render 部署**
   - 访问 https://render.com
   - 登录/注册
   - 点击 "New +" → "Static Site"
   - 选择你的 GitHub 仓库
   - 确认配置：
     - Build Command: `npm install && npm run build`
     - Publish Directory: `./dist`
   - 点击 "Create Static Site"

3. **等待构建完成**
   - 大约需要 2-5 分钟
   - 可以在 Render Dashboard 查看构建日志
   - 构建成功后会显示预览 URL

### 后续更新
1. 推送代码到 GitHub：
   ```bash
   git add .
   git commit -m "更新说明"
   git push
   ```

2. Render 会自动重新部署
   - 可以在 Deployments 标签页查看部署历史
   - 如果自动部署失败，可以手动点击 "Deploy"

## 🔍 故障排查

### 常见错误及解决方案

#### 1. MIME Type 错误
**错误**: `Failed to load module script: Expected a JavaScript-or-Wasm module script but the server responded with a MIME type of "binary/octet-stream"`

**解决方案**:
- ✅ 已配置 `public/_headers` 文件
- ✅ 已配置 `render.yaml` headers
- 确保文件扩展名正确（.js, .css 等）

#### 2. 404 错误
**错误**: 访问页面显示 404

**解决方案**:
- 检查 Publish Directory 是否为 `./dist`
- 确认 build 命令执行成功
- 检查 `index.html` 中的路径是否正确

#### 3. 构建失败
**错误**: `Build failed`

**解决方案**:
- 检查 Node.js 版本（使用 .nvmrc 指定 18.x）
- 确认 `package.json` 中的依赖版本正确
- 查看构建日志找出具体错误

#### 4. 白屏/无法加载
**错误**: 页面空白，控制台有错误

**解决方案**:
- 检查 `vite.config.js` 中的 `base` 配置
- 确认所有 import 路径正确
- 检查浏览器控制台错误信息

## 📊 部署后验证

部署成功后，请按以下步骤验证：

1. **访问网站**
   - 打开 Render 提供的 URL
   - 应该能看到应用首页

2. **测试功能**
   - [ ] 创建新项目
   - [ ] 添加新模块
   - [ ] 添加记录
   - [ ] 编辑记录（各种字段类型）
   - [ ] 创建层级关系
   - [ ] 使用富文本编辑器
   - [ ] 创建跨表引用
   - [ ] 测试删除保护

3. **检查控制台**
   - 打开浏览器开发者工具
   - 确认没有 JavaScript 错误
   - 确认没有网络请求错误

4. **测试数据持久化**
   - 刷新页面
   - 确认数据仍然存在（LocalStorage）

## 📝 注意事项

1. **LocalStorage 限制**
   - 数据存储在用户浏览器本地
   - 不同设备/浏览器之间数据不共享
   - 清除浏览器缓存会丢失数据

2. **建议**
   - 定期导出数据备份
   - 考虑未来集成后端数据库
   - 添加数据导入/导出功能

3. **性能优化**
   - 大量数据时可能影响性能
   - 考虑实现分页/懒加载
   - 优化 LocalStorage 读写策略

## 🆘 获取帮助

如果遇到问题：
1. 查看 Render 部署日志
2. 检查浏览器控制台错误
3. 验证所有配置文件正确
4. 参考 Render 官方文档：https://render.com/docs
