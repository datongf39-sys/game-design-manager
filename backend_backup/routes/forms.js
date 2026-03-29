/**
 * backend/routes/forms.js
 * 表单配置接口
 */
const express = require("express");
const router = express.Router();
const db = require("../db/database");
const { v4: uuidv4 } = require("uuid");

/**
 * 生成随机 token
 */
function generateToken() {
  return uuidv4().replace(/-/g, "").substr(0, 16);
}

/**
 * GET /api/forms/:moduleId
 * 获取某模块的表单配置列表
 */
router.get("/:moduleId", (req, res) => {
  try {
    const forms = db.prepare(`
      SELECT * FROM forms
      WHERE module_id = ?
      ORDER BY created_at DESC
    `).all(req.params.moduleId);

    res.json(forms.map(f => ({
      id: f.id,
      moduleId: f.module_id,
      title: f.title,
      description: f.description,
      token: f.token,
      config: JSON.parse(f.config_json || "{}"),
      isActive: f.is_active === 1,
      createdAt: f.created_at,
    })));
  } catch (error) {
    console.error("Error fetching forms:", error);
    res.status(500).json({ error: "Failed to fetch forms" });
  }
});

/**
 * GET /api/public/form/:token
 * 公开接口：通过 token 获取表单配置（无需鉴权）
 * 只返回脱敏后的配置
 */
router.get("/public/form/:token", (req, res) => {
  try {
    const form = db.prepare(`
      SELECT f.*, m.name as module_name, m.fields_json as module_fields
      FROM forms f
      JOIN modules m ON m.id = f.module_id
      WHERE f.token = ?
    `).get(req.params.token);

    if (!form) {
      return res.status(404).json({ error: "Form not found" });
    }

    const config = JSON.parse(form.config_json || "{}");
    const moduleFields = JSON.parse(form.module_fields || "[]");
    
    // 只暴露配置的字段
    const exposedFields = (config.exposedFields || []).map(fieldId => {
      const field = moduleFields.find(f => f.id === fieldId);
      return field ? {
        id: field.id,
        name: field.name,
        type: field.type,
        required: field.required || false,
      } : null;
    }).filter(Boolean);

    res.json({
      id: form.id,
      title: form.title,
      description: form.description,
      isActive: form.is_active === 1,
      config: {
        includeRecordLink: config.includeRecordLink || false,
        recordLinkLabel: config.recordLinkLabel || "关联记录",
      },
      fields: exposedFields,
    });
  } catch (error) {
    console.error("Error fetching public form:", error);
    res.status(500).json({ error: "Failed to fetch form" });
  }
});

/**
 * GET /api/public/form/:token/options
 * 公开接口：获取关联记录的可选项（只返回 ID+ 名称）
 */
router.get("/public/form/:token/options", (req, res) => {
  try {
    const form = db.prepare(`
      SELECT f.module_id
      FROM forms f
      WHERE f.token = ? AND f.is_active = 1
    `).get(req.params.token);

    if (!form) {
      return res.status(404).json({ error: "Form not found or inactive" });
    }

    // 获取该模块的所有记录，只返回 ID 和名称字段
    const records = db.prepare(`
      SELECT id, data_json
      FROM records
      WHERE module_id = ?
    `).all(form.module_id);

    const options = records.map(r => {
      const data = JSON.parse(r.data_json || "{}");
      return {
        id: r.id,
        name: data.f_name || r.id,
      };
    });

    res.json(options);
  } catch (error) {
    console.error("Error fetching form options:", error);
    res.status(500).json({ error: "Failed to fetch options" });
  }
});

/**
 * POST /api/forms
 * 创建表单配置
 */
router.post("/", (req, res) => {
  try {
    const { moduleId, title, description, config } = req.body;

    if (!moduleId || !title) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const token = generateToken();
    const id = `form_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    db.prepare(`
      INSERT INTO forms (id, module_id, title, description, token, config_json, is_active)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `).run(
      id,
      moduleId,
      title,
      description || "",
      token,
      JSON.stringify(config || {})
    );

    res.json({
      id,
      moduleId,
      title,
      description,
      token,
      config: config || {},
      isActive: true,
    });
  } catch (error) {
    console.error("Error creating form:", error);
    res.status(500).json({ error: "Failed to create form" });
  }
});

/**
 * PATCH /api/forms/:formId
 * 更新表单配置（含停用）
 */
router.patch("/:formId", (req, res) => {
  try {
    const { formId } = req.params;
    const { title, description, config, isActive } = req.body;

    const form = db.prepare("SELECT * FROM forms WHERE id = ?").get(formId);
    if (!form) {
      return res.status(404).json({ error: "Form not found" });
    }

    const updates = [];
    const values = [];

    if (title !== undefined) {
      updates.push("title = ?");
      values.push(title);
    }
    if (description !== undefined) {
      updates.push("description = ?");
      values.push(description);
    }
    if (config !== undefined) {
      updates.push("config_json = ?");
      values.push(JSON.stringify(config));
    }
    if (isActive !== undefined) {
      updates.push("is_active = ?");
      values.push(isActive ? 1 : 0);
    }

    if (updates.length > 0) {
      updates.push("updated_at = datetime('now')");
      values.push(formId);

      db.prepare(`
        UPDATE forms
        SET ${updates.join(", ")}
        WHERE id = ?
      `).run(...values);
    }

    const updated = db.prepare("SELECT * FROM forms WHERE id = ?").get(formId);
    res.json({
      id: updated.id,
      moduleId: updated.module_id,
      title: updated.title,
      description: updated.description,
      token: updated.token,
      config: JSON.parse(updated.config_json || "{}"),
      isActive: updated.is_active === 1,
    });
  } catch (error) {
    console.error("Error updating form:", error);
    res.status(500).json({ error: "Failed to update form" });
  }
});

/**
 * DELETE /api/forms/:formId
 * 删除表单
 */
router.delete("/:formId", (req, res) => {
  try {
    const { formId } = req.params;

    const form = db.prepare("SELECT * FROM forms WHERE id = ?").get(formId);
    if (!form) {
      return res.status(404).json({ error: "Form not found" });
    }

    // 删除相关的提交记录
    db.prepare("DELETE FROM submissions WHERE form_id = ?").run(formId);
    
    // 删除表单
    db.prepare("DELETE FROM forms WHERE id = ?").run(formId);

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting form:", error);
    res.status(500).json({ error: "Failed to delete form" });
  }
});

module.exports = router;
