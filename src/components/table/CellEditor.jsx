/**
 * CellEditor.jsx
 * 单元格编辑器
 * 根据字段类型渲染不同的编辑控件
 * 支持联动过滤：当字段有 dependsOn 时，根据依赖字段的值过滤选项
 */

import React, { useMemo, useRef, useState } from "react";
import { Input, InputNumber, Checkbox, Select, DatePicker, Tag, Button } from "antd";
import RelationSearchModal from "../relation/RelationSearchModal";

/**
 * 获取字段的可用选项
 * @param {Object} field - 字段定义
 * @param {Object} recordData - 当前记录的所有字段值
 * @returns {Array} 过滤后的选项列表
 */
function getAvailableOptions(field, recordData) {
  // 如果没有依赖字段，返回所有选项
  if (!field.dependsOn || !field.optionsByParent) {
    return field.options || [];
  }

  // 获取依赖字段的值
  const parentValue = recordData?.[field.dependsOn];
  
  // 如果依赖字段没有值，返回所有选项
  if (!parentValue) {
    // 合并所有父级的选项
    const allOptions = [];
    Object.values(field.optionsByParent).forEach(options => {
      allOptions.push(...options);
    });
    // 去重
    const seen = new Set();
    return allOptions.filter(opt => {
      if (seen.has(opt.label)) return false;
      seen.add(opt.label);
      return true;
    });
  }

  // 返回对应父级的选项
  return field.optionsByParent[parentValue] || [];
}

/**
 * 单元格编辑器组件
 * @param {Object} field - 字段定义
 * @param {any} value - 当前值
 * @param {Function} onChange - 值变化回调
 * @param {Function} onBlur - 失焦回调（保存）
 * @param {Object} recordData - 当前记录的所有字段值（用于联动过滤）
 * @param {Function} onOpenSearchModal - 打开关联搜索弹窗回调（用于 relation 类型）
 */
export function CellEditor({ field, value, onChange, onBlur, recordData, onOpenSearchModal }) {
  // 获取可用选项（处理联动过滤）
  const availableOptions = useMemo(() => {
    return getAvailableOptions(field, recordData);
  }, [field, recordData]);

  // 用于追踪 Select 下拉框的打开状态
  const selectOpenRef = useRef(false);

  // 处理 Select 失焦
  const handleSelectBlur = () => {
    // 延迟检查，确保不是切换到另一个 Select
    setTimeout(() => {
      if (!selectOpenRef.current) {
        onBlur();
      }
    }, 100);
  };

  switch (field.type) {
    case "text":
      return (
        <Input
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          autoFocus
          size="small"
        />
      );

    case "textarea":
      return (
        <Input.TextArea
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          autoFocus
          autoSize={{ minRows: 2, maxRows: 6 }}
          size="small"
        />
      );

    case "number":
      return (
        <InputNumber
          value={value}
          onChange={(val) => onChange(val)}
          onBlur={onBlur}
          autoFocus
          style={{ width: "100%" }}
          size="small"
        />
      );

    case "checkbox":
      return (
        <Checkbox
          checked={!!value}
          onChange={(e) => {
            onChange(e.target.checked);
            onBlur(); // 立即保存
          }}
        />
      );

    case "select": {
      // 准备选项数据
      const selectOptions = (availableOptions.length > 0 ? availableOptions : field.options || []).map((opt) => ({
        value: opt.label,
        label: opt.label,
        color: opt.color,
      }));

      return (
        <Select
          value={value || undefined}
          onChange={(val) => {
            onChange(val);
            // 直接调用 onBlur，不使用 setTimeout
            // 让父组件使用函数式更新来获取最新值
            setTimeout(() => {
              onBlur();
            }, 0);
          }}
          style={{ width: "100%" }}
          autoFocus
          size="small"
          showSearch
          placeholder={field.dependsOn ? "请先选择" + field.dependsOn : "请选择"}
          options={selectOptions}
          optionRender={(option) => (
            <Tag color={option.data.color} size="small">
              {option.label}
            </Tag>
          )}
        />
      );
    }

    case "multiselect": {
      // 准备选项数据
      const multiOptions = (availableOptions.length > 0 ? availableOptions : field.options || []).map((opt) => ({
        value: opt.label,
        label: opt.label,
        color: opt.color,
      }));

      return (
        <Select
          mode="multiple"
          value={value || []}
          onChange={(val) => {
            onChange(val);
          }}
          onBlur={handleSelectBlur}
          style={{ width: "100%" }}
          autoFocus
          size="small"
          showSearch
          placeholder={field.dependsOn ? "请先选择" + field.dependsOn : "请选择"}
          onOpenChange={(open) => {
            selectOpenRef.current = open;
            if (!open) {
              // 下拉框关闭时保存
              setTimeout(onBlur, 100);
            }
          }}
          options={multiOptions}
          optionRender={(option) => (
            <Tag color={option.data.color} size="small">
              {option.label}
            </Tag>
          )}
        />
      );
    }

    case "date":
      return (
        <DatePicker
          value={value ? new Date(value) : null}
          onChange={(date) => {
            onChange(date ? date.toISOString() : null);
            onBlur();
          }}
          style={{ width: "100%" }}
          autoFocus
          size="small"
        />
      );

    case "relation": {
      // 关联字段：打开搜索弹窗
      return (
        <Button
          type="primary"
          size="small"
          onClick={() => {
            if (onOpenSearchModal) {
              onOpenSearchModal();
            }
          }}
        >
          选择记录
        </Button>
      );
    }

    default:
      return <span>{String(value ?? "")}</span>;
  }
}

