/**
 * backend/routes/relations.js
 * 关联关系接口
 */
const express = require("express");
const router = express.Router();
const db = require("../db/database");

// 建立关联（同步写入 relations 表）
router.post("/", (req, res) => {
  try {
    const { sourceRecordId, sourceFieldId, targetRecordIds } = req.body;
    
    // 先删除该字段的旧关联，再插入新的（简单覆盖策略）
    db.prepare(
      "DELETE FROM relations WHERE source_record_id=? AND source_field_id=?"
    ).run(sourceRecordId, sourceFieldId);
    
    const insert = db.prepare(`
      INSERT INTO relations (id, source_record_id, source_field_id, target_record_id)
      VALUES (?, ?, ?, ?)
    `);
    
    // 批量插入
    const insertMany = db.transaction((ids) => {
      ids.forEach(targetId => {
        insert.run(
          `rel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          sourceRecordId,
          sourceFieldId,
          targetId
        );
      });
    });
    
    insertMany(targetRecordIds);
    res.json({ success: true });
  } catch (error) {
    console.error("Error creating relation:", error);
    res.status(500).json({ error: "Failed to create relation" });
  }
});

// 删除关联
router.delete("/", (req, res) => {
  try {
    const { sourceRecordId, sourceFieldId, targetRecordId } = req.body;
    
    db.prepare(
      "DELETE FROM relations WHERE source_record_id=? AND source_field_id=? AND target_record_id=?"
    ).run(sourceRecordId, sourceFieldId, targetRecordId);
    
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting relation:", error);
    res.status(500).json({ error: "Failed to delete relation" });
  }
});

// 查询某记录被哪些记录引用（反向关联）
router.get("/backlinks/:recordId", (req, res) => {
  try {
    const backlinks = db.prepare(`
      SELECT 
        r.source_record_id,
        r.source_field_id,
        rec.data_json,
        m.id as module_id,
        m.name as module_name,
        m.fields_json
      FROM relations r
      JOIN records rec ON rec.id = r.source_record_id
      JOIN modules m ON m.id = rec.module_id
      WHERE r.target_record_id = ?
    `).all(req.params.recordId);
    
    const result = backlinks.map(b => {
      const data = JSON.parse(b.data_json || "{}");
      const fields = JSON.parse(b.fields_json || "[]");
      const field = fields.find(f => f.id === b.source_field_id);
      
      return {
        sourceRecordId: b.source_record_id,
        sourceRecordName: data[field?.relationConfig?.displayFieldId] || data.f_name || b.source_record_id,
        sourceModuleId: b.module_id,
        sourceModuleName: b.module_name,
        sourceFieldId: b.source_field_id,
        sourceFieldName: field?.name || "未知字段",
      };
    });
    
    res.json(result);
  } catch (error) {
    console.error("Error fetching backlinks:", error);
    res.status(500).json({ error: "Failed to fetch backlinks" });
  }
});

module.exports = router;
