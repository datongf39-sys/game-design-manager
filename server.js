/**
 * server.js
 * 后端服务主入口
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

// 导入数据库（会自动初始化表）
const db = require('./backend_backup/db/database');

// 导入路由
const formsRoutes = require('./backend_backup/routes/forms');
const submissionsRoutes = require('./backend_backup/routes/submissions');
const relationsRoutes = require('./backend_backup/routes/relations');
const searchRoutes = require('./backend_backup/routes/search');

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());

// 使用路由
app.use('/api/forms', formsRoutes);
app.use('/api/submissions', submissionsRoutes);
app.use('/api/relations', relationsRoutes);
app.use('/api/search', searchRoutes);

// 健康检查接口
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 生产环境：提供静态文件
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, 'dist');
  app.use(express.static(distPath));

  // 所有非 API 请求都返回 index.html（支持前端路由）
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// 错误处理
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