/**
 * 单元格显示组件（非编辑状态）
 * @param {Object} field - 字段定义
 * @param {any} value - 当前值
 * @param {Object} recordData - 当前记录的所有字段值
 * @param {Function} onClick - 点击回调（用于 relation 类型打开详情）
 */
export function CellDisplay({ field, value, recordData, onClick }) {
  // 富文本特殊处理
  if (field.type === "richtext") {
    console.log("RichText Display - field:", field.name, "value:", value);
    const text = String(value || "").replace(/<[^>]*>/g, '');
    console.log("RichText plain text:", text);
    if (!text || text === "") {
      return <span style={{ color: "#bfbfbf" }}>-</span>;
    }
    return (
      <span
        title={text}
        style={{
          display: "block",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          maxWidth: 200,
        }}
      >
        {text.length > 50 ? text.slice(0, 50) + "..." : text}
      </span>
    );
  }

  if (value === null || value === undefined || value === "") {
    return <span style={{ color: "#bfbfbf" }}>-</span>;
  }

  // 获取可用选项
  const availableOptions = getAvailableOptions(field, recordData);
  const options = availableOptions.length > 0 ? availableOptions : field.options || [];

  switch (field.type) {
    case "checkbox":
      return (
        <Checkbox
          checked={!!value}
          onChange={(e) => {
            if (onClick) {
              onClick(e.target.checked);
            }
          }}
          style={{ pointerEvents: 'auto' }}
        />
      );

    case "select": {
      const selectOpt = options.find((opt) => opt.label === value);
      return selectOpt ? (
        <Tag color={selectOpt.color} size="small">
          {value}
        </Tag>
      ) : (
        <span>{value}</span>
      );
    }

    case "multiselect":
      if (!Array.isArray(value) || value.length === 0) {
        return <span style={{ color: "#bfbfbf" }}>-</span>;
      }
      return (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {value.map((val, idx) => {
            const opt = options.find((o) => o.label === val);
            return (
              <Tag key={idx} color={opt?.color} size="small">
                {val}
              </Tag>
            );
          })}
        </div>
      );

    case "date": {
      const date = new Date(value);
      return <span>{date.toLocaleDateString('zh-CN')}</span>;
    }

    case "textarea": {
      // 多行文本显示前 50 个字符
      const text = String(value);
      return (
        <span
          title={text}
          style={{
            display: "block",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: 200,
          }}
        >
          {text.length > 50 ? text.slice(0, 50) + "..." : text}
        </span>
      );
    }

    case "richtext": {
      // 富文本：去除 HTML 标签后显示前 50 个字符
      const text = String(value || "").replace(/<[^>]*>/g, '');
      return (
        <span
          title={text}
          style={{
            display: "block",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: 200,
          }}
        >
          {text.length > 50 ? text.slice(0, 50) + "..." : text}
        </span>
      );
    }

    case "relation": {
      // 关联字段：显示选中的记录（简化显示，不依赖缓存数据）
      if (!value || (Array.isArray(value) && value.length === 0)) {
        return <span style={{ color: "#bfbfbf" }}>-</span>;
      }
      
      const ids = Array.isArray(value) ? value : [value];
      
      return (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {ids.map((id, idx) => (
            <Tag key={idx} color="green">
              {id}
            </Tag>
          ))}
        </div>
      );
    }

    default:
      return <span>{String(value)}</span>;
  }
}
