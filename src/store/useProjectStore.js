/**
 * useProjectStore.js
 * 全局状态管理 - 使用 Zustand
 * 管理项目列表、当前选中项目、模块列表、记录、前缀等状态
 */

import { create } from "zustand";
import { storage } from "../utils/storage";
import { generateId } from "../utils/idGenerator";

export const useProjectStore = create((set, get) => ({
  // ==================== State ====================
  projects: [],           // 所有项目列表
  currentProject: null,   // 当前选中的项目对象
  modules: [],            // 当前项目的模块列表
  selectedModule: null,   // 当前选中的模块
  records: [],            // 当前模块的记录列表
  prefixes: [],           // 当前项目的前缀列表

  // ==================== Project Actions ====================

  /**
   * 初始化：从 localStorage 加载项目数据
   */
  init: () => {
    const projects = storage.get("projects") || [];
    set({ projects });
  },

  /**
   * 新建项目
   * @param {string} name - 项目名称
   * @param {string} color - 项目颜色标识
   * @param {string} icon - Ant Design 图标名称
   * @returns {Object} 新建的项目对象
   */
  addProject: (name, color, icon = "appstore") => {
    const newProject = {
      id: `proj_${Date.now()}`,
      name,
      color,
      icon,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const projects = [...get().projects, newProject];
    storage.set("projects", projects);
    set({ projects });
    return newProject;
  },

  /**
   * 更新项目名称
   * @param {string} projectId - 项目ID
   * @param {string} newName - 新名称
   */
  renameProject: (projectId, newName) => {
    const projects = get().projects.map((p) =>
      p.id === projectId ? { ...p, name: newName, updatedAt: new Date().toISOString() } : p
    );
    storage.set("projects", projects);
    set({ projects });

    // 如果当前正在查看该项目，更新 currentProject
    const { currentProject } = get();
    if (currentProject && currentProject.id === projectId) {
      set({ currentProject: { ...currentProject, name: newName } });
    }
  },

  /**
   * 删除项目（同时删除其所有模块数据）
   * @param {string} projectId - 项目ID
   */
  deleteProject: (projectId) => {
    const projects = get().projects.filter((p) => p.id !== projectId);
    storage.set("projects", projects);
    storage.remove(`modules_${projectId}`);
    storage.remove(`prefixes_${projectId}`);
    set({ projects });
  },

  /**
   * 切换到某个项目，加载其模块和前缀
   * @param {string} projectId - 项目ID
   */
  selectProject: (projectId) => {
    const currentProject = get().projects.find((p) => p.id === projectId);
    const modules = storage.getModules(projectId);
    const prefixes = storage.getPrefixes(projectId);
    // 按 order 排序
    modules.sort((a, b) => a.order - b.order);
    set({ currentProject, modules, prefixes, selectedModule: null, records: [] });
  },

  /**
   * 清空当前选中的项目
   */
  clearCurrentProject: () => {
    set({ currentProject: null, modules: [], selectedModule: null, records: [], prefixes: [] });
  },

  // ==================== Module Actions ====================

  /**
   * 新建模块
   * @param {string} name - 模块名称
   * @param {string} icon - Ant Design 图标名称
   * @param {Array} fields - 字段定义数组
   * @returns {Object|null} 新建的模块对象
   */
  addModule: (name, icon = "table", fields = []) => {
    const { currentProject, modules } = get();
    if (!currentProject) return null;

    const newModule = {
      id: `mod_${Date.now()}`,
      projectId: currentProject.id,
      name,
      icon,
      fields: fields.length > 0 ? fields : getDefaultFields(),
      order: modules.length,
      createdAt: new Date().toISOString(),
    };
    const updated = [...modules, newModule];
    storage.setModules(currentProject.id, updated);
    set({ modules: updated });
    return newModule;
  },

  /**
   * 更新模块
   * @param {string} moduleId - 模块ID
   * @param {Object} updates - 要更新的字段
   */
  updateModule: (moduleId, updates) => {
    const { currentProject, modules } = get();
    if (!currentProject) return;

    const updated = modules.map((m) =>
      m.id === moduleId ? { ...m, ...updates } : m
    );
    storage.setModules(currentProject.id, updated);
    set({ modules: updated });

    // 如果更新的是当前选中的模块，同步更新 selectedModule
    const { selectedModule } = get();
    if (selectedModule?.id === moduleId) {
      set({ selectedModule: { ...selectedModule, ...updates } });
    }
  },

  /**
   * 更新模块名称
   * @param {string} moduleId - 模块ID
   * @param {string} newName - 新名称
   */
  renameModule: (moduleId, newName) => {
    get().updateModule(moduleId, { name: newName });
  },

  /**
   * 更新模块字段
   * @param {string} moduleId - 模块ID
   * @param {Array} fields - 新的字段数组
   */
  updateModuleFields: (moduleId, fields) => {
    get().updateModule(moduleId, { fields });
  },

  /**
   * 删除模块
   * @param {string} moduleId - 模块ID
   */
  deleteModule: (moduleId) => {
    const { currentProject, modules, selectedModule } = get();
    if (!currentProject) return;

    const updated = modules.filter((m) => m.id !== moduleId);
    // 重新计算 order
    updated.forEach((m, index) => {
      m.order = index;
    });
    storage.setModules(currentProject.id, updated);
    storage.remove(`records_${moduleId}`);

    // 如果删除的是当前选中的模块，清空选中状态
    const newSelectedModule = selectedModule?.id === moduleId ? null : selectedModule;
    set({ modules: updated, selectedModule: newSelectedModule, records: [] });
  },

  /**
   * 拖拽排序模块
   * @param {Array} newModules - 排序后的模块列表
   */
  reorderModules: (newModules) => {
    const { currentProject } = get();
    if (!currentProject) return;

    // 更新 order 字段
    const updated = newModules.map((m, index) => ({
      ...m,
      order: index,
    }));
    storage.setModules(currentProject.id, updated);
    set({ modules: updated });
  },

  /**
   * 选中模块，同时加载其记录
   * @param {string} moduleId - 模块ID
   */
  selectModule: (moduleId) => {
    const module = get().modules.find((m) => m.id === moduleId);
    const records = storage.getRecords(moduleId);
    set({ selectedModule: module, records });
  },

  /**
   * 获取项目的模块数量
   * @param {string} projectId - 项目ID
   * @returns {number} 模块数量
   */
  getModuleCount: (projectId) => {
    const modules = storage.getModules(projectId);
    return modules.length;
  },

  // ==================== Record Actions ====================

  /**
   * 添加记录
   * @param {Object} data - 记录数据
   * @param {string} groupFieldId - 分组字段 ID（用于确定前缀）
   * @param {string|null} parentId - 父级记录 ID（用于层级）
   * @returns {Object|null} 新建的记录
   */
  addRecord: (data = {}, groupFieldId = null, parentId = null) => {
    const { selectedModule, records, prefixes } = get();
    if (!selectedModule) return null;

    // 获取前缀 - 根据分组字段的值来确定
    let prefix = "ID-";
    
    if (groupFieldId && data[groupFieldId]) {
      // 查找分组字段
      const groupField = selectedModule.fields?.find(f => f.id === groupFieldId);
      if (groupField && groupField.options) {
        const groupValue = data[groupFieldId];
        // 支持多选字段
        const values = Array.isArray(groupValue) ? groupValue : [groupValue];
        // 使用第一个值绑定的前缀
        if (values.length > 0) {
          const option = groupField.options.find(opt => opt.label === values[0]);
          if (option && option.prefixId) {
            const prefixObj = prefixes.find(p => p.id === option.prefixId);
            if (prefixObj) {
              prefix = prefixObj.prefix;
            }
          }
        }
      }
    }

    // 生成 ID
    const existingIds = records.map((r) => r.id);
    const newId = generateId(prefix, existingIds);

    const newRecord = {
      id: newId,
      moduleId: selectedModule.id,
      data,
      richText: "",
      parentId: parentId || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [...records, newRecord];
    storage.setRecords(selectedModule.id, updated);
    set({ records: updated });
    return newRecord;
  },

  /**
   * 更新记录
   * @param {string} recordId - 记录 ID
   * @param {Object} updates - 更新的数据（包含 data、parentId 等）
   */
  updateRecord: (recordId, updates) => {
    const { selectedModule, records } = get();
    if (!selectedModule) return;

    const updated = records.map((r) => {
      if (r.id === recordId) {
        const newRecord = {
          ...r,
          updatedAt: new Date().toISOString(),
        };

        // 如果 updates 中有 data 字段，合并到 data 中
        if (updates.data) {
          newRecord.data = { ...r.data, ...updates.data };
        }

        // 如果 updates 中有 parentId 字段，更新 parentId
        if ('parentId' in updates) {
          newRecord.parentId = updates.parentId;
        }

        // 如果 updates 中有 richText 字段，更新 richText
        if ('richText' in updates) {
          newRecord.richText = updates.richText;
        }

        return newRecord;
      }
      return r;
    });
    storage.setRecords(selectedModule.id, updated);
    set({ records: updated });
  },

  /**
   * 移动记录到新的父级下
   * @param {string} recordId - 记录 ID
   * @param {string|null} newParentId - 新的父级 ID（null 表示顶级）
   */
  moveRecord: (recordId, newParentId) => {
    const { selectedModule, records } = get();
    if (!selectedModule) return;

    const updated = records.map((r) =>
      r.id === recordId
        ? { ...r, parentId: newParentId, updatedAt: new Date().toISOString() }
        : r
    );
    storage.setRecords(selectedModule.id, updated);
    set({ records: updated });
  },

  /**
   * 删除记录
   * @param {string} recordId - 记录 ID
   * @param {boolean} forceDelete - 是否强制删除（忽略引用检查）
   * @returns {Object} 删除结果 { success: boolean, error?: string, backlinks?: Array }
   */
  deleteRecord: (recordId, forceDelete = false) => {
    const { selectedModule, records } = get();
    if (!selectedModule) return { success: false, error: "未选中模块" };

    // 检查是否有其他记录引用了这条记录（删除保护）
    if (!forceDelete) {
      const backlinks = storage.getBacklinks(recordId);
      if (backlinks && backlinks.length > 0) {
        return {
          success: false,
          error: `该记录被 ${backlinks.length} 条其他记录引用，无法删除`,
          backlinks,
        };
      }
    }

    const updated = records.filter((r) => r.id !== recordId);
    storage.setRecords(selectedModule.id, updated);
    set({ records: updated });
    return { success: true };
  },

  /**
   * 获取引用了当前记录的所有来源记录
   * @param {string} recordId - 记录 ID
   * @returns {Array} 反向关联列表
   */
  getBacklinks: (recordId) => {
    return storage.getBacklinks(recordId) || [];
  },

  // ==================== Prefix Actions ====================

  /**
   * 添加前缀
   * @param {string} name - 前缀名称
   * @param {string} prefix - 前缀字符串
   * @returns {Object|null} 新建的前缀
   */
  addPrefix: (name, prefix) => {
    const { currentProject, prefixes } = get();
    if (!currentProject) return null;

    const newPrefix = {
      id: `prefix_${Date.now()}`,
      name,
      prefix,
      createdAt: new Date().toISOString(),
    };

    const updated = [...prefixes, newPrefix];
    storage.setPrefixes(currentProject.id, updated);
    set({ prefixes: updated });
    return newPrefix;
  },

  /**
   * 更新前缀
   * @param {string} prefixId - 前缀ID
   * @param {Object} updates - 更新的字段
   */
  updatePrefix: (prefixId, updates) => {
    const { currentProject, prefixes } = get();
    if (!currentProject) return;

    const updated = prefixes.map((p) =>
      p.id === prefixId ? { ...p, ...updates } : p
    );
    storage.setPrefixes(currentProject.id, updated);
    set({ prefixes: updated });
  },

  /**
   * 删除前缀
   * @param {string} prefixId - 前缀ID
   */
  deletePrefix: (prefixId) => {
    const { currentProject, prefixes, modules } = get();
    if (!currentProject) return;

    // 检查是否有字段选项正在使用这个前缀
    let usedCount = 0;
    modules.forEach(module => {
      module.fields?.forEach(field => {
        field.options?.forEach(option => {
          if (option.prefixId === prefixId) {
            usedCount++;
          }
        });
      });
    });

    if (usedCount > 0) {
      return { error: `该前缀正在被 ${usedCount} 个分组选项使用，无法删除` };
    }

    const updated = prefixes.filter((p) => p.id !== prefixId);
    storage.setPrefixes(currentProject.id, updated);
    set({ prefixes: updated });
    return { success: true };
  },
}));

/**
 * 获取默认字段
 * @returns {Array} 默认字段数组
 */
function getDefaultFields() {
  return [
    { id: "f_name", name: "名称", type: "text", order: 0 },
    { id: "f_desc", name: "描述", type: "textarea", order: 1 },
  ];
}
