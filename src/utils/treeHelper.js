/**
 * treeHelper.js
 * 树形结构转换工具
 */

/**
 * 将扁平的记录数组转为树形结构
 * @param {Array} records - 扁平的记录数组，每条有 id 和 parentId
 * @param {string} nameField - 用于显示节点标题的字段 ID
 * @returns {Array} - Ant Design Tree 的 treeData 格式
 */
export function buildTree(records, nameField) {
  const map = {};
  const roots = [];

  records.forEach((r) => {
    map[r.id] = {
      key: r.id,
      title: `${r.id} ${r.data[nameField] || "未命名"}`,
      record: r,
      children: [],
      isLeaf: true,
    };
  });

  records.forEach((r) => {
    if (r.parentId && map[r.parentId]) {
      map[r.parentId].children.push(map[r.id]);
      map[r.parentId].isLeaf = false;
    } else {
      roots.push(map[r.id]);
    }
  });

  return roots;
}

/**
 * 获取记录的面包屑路径
 */
export function getBreadcrumbPath(records, currentId, nameField) {
  const map = {};
  records.forEach((r) => {
    map[r.id] = {
      id: r.id,
      name: r.data[nameField] || "未命名",
      parentId: r.parentId,
    };
  });

  const path = [];
  let current = map[currentId];

  while (current) {
    path.unshift(current);
    if (current.parentId) {
      current = map[current.parentId];
    } else {
      break;
    }
  }

  return path;
}

/**
 * 获取所有可选的父级记录
 */
export function getAvailableParents(records, currentId, nameField) {
  const getDescendantIds = (id) => {
    const descendants = [];
    records.forEach((r) => {
      if (r.parentId === id) {
        descendants.push(r.id);
        descendants.push(...getDescendantIds(r.id));
      }
    });
    return descendants;
  };

  const descendantIds = getDescendantIds(currentId);

  return records
    .filter((r) => r.id !== currentId && !descendantIds.includes(r.id))
    .map((r) => ({
      value: r.id,
      label: `${r.id} ${r.data[nameField] || "未命名"}`,
    }));
}
