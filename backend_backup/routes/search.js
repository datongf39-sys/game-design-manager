/**
 * backend/routes/search.js
 * 全局搜索接口
 */
const express = require("express");
const router = express.Router();
const db = require("../db/database");

/**
 * GET /api/search
 * 全文搜索接口
 * 查询参数：
 * - projectId: 项目 ID（必需）
 * - q: 搜索关键词（必需）
 * - limit: 结果数量限制（可选，默认 50）
 */
router.get("/", (req, res) => {
  try {
    const { projectId, q, limit = 50 } = req.query;

    if (!projectId || !q) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    const searchQuery = q.toLowerCase();

    // 获取项目的所有模块
    const modules = db.prepare(`
      SELECT id, name, fields_json
      FROM modules
      WHERE project_id = ?
    `).all(projectId);

    if (!modules || modules.length === 0) {
      return res.json([]);
    }

    const results = [];

    // 在每个模块中搜索
    for (const module of modules) {
      const fields = JSON.parse(module.fields_json || "[]");
      const nameField = fields.find(f => f.id === "f_name");
      const nameFieldId = nameField?.id || "f_name";

      // 获取模块的所有记录
      const records = db.prepare(`
        SELECT id, data_json
        FROM records
        WHERE module_id = ?
      `).all(module.id);

      // 搜索匹配的记录
      for (const record of records) {
        const data = JSON.parse(record.data_json || "{}");
        let matchField = null;
        let matchFound = false;

        // 检查 ID 是否匹配
        if (record.id.toLowerCase().includes(searchQuery)) {
          matchField = "id";
          matchFound = true;
        }

        // 检查各个字段是否匹配
        if (!matchFound) {
          for (const [fieldId, fieldValue] of Object.entries(data)) {
            const strValue = String(fieldValue).toLowerCase();
            if (strValue.includes(searchQuery)) {
              matchField = fieldId;
              matchFound = true;
              break;
            }
          }
        }

        if (matchFound) {
          results.push({
            recordId: record.id,
            recordName: data[nameFieldId] || record.id,
            moduleId: module.id,
            moduleName: module.name,
            matchField: matchField,
          });

          // 限制结果数量
          if (results.length >= limit) {
            break;
          }
        }
      }

      if (results.length >= limit) {
        break;
      }
    }

    res.json(results);
  } catch (error) {
    console.error("Error searching:", error);
    res.status(500).json({ error: "Failed to search" });
  }
});

module.exports = router;
