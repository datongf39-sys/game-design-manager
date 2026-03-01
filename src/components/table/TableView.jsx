/**
 * TableView.jsx
 * 表格主视图
 * 功能：
 * - 使用 Ant Design Table 组件渲染
 * - 首列固定为 ID 列（只读，自动生成）
 * - 其余列根据 module.fields 动态渲染
 * - 单元格点击进入编辑状态，失焦自动保存
 * - 顶部工具栏：添加记录 / 字段配置 / 筛选 / 分组 / 排序
 * - 支持行高切换（紧凑/标准/宽松）
 */

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Table,
  Button,
  Space,
  Dropdown,
  Modal,
  Input,
  Select,
  message,
  Tooltip,
  Popconfirm,
  Tag,
} from "antd";
import {
  PlusOutlined,
  SettingOutlined,
  FilterOutlined,
  GroupOutlined,
  SortAscendingOutlined,
  ColumnHeightOutlined,
  DeleteOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { useProjectStore } from "../../store/useProjectStore";
import { CellEditor, CellDisplay } from "./CellEditor";
import { GroupView } from "./GroupView";
import RichTextEditor from "./RichTextEditor";
import TreeView from "./TreeView";

// 行高配置
const ROW_HEIGHTS = {
  compact: { height: 32, padding: "4px 8px" },
  standard: { height: 48, padding: "8px 12px" },
  loose: { height: 64, padding: "12px 16px" },
};

const TableView = ({ onFieldConfig }) => {
  const {
    selectedModule,
    records,
    addRecord,
    updateRecord,
    deleteRecord,
  } = useProjectStore();

  // 状态
  const [viewMode, setViewMode] = useState("table"); // 'table' | 'tree'
  const [editingCell, setEditingCell] = useState(null); // { recordId, fieldId }
  const [editValue, setEditValue] = useState(null);
  const [rowHeight, setRowHeight] = useState("standard");
  const [groupByField, setGroupByField] = useState(null);
  const [filterText, setFilterText] = useState("");
  const [sortConfig, setSortConfig] = useState(null); // { fieldId, order: 'asc' | 'desc' }
  const [isRichTextModalOpen, setIsRichTextModalOpen] = useState(false);
  const [richTextValue, setRichTextValue] = useState("");

  // 获取分组字段（用于确定前缀）
  const groupFieldForPrefix = useMemo(() => {
    if (!selectedModule?.fields) return null;
    // 找到第一个有选项前缀的 select/multiselect 字段
    return selectedModule.fields.find(
      f => (f.type === "select" || f.type === "multiselect") &&
      f.options?.some(opt => opt.prefix)
    );
  }, [selectedModule]);

  // 过滤和排序记录
  const processedRecords = useMemo(() => {
    let result = [...records];

    // 筛选
    if (filterText) {
      const lowerFilter = filterText.toLowerCase();
      result = result.filter((record) => {
        // 搜索ID
        if (record.id.toLowerCase().includes(lowerFilter)) return true;
        // 搜索所有字段值
        return Object.values(record.data).some((val) =>
          String(val).toLowerCase().includes(lowerFilter)
        );
      });
    }

    // 排序
    if (sortConfig) {
      result.sort((a, b) => {
        const aVal = a.data[sortConfig.fieldId] ?? "";
        const bVal = b.data[sortConfig.fieldId] ?? "";
        const comparison = String(aVal).localeCompare(String(bVal));
        return sortConfig.order === "asc" ? comparison : -comparison;
      });
    }

    return result;
  }, [records, filterText, sortConfig]);

  // 处理单元格点击开始编辑
  const handleCellClick = (record, field) => {
    // checkbox 直接切换，不进入编辑模式
    if (field.type === "checkbox") {
      const currentValue = !!record.data[field.id];
      const newValue = !currentValue;
      updateRecord(record.id, { data: { [field.id]: newValue } });
      return;
    }
    
    // 富文本字段打开 Modal 编辑
    if (field.type === "richtext") {
      setRichTextValue(record.data[field.id] || "");
      setEditingCell({ recordId: record.id, fieldId: field.id });
      setIsRichTextModalOpen(true);
      return;
    }
    
    setEditingCell({ recordId: record.id, fieldId: field.id });
    setEditValue(record.data[field.id] ?? null);
  };

  // 处理富文本保存
  const handleRichTextSave = () => {
    if (!editingCell) return;
    
    updateRecord(editingCell.recordId, {
      data: { [editingCell.fieldId]: richTextValue },
    });
    
    setIsRichTextModalOpen(false);
    setEditingCell(null);
    setRichTextValue("");
  };

  // 处理保存
  const handleSave = () => {
    if (!editingCell) return;
    
    // 使用函数式更新，确保拿到最新的 editValue
    setEditValue((currentValue) => {
      const updateData = { [editingCell.fieldId]: currentValue };
      updateRecord(editingCell.recordId, { data: updateData });
      return null;
    });
    
    setEditingCell(null);
  };

  // 处理添加记录
  const handleAddRecord = () => {
    // 传入分组字段ID，用于确定前缀
    const newRecord = addRecord({}, groupFieldForPrefix?.id);
    if (newRecord) {
      message.success(`已创建记录 ${newRecord.id}`);
    }
  };

  // 处理删除记录
  const handleDeleteRecord = (recordId) => {
    deleteRecord(recordId);
    message.success("记录已删除");
  };

  // 构建表格列
  const columns = useMemo(() => {
    if (!selectedModule) return [];

    const cols = [];

    // ID 列（固定）
    cols.push({
      title: "ID",
      dataIndex: "id",
      key: "id",
      fixed: "left",
      width: 100,
      render: (id) => (
        <span style={{ fontFamily: "monospace", fontWeight: 500 }}>{id}</span>
      ),
    });

    // 动态字段列
    const sortedFields = [...(selectedModule.fields || [])].sort(
      (a, b) => (a.order || 0) - (b.order || 0)
    );

    sortedFields.forEach((field) => {
      cols.push({
        title: (
          <Space>
            {field.name}
            {sortConfig?.fieldId === field.id && (
              <span style={{ fontSize: 12 }}>
                {sortConfig.order === "asc" ? "↑" : "↓"}
              </span>
            )}
          </Space>
        ),
        dataIndex: ["data", field.id],
        key: field.id,
        width: field.type === "textarea" ? 250 : 150,
        sorter: true,
        onHeaderCell: () => ({
          onClick: () => {
            setSortConfig((prev) => {
              if (prev?.fieldId === field.id) {
                if (prev.order === "asc") {
                  return { fieldId: field.id, order: "desc" };
                }
                return null; // 取消排序
              }
              return { fieldId: field.id, order: "asc" };
            });
          },
        }),
        render: (_, record) => {
          const isEditing =
            editingCell?.recordId === record.id &&
            editingCell?.fieldId === field.id;

          // 显式获取字段值，避免 value 为 undefined
          const fieldValue = record.data?.[field.id];

          if (isEditing) {
            return (
              <CellEditor
                field={field}
                value={editValue}
                onChange={(val) => {
                  setEditValue(val);
                }}
                onBlur={handleSave}
                recordData={record.data}
              />
            );
          }

          return (
            <div
              onClick={() => handleCellClick(record, field)}
              style={{
                cursor: field.type === "checkbox" ? "pointer" : "pointer",
                minHeight: 24,
                padding: ROW_HEIGHTS[rowHeight].padding,
              }}
            >
              <CellDisplay 
                field={field} 
                value={fieldValue} 
                recordData={record.data}
                onClick={field.type === "checkbox" ? (val) => {
                  const newValue = !record.data[field.id];
                  updateRecord(record.id, { data: { [field.id]: newValue } });
                } : undefined}
              />
            </div>
          );
        },
      });
    });

    // 操作列
    cols.push({
      title: "操作",
      key: "action",
      fixed: "right",
      width: 80,
      render: (_, record) => (
        <Popconfirm
          title="确认删除？"
          description={`删除记录 ${record.id}`}
          onConfirm={() => handleDeleteRecord(record.id)}
          okText="删除"
          cancelText="取消"
          okButtonProps={{ danger: true }}
        >
          <Button type="text" danger icon={<DeleteOutlined />} size="small" />
        </Popconfirm>
      ),
    });

    return cols;
  }, [selectedModule, editingCell, editValue, rowHeight, sortConfig]);

  // 如果没有选中模块
  if (!selectedModule) {
    return null;
  }

  // 如果是树形视图模式，直接渲染 TreeView
  if (viewMode === "tree") {
    return <TreeView onBackToList={() => setViewMode("table")} />;
  }

  // 分组视图
  if (groupByField) {
    return (
      <GroupView
        records={processedRecords}
        fields={selectedModule.fields || []}
        groupByField={groupByField}
        onClearGroup={() => setGroupByField(null)}
        rowHeight={rowHeight}
        onCellClick={handleCellClick}
        editingCell={editingCell}
        editValue={editValue}
        setEditValue={setEditValue}
        handleSave={handleSave}
      />
    );
  }

  // 工具栏菜单
  const rowHeightMenu = {
    items: [
      { key: "compact", label: "紧凑", onClick: () => setRowHeight("compact") },
      {
        key: "standard",
        label: "标准",
        onClick: () => setRowHeight("standard"),
      },
      { key: "loose", label: "宽松", onClick: () => setRowHeight("loose") },
    ],
  };

  const groupMenu = {
    items: (selectedModule.fields || [])
      .filter((f) => f.type === "select" || f.type === "multiselect")
      .map((f) => ({
        key: f.id,
        label: f.name,
        onClick: () => setGroupByField(f.id),
      })),
  };

  return (
    <div style={{ padding: 24 }}>
      {/* 工具栏 */}
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddRecord}
          >
            添加记录
          </Button>

          {/* 视图切换 Tab */}
          <Space style={{ marginLeft: 16 }}>
            <Button
              type={viewMode === "table" ? "primary" : "default"}
              onClick={() => setViewMode("table")}
            >
              表格视图
            </Button>
            <Button
              type={viewMode === "tree" ? "primary" : "default"}
              onClick={() => setViewMode("tree")}
            >
              层级视图
            </Button>
          </Space>
        </Space>

        <Space>
          {/* 筛选输入 */}
          <Input.Search
            placeholder="筛选记录..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            onSearch={setFilterText}
            style={{ width: 200 }}
            allowClear
          />

          {/* 字段配置 */}
          <Button icon={<SettingOutlined />} onClick={onFieldConfig}>
            字段配置
          </Button>

          {/* 分组 */}
          <Dropdown menu={groupMenu} disabled={groupMenu.items.length === 0}>
            <Button icon={<GroupOutlined />}>分组</Button>
          </Dropdown>

          {/* 行高 */}
          <Dropdown menu={rowHeightMenu}>
            <Button icon={<ColumnHeightOutlined />}>行高</Button>
          </Dropdown>
        </Space>
      </div>

      {/* 表格 */}
      <Table
        columns={columns}
        dataSource={processedRecords}
        rowKey="id"
        scroll={{ x: "max-content" }}
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条记录`,
        }}
        size={rowHeight === "compact" ? "small" : "middle"}
        rowClassName={() => `row-${rowHeight}`}
      />

      <style>{`
        .row-compact td {
          padding: 4px 8px !important;
        }
        .row-standard td {
          padding: 8px 12px !important;
        }
        .row-loose td {
          padding: 12px 16px !important;
        }
      `}</style>

      {/* 富文本编辑器弹窗 */}
      <RichTextEditor
        value={richTextValue}
        onChange={setRichTextValue}
        visible={isRichTextModalOpen}
        onClose={handleRichTextSave}
      />
    </div>
  );
};

export default TableView;
