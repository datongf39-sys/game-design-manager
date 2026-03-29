/**
 * RelationSearchModal.jsx
 * 关联搜索弹窗
 * 功能：
 * - 搜索目标模块的记录
 * - 支持单选/多选
 * - 显示已选中的记录
 */

import React, { useState, useEffect } from "react";
import { Modal, Input, List, Checkbox, Tag, Spin, Empty } from "antd";
import { useProjectStore } from "../../store/useProjectStore";

const RelationSearchModal = ({
  visible,
  onClose,
  onConfirm,
  targetModuleId,
  displayFieldId,
  selectedIds = [],
  multiple = true,
}) => {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(selectedIds);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const { getModuleById, searchRecords } = useProjectStore();

  const targetModule = getModuleById(targetModuleId);

  // 搜索：query 变化时搜索
  useEffect(() => {
    if (!visible || !targetModuleId) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    const timer = setTimeout(() => {
      const results = searchRecords(targetModuleId, query);
      setSearchResults(results);
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, targetModuleId, visible, searchRecords]);

  // 重置选中状态
  useEffect(() => {
    setSelected(selectedIds);
  }, [selectedIds, visible]);

  const toggle = (id) => {
    if (multiple) {
      setSelected((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      );
    } else {
      setSelected([id]); // 单选模式：直接替换
    }
  };

  const handleConfirm = () => {
    onConfirm(selected);
    onClose();
  };

  const getRecordDisplayName = (record) => {
    const name = record.data[displayFieldId] || record.data.f_name || "未命名";
    return `${record.id} · ${name}`;
  };

  return (
    <Modal
      title="选择关联记录"
      open={visible}
      onCancel={onClose}
      onOk={handleConfirm}
      width={600}
      okText="确认"
      cancelText="取消"
    >
      <div style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder={`搜索 ${targetModule?.name || "目标模块"} 的 ID 或名称...`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          allowClear
          size="large"
        />
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <Spin size="large" />
          <div style={{ marginTop: 16, color: "#999" }}>搜索中...</div>
        </div>
      ) : searchResults.length === 0 ? (
        <Empty description={query ? "没有找到匹配的记录" : "输入关键词开始搜索"} />
      ) : (
        <List
          dataSource={searchResults}
          style={{ maxHeight: 400, overflowY: "auto" }}
          renderItem={(record) => {
            const isSelected = selected.includes(record.id);
            const displayName = getRecordDisplayName(record);

            return (
              <List.Item
                onClick={() => toggle(record.id)}
                style={{
                  cursor: "pointer",
                  padding: "12px 16px",
                  backgroundColor: isSelected ? "#e6f7ff" : "transparent",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = "#f5f5f5";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }
                }}
              >
                <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                  <Checkbox checked={isSelected} style={{ marginRight: 12 }} />
                  <Tag color="blue" style={{ marginRight: 8 }}>
                    {record.id}
                  </Tag>
                  <span style={{ flex: 1, fontWeight: 500 }}>{displayName}</span>
                </div>
              </List.Item>
            );
          }}
        />
      )}

      {selected.length > 0 && (
        <div
          style={{
            marginTop: 16,
            padding: 12,
            backgroundColor: "#f5f5f5",
            borderRadius: 4,
          }}
        >
          <div style={{ fontSize: 12, color: "#666", marginBottom: 8 }}>
            已选择 {selected.length} 个记录
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {selected.map((id) => {
              const record = searchResults.find((r) => r.id === id);
              return (
                <Tag
                  key={id}
                  color="green"
                  closable
                  onClose={(e) => {
                    e.stopPropagation();
                    toggle(id);
                  }}
                >
                  {record ? `${id} · ${getRecordDisplayName(record)}` : id}
                </Tag>
              );
            })}
          </div>
        </div>
      )}
    </Modal>
  );
};

export default RelationSearchModal;
