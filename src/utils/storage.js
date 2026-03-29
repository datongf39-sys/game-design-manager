/**
 * storage.js
 * 统一管理所有 localStorage 的读写，避免 key 写错
 * 所有 key 都添加前缀 "gd_"，防止与其他网站数据冲突
 */

const PREFIX = "gd_";

export const storage = {
  /**
   * 从 localStorage 读取数据
   * @param {string} key - 存储键名（不含前缀）
   * @returns {any} 解析后的数据，读取失败返回 null
   */
  get: (key) => {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.error("storage.get error:", key, e);
      return null;
    }
  },

  /**
   * 向 localStorage 写入数据
   * @param {string} key - 存储键名（不含前缀）
   * @param {any} value - 要存储的数据
   */
  set: (key, value) => {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch (e) {
      console.error("storage.set error:", key, e);
    }
  },

  /**
   * 从 localStorage 删除数据
   * @param {string} key - 存储键名（不含前缀）
   */
  remove: (key) => {
    localStorage.removeItem(PREFIX + key);
  },

  /**
   * 获取指定项目的模块列表
   * @param {string} projectId - 项目ID
   * @returns {Array} 模块列表，不存在返回空数组
   */
  getModules: (projectId) => storage.get(`modules_${projectId}`) || [],

  /**
   * 保存指定项目的模块列表
   * @param {string} projectId - 项目ID
   * @param {Array} modules - 模块列表
   */
  setModules: (projectId, modules) => storage.set(`modules_${projectId}`, modules),

  /**
   * 获取指定项目的前缀库
   * @param {string} projectId - 项目ID
   * @returns {Array} 前缀列表，不存在返回空数组
   */
  getPrefixes: (projectId) => storage.get(`prefixes_${projectId}`) || [],

  /**
   * 保存指定项目的前缀库
   * @param {string} projectId - 项目ID
   * @param {Array} prefixes - 前缀列表
   */
  setPrefixes: (projectId, prefixes) => storage.set(`prefixes_${projectId}`, prefixes),

  /**
   * 获取指定模块的记录列表
   * @param {string} moduleId - 模块ID
   * @returns {Array} 记录列表，不存在返回空数组
   */
  getRecords: (moduleId) => storage.get(`records_${moduleId}`) || [],

  /**
   * 保存指定模块的记录列表
   * @param {string} moduleId - 模块 ID
   * @param {Array} records - 记录列表
   */
  setRecords: (moduleId, records) => storage.set(`records_${moduleId}`, records),

  /**
   * 获取引用了当前记录的所有反向关联
   * @param {string} recordId - 记录 ID
   * @returns {Array} 反向关联列表，包含 sourceRecordId, sourceFieldId, sourceRecordName, sourceModuleId, sourceFieldName
   */
  getBacklinks: (recordId) => {
    try {
      const allRelations = storage.get("relations") || [];
      const backlinks = allRelations.filter(rel => rel.targetRecordId === recordId);
      
      // 补充来源记录的详细信息
      return backlinks.map(link => {
        // 遍历所有模块查找来源记录
        const allProjects = storage.get("projects") || [];
        let sourceRecord = null;
        let sourceModule = null;
        let sourceFieldName = null;
        let sourceFieldName_byDisplayField = null;
        
        for (const projectId of allProjects.map(p => p.id)) {
          const modules = storage.get(`modules_${projectId}`) || [];
          for (const module of modules) {
            const records = storage.get(`records_${module.id}`) || [];
            const record = records.find(r => r.id === link.sourceRecordId);
            if (record) {
              sourceRecord = record;
              sourceModule = module;
              const field = module.fields?.find(f => f.id === link.sourceFieldId);
              sourceFieldName = field?.name || "未知字段";
              
              // 如果是 relation 字段，获取 displayFieldId 来读取正确的显示名称
              if (field?.type === "relation" && field.relationConfig?.displayFieldId) {
                sourceFieldName_byDisplayField = field.relationConfig.displayFieldId;
              }
              break;
            }
          }
          if (sourceRecord) break;
        }
        
        // 优先使用 displayFieldId 获取名称，否则使用第一个字段
        let displayName = "未命名";
        if (sourceRecord) {
          if (sourceFieldName_byDisplayField && sourceRecord.data[sourceFieldName_byDisplayField]) {
            displayName = sourceRecord.data[sourceFieldName_byDisplayField];
          } else if (sourceRecord.data.f_name) {
            displayName = sourceRecord.data.f_name;
          } else {
            const firstFieldKey = Object.keys(sourceRecord.data || {})[0];
            displayName = firstFieldKey ? sourceRecord.data[firstFieldKey] : "未命名";
          }
        }
        
        return {
          sourceRecordId: link.sourceRecordId,
          sourceFieldId: link.sourceFieldId,
          sourceFieldName,
          sourceModuleId: sourceModule?.id,
          sourceModuleName: sourceModule?.name,
          sourceRecordName: displayName,
        };
      });
    } catch (e) {
      console.error("storage.getBacklinks error:", recordId, e);
      return [];
    }
  },

  /**
   * 创建关联关系
   * @param {string} sourceRecordId - 来源记录 ID
   * @param {string} sourceFieldId - 来源字段 ID
   * @param {string} targetRecordId - 目标记录 ID
   * @returns {Object} 创建的关联对象
   */
  addRelation: (sourceRecordId, sourceFieldId, targetRecordId) => {
    try {
      const allRelations = storage.get("relations") || [];
      
      // 删除已存在的相同关联
      const filtered = allRelations.filter(
        rel => !(rel.sourceRecordId === sourceRecordId && 
                 rel.sourceFieldId === sourceFieldId && 
                 rel.targetRecordId === targetRecordId)
      );
      
      const newRelation = {
        id: `rel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sourceRecordId,
        sourceFieldId,
        targetRecordId,
        createdAt: new Date().toISOString(),
      };
      
      const updated = [...filtered, newRelation];
      storage.set("relations", updated);
      return newRelation;
    } catch (e) {
      console.error("storage.addRelation error:", e);
      return null;
    }
  },

  /**
   * 批量创建关联关系
   * @param {string} sourceRecordId - 来源记录 ID
   * @param {string} sourceFieldId - 来源字段 ID
   * @param {Array} targetRecordIds - 目标记录 ID 数组
   */
  setRelations: (sourceRecordId, sourceFieldId, targetRecordIds) => {
    try {
      const allRelations = storage.get("relations") || [];
      
      // 删除该字段下已存在的所有关联
      const filtered = allRelations.filter(
        rel => !(rel.sourceRecordId === sourceRecordId && rel.sourceFieldId === sourceFieldId)
      );
      
      // 添加新的关联
      const newRelations = targetRecordIds.map(targetId => ({
        id: `rel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sourceRecordId,
        sourceFieldId,
        targetRecordId: targetId,
        createdAt: new Date().toISOString(),
      }));
      
      storage.set("relations", [...filtered, ...newRelations]);
    } catch (e) {
      console.error("storage.setRelations error:", e);
    }
  },

  /**
   * 删除关联关系
   * @param {string} sourceRecordId - 来源记录 ID
   * @param {string} sourceFieldId - 来源字段 ID
   */
  removeRelations: (sourceRecordId, sourceFieldId) => {
    try {
      const allRelations = storage.get("relations") || [];
      const filtered = allRelations.filter(
        rel => !(rel.sourceRecordId === sourceRecordId && rel.sourceFieldId === sourceFieldId)
      );
      storage.set("relations", filtered);
    } catch (e) {
      console.error("storage.removeRelations error:", e);
    }
  },
};
