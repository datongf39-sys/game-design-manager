-- 游戏设计管理平台数据库 Schema

-- 项目表
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT,
  icon TEXT,
  created_at TEXT DEFAULT datetime('now'),
  updated_at TEXT DEFAULT datetime('now')
);

-- 模块表
CREATE TABLE IF NOT EXISTS modules (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT,
  fields_json TEXT,
  "order" INTEGER DEFAULT 0,
  created_at TEXT DEFAULT datetime('now')
);

-- 记录表
CREATE TABLE IF NOT EXISTS records (
  id TEXT PRIMARY KEY,
  module_id TEXT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  data_json TEXT,
  parent_id TEXT REFERENCES records(id) ON DELETE SET NULL,
  rich_text TEXT,
  created_at TEXT DEFAULT datetime('now'),
  updated_at TEXT DEFAULT datetime('now')
);

-- 前缀表
CREATE TABLE IF NOT EXISTS prefixes (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  prefix TEXT NOT NULL,
  created_at TEXT DEFAULT datetime('now')
);

-- 关联关系表（跨表引用）
CREATE TABLE IF NOT EXISTS relations (
  id TEXT PRIMARY KEY,
  source_record_id TEXT NOT NULL REFERENCES records(id) ON DELETE CASCADE,
  source_field_id TEXT NOT NULL,
  target_record_id TEXT NOT NULL REFERENCES records(id) ON DELETE CASCADE,
  created_at TEXT DEFAULT datetime('now')
);

-- 创建索引以提升查询性能
CREATE INDEX IF NOT EXISTS idx_records_module_id ON records(module_id);
CREATE INDEX IF NOT EXISTS idx_records_parent_id ON records(parent_id);
CREATE INDEX IF NOT EXISTS idx_relations_source ON relations(source_record_id, source_field_id);
CREATE INDEX IF NOT EXISTS idx_relations_target ON relations(target_record_id);
