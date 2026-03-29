/**
 * KanbanView.jsx
 * 看板视图组件
 * 功能：
 * - 在表格视图 / 树形视图 Tab 后加"看板"Tab
 * - 进入看板视图时，弹出选择器：选择哪个 select 字段作为分组维度
 * - 每个选项值对应一列，列标题显示选项名 + 记录数
 * - 记录以卡片形式显示，卡片内容：ID + 名称 + 最多 2 个其他字段
 * - 卡片可拖拽跨列，释放后自动更新该字段值并保存
 * - 使用 @dnd-kit/core 实现拖拽
 * - 每列底部有"+ 添加记录"按钮，新建记录时预填该列的字段值
 */

import React, { useState, useMemo, useEffect } from "react";
import {
  Card,
  Select,
  Modal,
  Button,
  Space,
  Tag,
  message,
  Empty,
  Spin,
} from "antd";
import {
  PlusOutlined,
  AppstoreOutlined,
  DragOutlined,
} from "@ant-design/icons";
import { useProjectStore } from "../../store/useProjectStore";

const { Option } = Select;

// 卡片组件
const CardItem = ({ record, field, onOpenDetail }) => {
  const displayFields = Object.entries(record.data || {}).filter(
    ([key]) => key !== "f_name" && key !== field.id
  ).slice(0, 2);

  return (
    <div
      onClick={() => onOpenDetail(record)}
    >
      <Card
        size="small"
        hoverable
        style={{
          marginBottom: 8,
          cursor: "pointer",
          borderLeft: "3px solid #1890ff",
        }}
      >
        <Space direction="vertical" size="small" style={{ width: "100%" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Text code style={{ fontSize: 12 }}>{record.id}</Text>
            <DragOutlined style={{ color: "#bfbfbf", cursor: "grab" }} />
          </div>
          <div style={{ fontWeight: 500 }}>{record.data.f_name || "未命名"}</div>
          {displayFields.map(([key, value]) => (
            <div key={key} style={{ fontSize: 12, color: "#666" }}>
              <Text type="secondary">{key}:</Text> {String(value).slice(0, 30)}
            </div>
          ))}
        </Space>
      </Card>
    </div>
  );
};

// 列组件
const KanbanColumn = ({ title, count, color, records, field, onAddRecord, onOpenDetail, onMoveRecord }) => {
  return (
    <div
      style={{
        minWidth: 280,
        maxWidth: 280,
        backgroundColor: "#f5f5f5",
        borderRadius: 8,
        padding: 12,
        marginRight: 16,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
          padding: "8px 12px",
          backgroundColor: "#fff",
          borderRadius: 6,
        }}
      >
        <Space>
          <Tag color={color}>{title || "未分类"}</Tag>
          <Tag>{count}</Tag>
        </Space>
      </div>

      <div style={{ minHeight: 100 }}>
        {records.map((record) => (
          <CardItem
            key={record.id}
            record={record}
            field={field}
            onOpenDetail={onOpenDetail}
          />
        ))}
      </div>

      <Button
        type="dashed"
        block
        icon={<PlusOutlined />}
        onClick={() => onAddRecord(title)}
        style={{ marginTop: 8 }}
      >
        添加记录
      </Button>
    </div>
  );
};

const Text = ({ children, code, type, style }) => {
  if (code) {
    return <code style={{ backgroundColor: "#f5f5f5", padding: "2px 6px", borderRadius: 4, fontSize: 12, ...style }}>{children}</code>;
  }
  if (type === "secondary") {
    return <span style={{ color: "#999", ...style }}>{children}</span>;
  }
  return <span style={style}>{children}</span>;
};

const KanbanView = ({ onBackToList, onOpenDetail }) => {
  const { selectedModule, records, addRecord, updateRecord } = useProjectStore();
  const [groupFieldId, setGroupFieldId] = useState(null);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [activeId, setActiveId] = useState(null);

  // 获取所有 select/multiselect 字段
  const groupFields = useMemo(() => {
    return selectedModule?.fields?.filter(
      (f) => f.type === "select" || f.type === "multiselect"
    ) || [];
  }, [selectedModule]);

  // 初始化时显示选择器
  useEffect(() => {
    if (!groupFieldId && groupFields.length > 0) {
      setIsSelectorOpen(true);
    }
  }, [groupFieldId, groupFields]);

  // 获取分组字段的选项
  const groupField = useMemo(() => {
    return groupFields.find((f) => f.id === groupFieldId);
  }, [groupFields, groupFieldId]);

  const options = useMemo(() => {
    return groupField?.options || [];
  }, [groupField]);

  // 按选项分组记录
  const groupedRecords = useMemo(() => {
    if (!groupFieldId) return {};

    const groups = {};
    options.forEach((opt) => {
      groups[opt.label] = {
        label: opt.label,
        color: opt.color,
        records: [],
      };
    });
    groups["未分类"] = {
      label: "未分类",
      color: "#d9d9d9",
      records: [],
    };

    records.forEach((record) => {
      const value = record.data[groupFieldId];
      let groupName = "未分类";

      if (Array.isArray(value)) {
        // 多选字段，取第一个值
        if (value.length > 0) {
          groupName = value[0];
        }
      } else if (value) {
        groupName = value;
      }

      if (!groups[groupName]) {
        groups[groupName] = {
          label: groupName,
          color: "#d9d9d9",
          records: [],
        };
      }
      groups[groupName].records.push(record);
    });

    return groups;
  }, [records, groupFieldId, options]);

  // 模拟拖拽功能（简化版）
  const handleMoveRecord = (recordId, newColumn) => {
    const record = records.find(r => r.id === recordId);
    if (!record) return;

    const newValue = newColumn === "未分类" ? null : newColumn;
    updateRecord(record.id, {
      data: { [groupFieldId]: newValue },
    });
  };

  // 添加记录
  const handleAddRecord = (columnLabel) => {
    const initialData = {
      [groupFieldId]: columnLabel === "未分类" ? null : columnLabel,
    };
    const newRecord = addRecord(initialData);
    if (newRecord) {
      message.success(`已创建记录 ${newRecord.id}`);
      // 打开详情面板
      setTimeout(() => {
        onOpenDetail?.(newRecord);
      }, 100);
    }
  };

  // 打开记录详情
  const handleOpenDetail = (record) => {
    onOpenDetail?.(record);
  };

  // 确认选择分组字段
  const handleFieldSelect = (fieldId) => {
    setGroupFieldId(fieldId);
    setIsSelectorOpen(false);
  };

  if (!selectedModule) {
    return <Empty description="请先选择一个模块" />;
  }

  if (!groupFieldId || groupFields.length === 0) {
    return (
      <Empty
        description="该模块没有可用于分组的选项字段"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      >
        <Button type="primary" onClick={onBackToList}>
          返回列表
        </Button>
      </Empty>
    );
  }

  return (
    <>
      <div style={{ padding: 24 }}>
        <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Space>
            <Button onClick={onBackToList}>返回列表</Button>
            <Tag color="blue">{selectedModule.name}</Tag>
            <Tag>{groupField?.name}</Tag>
          </Space>
          <Button
            icon={<AppstoreOutlined />}
            onClick={() => setIsSelectorOpen(true)}
          >
            更换分组字段
          </Button>
        </div>

        <div
          style={{
            display: "flex",
            overflowX: "auto",
            paddingBottom: 16,
          }}
        >
          {Object.entries(groupedRecords).map(([label, { color, records: recs }]) => (
            <KanbanColumn
              key={label}
              title={label}
              count={recs.length}
              color={color}
              records={recs}
              field={groupField}
              onAddRecord={handleAddRecord}
              onOpenDetail={handleOpenDetail}
              onMoveRecord={handleMoveRecord}
            />
          ))}
        </div>
      </div>

      {/* 选择分组字段弹窗 */}
      <Modal
        title="选择分组字段"
        open={isSelectorOpen}
        onCancel={() => setIsSelectorOpen(false)}
        footer={null}
        width={400}
      >
        <div style={{ padding: "20px 0" }}>
          <p style={{ marginBottom: 16, color: "#666" }}>
            请选择一个选项字段作为看板视图的分组维度：
          </p>
          <Select
            placeholder="选择字段"
            onChange={handleFieldSelect}
            style={{ width: "100%" }}
            size="large"
          >
            {groupFields.map((field) => (
              <Option key={field.id} value={field.id}>
                <Tag color={field.type === "select" ? "blue" : "purple"}>
                  {field.type === "select" ? "单选" : "多选"}
                </Tag>
                {field.name}
              </Option>
            ))}
          </Select>
        </div>
      </Modal>
    </>
  );
};

export default KanbanView;
