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
  InboxOutlined,
} from "@ant-design/icons";
import { useProjectStore } from "../../store/useProjectStore";
import { CellEditor, CellDisplay } from "./CellEditor";
import { GroupView } from "./GroupView";
import RichTextEditor from "./RichTextEditor";
import TreeView from "./TreeView";
import RelationSearchModal from "../relation/RelationSearchModal";
import { storage } from "../../utils/storage";

// 行高配置
const ROW_HEIGHTS = {
  compact: { height: 32, padding: "4px 8px" },
  standard: { height: 48, padding: "8px 12px" },
  loose: { height: 64, padding: "12px 16px" },
};

const TableView = ({ onFieldConfig, onOpenFormBuilder }) => {
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
  
  // Relation 弹窗状态
  const [isRelationModalOpen, setIsRelationModalOpen] = useState(false);
  const [relationConfig, setRelationConfig] = useState(null); // { recordId, fieldId, targetModuleId, displayFieldId, multiple, selectedIds }

  // 键盘导航状态
  const [selectedCell, setSelectedCell] = useState(null); // { recordIndex, fieldIndex }
  const tableRef = useRef(null);

  // 获取分组字段（用于确定前缀）
  const groupFieldForPrefix = useMemo(() => {
    if (!selectedModule?.fields) return null;
    // 找到第一个有选项前缀的 select/multiselect 字段
    return selectedModule.fields.find(
      f => (f.type === "select" || f.type === "multiselect") &&
      f.options?.some(opt => opt.prefix)
    );
  }, [selectedModule]);

  // 键盘快捷键处理
  useEffect(() => {
    const handleKeyDown = (e) => {
      // 如果在编辑状态，不处理快捷键
      if (editingCell) return;

      const { key, ctrlKey, metaKey, shiftKey } = e;

      // 方向键导航
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(key)) {
        e.preventDefault();
        navigateCells(key, shiftKey);
      }

      // Enter 进入编辑
      if (key === "Enter" && selectedCell) {
        e.preventDefault();
        enterEditMode();
      }

      // Tab 切换单元格
      if (key === "Tab" && selectedCell) {
        e.preventDefault();
        navigateCells(shiftKey ? "ArrowLeft" : "ArrowRight");
      }

      // Escape 退出编辑
      if (key === "Escape") {
        e.preventDefault();
        setEditingCell(null);
        setEditValue(null);
      }

      // Delete/Backspace 清空单元格
      if ((key === "Delete" || key === "Backspace") && selectedCell && !editingCell) {
        e.preventDefault();
        clearCell();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedCell, editingCell, records, selectedModule]);

  // 单元格导航
  const navigateCells = (direction) => {
    if (!selectedCell) {
      // 如果没有选中，选中第一个单元格
      setSelectedCell({ recordIndex: 0, fieldIndex: 1 }); // 1 表示跳过 ID 列
      return;
    }

    const fieldCount = (selectedModule?.fields?.length || 0) + 2; // +2 是 ID 列和操作列
    const recordCount = records.length;

    let { recordIndex, fieldIndex } = selectedCell;

    switch (direction) {
      case "ArrowUp":
        recordIndex = Math.max(0, recordIndex - 1);
        break;
      case "ArrowDown":
        recordIndex = Math.min(recordCount - 1, recordIndex + 1);
        break;
      case "ArrowLeft":
        fieldIndex = Math.max(0, fieldIndex - 1);
        break;
      case "ArrowRight":
        fieldIndex = Math.min(fieldCount - 1, fieldIndex + 1);
        break;
      default:
        break;
    }

    setSelectedCell({ recordIndex, fieldIndex });
  };

  // 进入编辑模式
  const enterEditMode = () => {
    if (!selectedCell) return;

    const record = records[selectedCell.recordIndex];
    const fields = selectedModule?.fields || [];
    const field = fields[selectedCell.fieldIndex - 1]; // -1 是因为有 ID 列

    if (field && record) {
      handleCellClick(record, field);
    }
  };

  // 清空单元格
  const clearCell = () => {
    if (!selectedCell) return;

    const record = records[selectedCell.recordIndex];
    const fields = selectedModule?.fields || [];
    const field = fields[selectedCell.fieldIndex - 1];

    if (field && record && field.type !== "checkbox") {
      updateRecord(record.id, { data: { [field.id]: null } });
      message.success("已清空");
    }
  };

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
    // 传入分组字段 ID，用于确定前缀
    const newRecord = addRecord({}, groupFieldForPrefix?.id);
    if (newRecord) {
      message.success(`已创建记录 ${newRecord.id}`);
    }
  };

  // 处理 relation 字段编辑
  const handleRelationEdit = (record, field) => {
    const currentValue = record.data[field.id] || [];
    const ids = Array.isArray(currentValue) ? currentValue : [currentValue].filter(Boolean);
    
    setRelationConfig({
      recordId: record.id,
      fieldId: field.id,
      targetModuleId: field.relationConfig?.targetModuleId,
      displayFieldId: field.relationConfig?.displayFieldId,
      multiple: field.relationConfig?.multiple || false,
      selectedIds: ids,
    });
    
    setIsRelationModalOpen(true);
  };

  // 处理 relation 确认
  const handleRelationConfirm = (selectedIds) => {
    if (!relationConfig) return;
    
    const { recordId, fieldId, multiple } = relationConfig;
    
    // 更新记录
    const finalValue = multiple ? selectedIds : (selectedIds[0] || null);
    updateRecord(recordId, { data: { [fieldId]: finalValue } });
    
    // 保存到 relations 表
    if (Array.isArray(selectedIds) && selectedIds.length > 0) {
      storage.setRelations(recordId, fieldId, selectedIds);
    } else {
      storage.removeRelations(recordId, fieldId);
    }
    
    setIsRelationModalOpen(false);
    setRelationConfig(null);
    message.success("关联关系已保存");
  };

  // 处理删除记录
  const handleDeleteRecord = (recordId) => {
    const result = deleteRecord(recordId);
    if (result && result.success === false && result.backlinks) {
      // 有引用关系，显示警告
      const backlinkCount = result.backlinks.length;
      message.error({
        content: (
          <div>
            <div style={{ fontWeight: 500 }}>
              无法删除：该记录被 {backlinkCount} 条其他记录引用
            </div>
            <div style={{ marginTop: 8, fontSize: 12, color: "#666" }}>
              请先删除或修改引用该记录的关联关系
            </div>
          </div>
        ),
        duration: 5,
        style: { maxWidth: 500 }
      });
    } else if (result && result.success) {
      message.success("记录已删除");
    }
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
        render: (_, record, recordIndex) => {
          const isEditing =
            editingCell?.recordId === record.id &&
            editingCell?.fieldId === field.id;

          // 显式获取字段值，避免 value 为 undefined
          const fieldValue = record.data?.[field.id];

          // 计算是否是选中的单元格
          const isSelected = selectedCell?.recordIndex === recordIndex && selectedCell?.fieldIndex === index + 1; // +1 是因为有 ID 列

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
                onOpenSearchModal={field.type === "relation" ? () => handleRelationEdit(record, field) : undefined}
              />
            );
          }

          return (
            <div
              onClick={() => {
                setSelectedCell({ recordIndex, fieldIndex: index + 1 });
                handleCellClick(record, field);
              }}
              style={{
                cursor: field.type === "checkbox" ? "pointer" : "pointer",
                minHeight: 24,
                padding: ROW_HEIGHTS[rowHeight].padding,
                border: isSelected ? "2px solid #1890ff" : "1px solid transparent",
                borderRadius: 4,
                backgroundColor: isSelected ? "#e6f4ff" : "transparent",
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

          {/* 表单管理按钮 */}
          <Button
            icon={<InboxOutlined />}
            onClick={onOpenFormBuilder}
          >
            表单管理
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

      {/* 关联搜索弹窗 */}
      {relationConfig && (
        <RelationSearchModal
          visible={isRelationModalOpen}
          onClose={() => {
            setIsRelationModalOpen(false);
            setRelationConfig(null);
          }}
          onConfirm={handleRelationConfirm}
          targetModuleId={relationConfig.targetModuleId}
          displayFieldId={relationConfig.displayFieldId}
          selectedIds={relationConfig.selectedIds}
          multiple={relationConfig.multiple}
        />
      )}
    </div>
  );
};

export default TableView;
