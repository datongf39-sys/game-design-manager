/**
 * server.js
 * 后端服务主入口
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Module 的 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 导入数据库（会自动初始化表）
import db from './backend_backup/db/database.js';

// 导入路由
import formsRoutes from './backend_backup/routes/forms.js';
import submissionsRoutes from './backend_backup/routes/submissions.js';
import relationsRoutes from './backend_backup/routes/relations.js';
import searchRoutes from './backend_backup/routes/search.js';

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

export default app;
