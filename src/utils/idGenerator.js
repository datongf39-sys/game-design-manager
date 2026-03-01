/**
 * idGenerator.js
 * 智能编号生成器
 * 核心算法：找最小缺失正整数，实现删除后自动补位
 */

/**
 * 生成下一个可用的编号
 * @param {string} prefix - 前缀字符串，如 "C-"
 * @param {string[]} existingIds - 当前所有已存在的ID，如 ["C-001","C-003"]
 * @returns {string} - 新ID，如 "C-002"（填补空缺）
 */
export function generateId(prefix, existingIds) {
  // 提取所有数字部分
  const nums = existingIds
    .filter(id => id.startsWith(prefix))
    .map(id => parseInt(id.slice(prefix.length), 10))
    .filter(n => !isNaN(n))
    .sort((a, b) => a - b);

  // 找最小缺失正整数
  let next = 1;
  for (const n of nums) {
    if (n === next) next++; // 这个数字已存在，继续找
    else break; // 找到空缺，停止
  }

  // 补零到3位，如 1 -> "001"
  return `${prefix}${String(next).padStart(3, "0")}`;
}

/**
 * 验证ID格式是否正确
 * @param {string} id - 要验证的ID
 * @param {string} prefix - 期望的前缀
 * @returns {boolean}
 */
export function isValidId(id, prefix) {
  if (!id || !id.startsWith(prefix)) return false;
  const numPart = id.slice(prefix.length);
  return /^\d{3}$/.test(numPart);
}

/**
 * 从ID中提取数字部分
 * @param {string} id - 如 "C-001"
 * @param {string} prefix - 前缀 "C-"
 * @returns {number|null}
 */
export function extractNumber(id, prefix) {
  if (!id || !id.startsWith(prefix)) return null;
  const num = parseInt(id.slice(prefix.length), 10);
  return isNaN(num) ? null : num;
}
