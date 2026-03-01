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
   * @param {string} moduleId - 模块ID
   * @param {Array} records - 记录列表
   */
  setRecords: (moduleId, records) => storage.set(`records_${moduleId}`, records),
};
