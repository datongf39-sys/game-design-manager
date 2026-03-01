/**
 * GroupView.jsx
 * 分组视图
 * 功能：
 * - 按任意 select/multiselect 字段分组
 * - 每组显示组名+记录数，支持折叠/展开
 * - 未分类的记录归入"无分组"
 * - 支持层级分组：如果有依赖关系，子类显示在父类下方
 */

import React, { useState, useMemo } from "react";
import { Collapse, Badge, Table, Button, Space, Tag } from "antd";
import {
  CloseOutlined,
  CaretRightOutlined,
} from "@ant-design/icons";
import { CellEditor, CellDisplay } from "./CellEditor";

const { Panel } = Collapse;

// 行高配置
const ROW_HEIGHTS = {
  compact: { padding: "4px 8px" },
  standard: { padding: "8px 12px" },
  loose: { padding: "12px 16px" },
};

const GroupView = ({
  records,
  fields,
  groupByField,
  onClearGroup,
  rowHeight,
  onCellClick,
  editingCell,
  editValue,
  setEditValue,
  handleSave,
}) => {
  // 获取分组字段
  const groupField = useMemo(() => {
    return fields.find((f) => f.id === groupByField);
  }, [fields, groupByField]);

  // 获取父级字段（如果分组字段有依赖）
  const parentField = useMemo(() => {
    if (!groupField?.dependsOn) return null;
    return fields.find(f => f.id === groupField.dependsOn);
  }, [groupField, fields]);

  // 按字段值分组
  const groupedRecords = useMemo(() => {
    if (!groupField) return {};

    const groups = {};

    // 初始化所有选项的分组（包括空值）
    if (groupField.options) {
      groupField.options.forEach((opt) => {
        groups[opt.label] = [];
      });
    }

    // 如果有 optionsByParent（级联配置）
    if (groupField.optionsByParent) {
      Object.keys(groupField.optionsByParent).forEach(parentLabel => {
        groupField.optionsByParent[parentLabel].forEach(opt => {
          groups[opt.label] = [];
        });
      });
    }

    // 分组
    records.forEach((record) => {
      const value = record.data[groupByField];

      if (groupField.type === "multiselect") {
        // 多选字段：记录可能属于多个组
        if (Array.isArray(value) && value.length > 0) {
          value.forEach((val) => {
            if (!groups[val]) groups[val] = [];
            groups[val].push(record);
          });
        } else {
          // 未分类
          if (!groups["__uncategorized"]) groups["__uncategorized"] = [];
          groups["__uncategorized"].push(record);
        }
      } else {
        // 单选字段
        if (value && groups[value]) {
          groups[value].push(record);
        } else if (value) {
          groups[value] = [record];
        } else {
          // 未分类
          if (!groups["__uncategorized"]) groups["__uncategorized"] = [];
          groups["__uncategorized"].push(record);
        }
      }
    });

    return groups;
  }, [records, groupField, groupByField]);

  // 构建层级分组结构
  const hierarchicalGroups = useMemo(() => {
    if (!groupField) return [];

    // 如果有父级字段，构建层级结构
    if (parentField && groupField.optionsByParent) {
      const hierarchy = [];
      
      // 遍历每个父级选项
      parentField.options?.forEach(parentOpt => {
        const parentLabel = parentOpt.label;
        const childOptions = groupField.optionsByParent[parentLabel] || [];
        
        const children = [];
        childOptions.forEach(childOpt => {
          const childRecords = groupedRecords[childOpt.label] || [];
          if (childRecords.length > 0) {
            children.push({
              label: childOpt.label,
              color: childOpt.color,
              records: childRecords,
              isChild: true,
            });
          }
        });

        // 只添加有子分组的父级
        if (children.length > 0) {
          hierarchy.push({
            label: parentLabel,
            color: parentOpt.color,
            isParent: true,
            children: children,
            totalCount: children.reduce((sum, child) => sum + child.records.length, 0),
          });
        }
      });

      // 添加未分类
      const uncategorized = groupedRecords["__uncategorized"] || [];
      if (uncategorized.length > 0) {
        hierarchy.push({
          label: "__uncategorized",
          displayLabel: "无分组",
          isParent: true,
          children: [{
            label: "__uncategorized",
            displayLabel: "未分类",
            records: uncategorized,
            isChild: true,
          }],
          totalCount: uncategorized.length,
        });
      }

      return hierarchy;
    }

    // 普通分组（无层级）
    const flatGroups = [];
    
    // 先显示有选项的分组
    if (groupField.options) {
      groupField.options.forEach((option) => {
        const groupRecords = groupedRecords[option.label] || [];
        if (groupRecords.length > 0) {
          flatGroups.push({
            label: option.label,
            color: option.color,
            records: groupRecords,
            isParent: true,
            totalCount: groupRecords.length,
          });
        }
      });
    }

    // 未分类分组
    const uncategorized = groupedRecords["__uncategorized"] || [];
    if (uncategorized.length > 0) {
      flatGroups.push({
        label: "__uncategorized",
        displayLabel: "无分组",
        isParent: true,
        records: uncategorized,
        totalCount: uncategorized.length,
      });
    }

    return flatGroups;
  }, [groupField, parentField, groupedRecords]);

  // 获取选项颜色
  const getOptionColor = (label) => {
    const option = groupField?.options?.find((opt) => opt.label === label);
    return option?.color;
  };

  // 构建表格列（不含分组字段）
  const columns = useMemo(() => {
    const cols = [];

    // ID 列
    cols.push({
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 100,
      render: (id) => (
        <span style={{ fontFamily: "monospace", fontWeight: 500 }}>{id}</span>
      ),
    });

    // 其他字段列（排除分组字段及其父字段）
    const excludedFields = [groupByField];
    if (parentField) {
      excludedFields.push(parentField.id);
    }
    
    const sortedFields = [...fields]
      .filter((f) => !excludedFields.includes(f.id))
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    sortedFields.forEach((field) => {
      cols.push({
        title: field.name,
        dataIndex: ["data", field.id],
        key: field.id,
        width: field.type === "textarea" ? 250 : 150,
        render: (value, record) => {
          const isEditing =
            editingCell?.recordId === record.id &&
            editingCell?.fieldId === field.id;

          if (isEditing) {
            return (
              <CellEditor
                field={field}
                value={editValue}
                onChange={setEditValue}
                onBlur={handleSave}
                recordData={record.data}
              />
            );
          }

          return (
            <div
              onClick={() => onCellClick(record, field)}
              style={{
                cursor: "pointer",
                minHeight: 24,
                padding: ROW_HEIGHTS[rowHeight].padding,
              }}
            >
              <CellDisplay field={field} value={value} recordData={record.data} />
            </div>
          );
        },
      });
    });

    return cols;
  }, [fields, groupByField, parentField, editingCell, editValue, rowHeight]);

  // 准备 Collapse 的 items
  const collapseItems = useMemo(() => {
    return hierarchicalGroups.map((group, index) => {
      const key = group.label;
      
      // 如果是层级分组
      if (group.children) {
        return {
          key: key,
          label: (
            <Space>
              <Tag color={group.color} style={{ fontSize: 14, padding: "4px 12px" }}>
                {group.displayLabel || group.label}
              </Tag>
              <Badge 
                count={group.totalCount} 
                showZero 
                style={{ backgroundColor: "#52c41a" }}
              />
              <span style={{ color: "#999", fontSize: 12 }}>
                ({group.children.length}个子分组)
              </span>
            </Space>
          ),
          children: (
            <div style={{ paddingLeft: 24 }}>
              {group.children.map((child, childIndex) => (
                <div key={child.label} style={{ marginBottom: 16 }}>
                  <div style={{ marginBottom: 8 }}>
                    <Tag color={child.color} size="small">
                      {child.displayLabel || child.label}
                    </Tag>
                    <Badge 
                      count={child.records.length} 
                      showZero 
                      style={{ marginLeft: 8, backgroundColor: "#1890ff" }}
                    />
                  </div>
                  <Table
                    columns={columns}
                    dataSource={child.records}
                    rowKey="id"
                    pagination={false}
                    size={rowHeight === "compact" ? "small" : "middle"}
                    showHeader={childIndex === 0}
                  />
                </div>
              ))}
            </div>
          ),
        };
      }

      // 普通分组
      return {
        key: key,
        label: (
          <Space>
            <Tag color={group.color} style={{ fontSize: 14, padding: "4px 12px" }}>
              {group.displayLabel || group.label}
            </Tag>
            <Badge 
              count={group.records.length} 
              showZero 
              style={{ backgroundColor: "#52c41a" }}
            />
          </Space>
        ),
        children: (
          <Table
            columns={columns}
            dataSource={group.records}
            rowKey="id"
            pagination={false}
            size={rowHeight === "compact" ? "small" : "middle"}
            showHeader={false}
          />
        ),
      };
    });
  }, [hierarchicalGroups, columns, rowHeight]);

  return (
    <div style={{ padding: 24 }}>
      {/* 头部 */}
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Space>
          <span style={{ fontSize: 16, fontWeight: 500 }}>
            分组视图：按 <Tag color="blue">{groupField?.name}</Tag> 分组
            {parentField && (
              <span style={{ color: "#666", fontSize: 14 }}>
                （依赖：{parentField.name}）
              </span>
            )}
          </span>
          <Badge
            count={records.length}
            showZero
            style={{ backgroundColor: "#52c41a" }}
          />
        </Space>
        <Button icon={<CloseOutlined />} onClick={onClearGroup}>
          取消分组
        </Button>
      </div>

      {/* 分组折叠面板 - 默认全部收起 */}
      <Collapse
        defaultActiveKey={[]}  // 默认全部收起
        expandIcon={({ isActive }) => (
          <CaretRightOutlined rotate={isActive ? 90 : 0} />
        )}
        items={collapseItems}
      />
    </div>
  );
};

export { GroupView };
