/**
 * backup.js
 * 数据备份工具
 * 功能：
 * - 导出项目为 JSON 文件
 * - 导出项目为 CSV 文件
 * - 从 JSON 备份恢复项目
 */

import { storage } from "./storage";

/**
 * 导出项目为 JSON 文件
 * @param {string} projectId - 项目 ID
 * @returns {Promise<void>}
 */
export async function exportProjectJSON(projectId, project) {
  try {
    // 获取项目的所有模块
    const modules = storage.get(`modules_${projectId}`) || [];
    
    // 获取项目的所有前缀
    const prefixes = storage.get(`prefixes_${projectId}`) || [];

    // 为每个模块拉取所有记录
    const modulesWithRecords = await Promise.all(
      modules.map(async (mod) => ({
        name: mod.name,
        icon: mod.icon,
        order: mod.order,
        fields: mod.fields || [],
        records: storage.get(`records_${mod.id}`) || [],
      }))
    );

    const backup = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      project: {
        name: project.name,
        color: project.color,
        icon: project.icon,
      },
      prefixes: prefixes.map((p) => ({ name: p.name, prefix: p.prefix })),
      modules: modulesWithRecords.map((m) => ({
        name: m.name,
        icon: m.icon,
        order: m.order,
        prefixRef: prefixes.find((p) => m.fields?.some(f => f.options?.some(opt => opt.prefixId === p.id)))?.prefix,
        fields: m.fields,
        records: m.records.map((r) => ({
          id: r.id,
          data: r.data,
          parentId: r.parentId,
          richText: r.richText,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        })),
      })),
    };

    // 触发浏览器下载
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    a.href = url;
    a.download = `${project.name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, "_")}_${date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return { success: true, backup };
  } catch (error) {
    console.error("Export failed:", error);
    throw error;
  }
}

/**
 * 导出模块为 CSV 文件
 * @param {string} moduleId - 模块 ID
 * @param {Array} fields - 字段数组
 * @param {string} moduleName - 模块名称
 * @returns {Promise<void>}
 */
export async function exportModuleCSV(moduleId, fields, moduleName) {
  try {
    const records = storage.get(`records_${moduleId}`) || [];
    
    // CSV 表头
    const headers = ["ID", "父级 ID", "创建时间", "更新时间"];
    const fieldIds = [];
    
    fields.forEach((field) => {
      headers.push(field.name);
      fieldIds.push(field.id);
    });

    // CSV 内容
    const rows = records.map((record) => {
      const row = [
        record.id,
        record.parentId || "",
        record.createdAt,
        record.updatedAt,
      ];
      
      fieldIds.forEach((fieldId) => {
        let value = record.data?.[fieldId] ?? "";
        // 如果是数组，转为字符串
        if (Array.isArray(value)) {
          value = value.join(",");
        }
        // 转义逗号和引号
        value = String(value).replace(/"/g, '""');
        if (value.includes(",") || value.includes('"') || value.includes("\n")) {
          value = `"${value}"`;
        }
        row.push(value);
      });
      
      return row.join(",");
    });

    // 组合 CSV 内容
    const csvContent = [headers.join(","), ...rows].join("\n");

    // 触发浏览器下载
    const blob = new Blob(["\ufeff" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    a.href = url;
    a.download = `${moduleName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, "_")}_${date}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return { success: true };
  } catch (error) {
    console.error("CSV Export failed:", error);
    throw error;
  }
}

/**
 * 从 JSON 备份恢复项目
 * @param {File} file - JSON 文件
 * @returns {Promise<Object>} 恢复结果
 */
export async function importProjectJSON(file) {
  try {
    const text = await file.text();
    const backup = JSON.parse(text);

    // 验证备份格式
    if (!backup.version || !backup.project || !backup.modules) {
      throw new Error("无效的备份文件格式");
    }

    // 生成新的项目 ID 避免冲突
    const newProjectId = `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 统计信息
    const stats = {
      moduleCount: backup.modules.length,
      recordCount: 0,
      prefixCount: backup.prefixes?.length || 0,
    };

    // 计算总记录数
    backup.modules.forEach((mod) => {
      stats.recordCount += mod.records?.length || 0;
    });

    return {
      success: true,
      backup,
      newProjectId,
      stats,
    };
  } catch (error) {
    console.error("Import failed:", error);
    throw error;
  }
}

/**
 * 实际写入备份数据到 localStorage
 * @param {Object} backup - 备份数据
 * @param {string} newProjectId - 新项目 ID
 * @param {Object} projectData - 项目基础数据
 */
export async function writeBackupToStorage(backup, newProjectId, projectData) {
  try {
    // 创建新项目
    const newProject = {
      id: newProjectId,
      name: backup.project.name,
      color: backup.project.color,
      icon: backup.project.icon,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 获取现有项目列表
    const projects = storage.get("projects") || [];
    projects.push(newProject);
    storage.set("projects", projects);

    // 恢复前缀
    if (backup.prefixes && backup.prefixes.length > 0) {
      const newPrefixes = backup.prefixes.map((p, index) => ({
        id: `prefix_${Date.now()}_${index}`,
        projectId: newProjectId,
        name: p.name,
        prefix: p.prefix,
        createdAt: new Date().toISOString(),
      }));
      storage.set(`prefixes_${newProjectId}`, newPrefixes);
    }

    // 恢复模块和记录
    for (const mod of backup.modules) {
      const newModuleId = `mod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // 创建新模块（需要建立旧 ID 到新 ID 的映射）
      const newModule = {
        id: newModuleId,
        projectId: newProjectId,
        name: mod.name,
        icon: mod.icon,
        order: mod.order || 0,
        fields: mod.fields || [],
        createdAt: new Date().toISOString(),
      };

      // 获取现有模块列表
      const modules = storage.get(`modules_${newProjectId}`) || [];
      modules.push(newModule);
      storage.set(`modules_${newProjectId}`, modules);

      // 恢复记录
      if (mod.records && mod.records.length > 0) {
        const newRecords = mod.records.map((r) => ({
          id: r.id, // 保持原 ID
          moduleId: newModuleId,
          data: r.data || {},
          parentId: r.parentId,
          richText: r.richText,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        }));
        storage.set(`records_${newModuleId}`, newRecords);
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Write backup failed:", error);
    throw error;
  }
}
