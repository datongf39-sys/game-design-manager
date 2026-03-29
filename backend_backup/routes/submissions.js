/**
 * backend/routes/submissions.js
 * 表单提交接口
 */
const express = require("express");
const router = express.Router();
const db = require("../db/database");

/**
 * POST /api/public/submit/:token
 * 公开提交接口（无需鉴权）
 * 特殊要求：
 * - 通过 token 查到对应 form，验证 is_active = 1
 * - 将提交数据存入 submissions 表
 * - 如果提交数据中有 linked_record_id，验证该记录存在
 * - 不返回任何内部数据，只返回 { success: true }
 */
router.post("/public/submit/:token", (req, res) => {
  try {
    const { token } = req.params;
    const { linkedRecordId, data } = req.body;

    // 1. 验证表单是否存在且激活
    const form = db.prepare(`
      SELECT * FROM forms
      WHERE token = ? AND is_active = 1
    `).get(token);

    if (!form) {
      // 不暴露具体原因，只返回成功（防止探测）
      return res.json({ success: true });
    }

    // 2. 如果有关联记录 ID，验证其存在
    if (linkedRecordId) {
      const record = db.prepare(`
        SELECT id FROM records
        WHERE id = ? AND module_id = ?
      `).get(linkedRecordId, form.module_id);

      if (!record) {
        // 记录不存在，但仍然返回成功（不暴露内部结构）
        return res.json({ success: true });
      }
    }

    // 3. 创建提交记录
    const id = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    db.prepare(`
      INSERT INTO submissions (id, form_id, linked_record_id, data_json, status, submitted_at, updated_at)
      VALUES (?, ?, ?, ?, 'pending', datetime('now'), datetime('now'))
    `).run(
      id,
      form.id,
      linkedRecordId || null,
      JSON.stringify(data || {})
    );

    // 4. 返回成功（不暴露任何内部数据）
    res.json({ success: true });
  } catch (error) {
    console.error("Error submitting form:", error);
    // 即使出错也返回成功，防止暴露内部错误
    res.json({ success: true });
  }
});

/**
 * GET /api/submissions
 * 获取所有提交（可按状态筛选）
 * 查询参数：
 * - status: 按状态筛选 (pending | in_progress | done | rejected)
 * - formId: 按表单筛选
 */
router.get("/", (req, res) => {
  try {
    const { status, formId } = req.query;

    let sql = `
      SELECT 
        s.*,
        f.title as form_title,
        f.module_id,
        m.name as module_name,
        r.data_json as record_data_json
      FROM submissions s
      JOIN forms f ON f.id = s.form_id
      JOIN modules m ON m.id = f.module_id
      LEFT JOIN records r ON r.id = s.linked_record_id
      WHERE 1=1
    `;

    const params = [];

    if (status) {
      sql += " AND s.status = ?";
      params.push(status);
    }

    if (formId) {
      sql += " AND s.form_id = ?";
      params.push(formId);
    }

    sql += " ORDER BY s.submitted_at DESC";

    const submissions = db.prepare(sql).all(...params);

    res.json(submissions.map(s => ({
      id: s.id,
      formId: s.form_id,
      formTitle: s.form_title,
      moduleId: s.module_id,
      moduleName: s.module_name,
      linkedRecordId: s.linked_record_id,
      linkedRecordName: s.record_data_json ? JSON.parse(s.record_data_json)?.f_name : null,
      data: JSON.parse(s.data_json || "{}"),
      status: s.status,
      submittedAt: s.submitted_at,
      updatedAt: s.updated_at,
    })));
  } catch (error) {
    console.error("Error fetching submissions:", error);
    res.status(500).json({ error: "Failed to fetch submissions" });
  }
});

/**
 * GET /api/submissions/:id
 * 获取单个提交详情
 */
router.get("/:id", (req, res) => {
  try {
    const submission = db.prepare(`
      SELECT 
        s.*,
        f.title as form_title,
        f.module_id,
        m.name as module_name
      FROM submissions s
      JOIN forms f ON f.id = s.form_id
      JOIN modules m ON m.id = f.module_id
      WHERE s.id = ?
    `).get(req.params.id);

    if (!submission) {
      return res.status(404).json({ error: "Submission not found" });
    }

    res.json({
      id: submission.id,
      formId: submission.form_id,
      formTitle: submission.form_title,
      moduleId: submission.module_id,
      moduleName: submission.module_name,
      linkedRecordId: submission.linked_record_id,
      data: JSON.parse(submission.data_json || "{}"),
      status: submission.status,
      submittedAt: submission.submitted_at,
      updatedAt: submission.updated_at,
    });
  } catch (error) {
    console.error("Error fetching submission:", error);
    res.status(500).json({ error: "Failed to fetch submission" });
  }
});

/**
 * PATCH /api/submissions/:id
 * 更新提交状态
 */
router.patch("/:id", (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["pending", "in_progress", "done", "rejected"];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const submission = db.prepare("SELECT * FROM submissions WHERE id = ?").get(id);
    if (!submission) {
      return res.status(404).json({ error: "Submission not found" });
    }

    const updates = [];
    const values = [];

    if (status !== undefined) {
      updates.push("status = ?");
      values.push(status);
    }

    if (updates.length > 0) {
      updates.push("updated_at = datetime('now')");
      values.push(id);

      db.prepare(`
        UPDATE submissions
        SET ${updates.join(", ")}
        WHERE id = ?
      `).run(...values);
    }

    const updated = db.prepare("SELECT * FROM submissions WHERE id = ?").get(id);
    res.json({
      id: updated.id,
      formId: updated.form_id,
      linkedRecordId: updated.linked_record_id,
      data: JSON.parse(updated.data_json || "{}"),
      status: updated.status,
      submittedAt: updated.submitted_at,
      updatedAt: updated.updated_at,
    });
  } catch (error) {
    console.error("Error updating submission:", error);
    res.status(500).json({ error: "Failed to update submission" });
  }
});

/**
 * DELETE /api/submissions/:id
 * 删除提交
 */
router.delete("/:id", (req, res) => {
  try {
    const { id } = req.params;

    const submission = db.prepare("SELECT * FROM submissions WHERE id = ?").get(id);
    if (!submission) {
      return res.status(404).json({ error: "Submission not found" });
    }

    db.prepare("DELETE FROM submissions WHERE id = ?").run(id);

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting submission:", error);
    res.status(500).json({ error: "Failed to delete submission" });
  }
});

/**
 * GET /api/submissions/record/:recordId
 * 获取关联到某记录的所有提交
 */
router.get("/record/:recordId", (req, res) => {
  try {
    const submissions = db.prepare(`
      SELECT 
        s.*,
        f.title as form_title
      FROM submissions s
      JOIN forms f ON f.id = s.form_id
      WHERE s.linked_record_id = ?
      ORDER BY s.submitted_at DESC
    `).all(req.params.recordId);

    res.json(submissions.map(s => ({
      id: s.id,
      formId: s.form_id,
      formTitle: s.form_title,
      data: JSON.parse(s.data_json || "{}"),
      status: s.status,
      submittedAt: s.submitted_at,
      updatedAt: s.updated_at,
    })));
  } catch (error) {
    console.error("Error fetching record submissions:", error);
    res.status(500).json({ error: "Failed to fetch submissions" });
  }
});

module.exports = router;
