/**
 * DetailPanel.jsx
 * 详情面板组件
 */

import React, { useState, useMemo } from "react";
import {
  Card,
  Form,
  Input,
  Select,
  Tag,
  Space,
  Button,
  Breadcrumb,
  Divider,
  message as antMessage,
} from "antd";
import {
  ArrowLeftOutlined,
  DeleteOutlined,
  HomeOutlined,
} from "@ant-design/icons";
import { CellEditor, CellDisplay } from "./CellEditor";
import { getBreadcrumbPath, getAvailableParents } from "../../utils/treeHelper";
import BacklinkPanel from "../relation/BacklinkPanel";

const DetailPanel = ({
  record,
  module,
  allRecords,
  nameFieldId,
  onUpdate,
  onDelete,
  onClose,
}) => {
  const [editingFieldId, setEditingFieldId] = useState(null);
  const [editValue, setEditValue] = useState(null);

  const breadcrumbPath = useMemo(() => {
    return getBreadcrumbPath(allRecords, record.id, nameFieldId);
  }, [allRecords, record.id, nameFieldId]);

  const recordName = record.data[nameFieldId] || "未命名";

  const handleFieldClick = (fieldId, value) => {
    setEditingFieldId(fieldId);
    setEditValue(value ?? null);
  };

  const handleSave = () => {
    if (!editingFieldId) return;

    const updateData = { [editingFieldId]: editValue };
    onUpdate(record.id, { data: updateData });

    setEditingFieldId(null);
    setEditValue(null);
    antMessage.success("已保存");
  };

  const handleParentChange = (newParentId) => {
    onUpdate(record.id, { parentId: newParentId });
    antMessage.success("层级关系已更新");
  };

  const handleDelete = () => {
    const result = onDelete(record.id);
    if (result && result.success === false && result.backlinks) {
      // 有引用关系，显示警告弹窗
      const backlinkList = result.backlinks.map((link, idx) => (
        <div key={idx} style={{ marginBottom: 4 }}>
          <Tag color="blue">{link.sourceRecordId}</Tag>
          <span>{link.sourceRecordName}</span>
          <span style={{ color: "#999", fontSize: 12 }}> ({link.sourceModuleName} · {link.sourceFieldName})</span>
        </div>
      ));
      
      antMessage.error({
        content: (
          <div>
            <div style={{ fontWeight: 500, marginBottom: 8 }}>无法删除：该记录被以下记录引用</div>
            {backlinkList}
          </div>
        ),
        duration: 5,
        style: { maxWidth: 600 }
      });
      return;
    }
    
    onClose();
    antMessage.success("记录已删除");
  };

  const availableParents = useMemo(() => {
    return getAvailableParents(allRecords, record.id, nameFieldId);
  }, [allRecords, record.id, nameFieldId]);

  const fields = useMemo(() => {
    return (
      module?.fields?.filter((f) => f.id !== nameFieldId).sort(
        (a, b) => (a.order || 0) - (b.order || 0)
      ) || []
    );
  }, [module, nameFieldId]);

  return (
    <div style={{ padding: 24 }}>
      <Breadcrumb
        style={{ marginBottom: 16 }}
        items={[
          {
            title: (
              <span onClick={onClose} style={{ cursor: "pointer" }}>
                <HomeOutlined /> 返回列表
              </span>
            ),
          },
          ...breadcrumbPath.map((item, index) => ({
            title: index === breadcrumbPath.length - 1 ? (
              <strong>{item.name}</strong>
            ) : (
              <span>{item.name}</span>
            ),
          })),
        ]}
      />

      <Card
        title={
          <Space>
            <span style={{ fontFamily: "monospace", color: "#1890ff" }}>
              {record.id}
            </span>
            <span>-</span>
            <span>{recordName}</span>
          </Space>
        }
        extra={
          <Space>
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={handleDelete}
            >
              删除
            </Button>
            <Button icon={<ArrowLeftOutlined />} onClick={onClose}>
              关闭
            </Button>
          </Space>
        }
        style={{ marginBottom: 16 }}
      >
        <Form layout="vertical" style={{ marginBottom: 24 }}>
          <Form.Item label="父级记录">
            <Select
              value={record.parentId || undefined}
              onChange={handleParentChange}
              placeholder="选择父级记录（留空表示顶级）"
              allowClear
              showSearch
              optionFilterProp="children"
              style={{ width: "100%" }}
            >
              {availableParents.map((parent) => (
                <Select.Option key={parent.value} value={parent.value}>
                  {parent.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>

        <Divider style={{ margin: "16px 0" }} />

        {fields.map((field) => {
          const value = record.data[field.id];
          const isEditing = editingFieldId === field.id;

          return (
            <div
              key={field.id}
              style={{
                marginBottom: 16,
                padding: 12,
                borderRadius: 4,
                backgroundColor: isEditing ? "#f0f5ff" : "transparent",
              }}
            >
              <div
                style={{
                  fontWeight: 500,
                  marginBottom: 8,
                  color: "#262626",
                }}
              >
                {field.name}
                {field.type === "richtext" && (
                  <Tag size="small" style={{ marginLeft: 8 }}>
                    富文本
                  </Tag>
                )}
              </div>

              {isEditing ? (
                <div style={{ marginTop: 8 }}>
                  {field.type === "richtext" ? (
                    <Button
                      type="primary"
                      onClick={() => {
                        setEditingFieldId(null);
                        message.info("富文本编辑功能待实现");
                      }}
                    >
                      编辑富文本
                    </Button>
                  ) : (
                    <CellEditor
                      field={field}
                      value={editValue}
                      onChange={setEditValue}
                      onBlur={handleSave}
                      recordData={record.data}
                    />
                  )}
                  <Space style={{ marginTop: 8 }}>
                    <Button
                      type="primary"
                      size="small"
                      onClick={handleSave}
                    >
                      保存
                    </Button>
                    <Button
                      size="small"
                      onClick={() => {
                        setEditingFieldId(null);
                        setEditValue(null);
                      }}
                    >
                      取消
                    </Button>
                  </Space>
                </div>
              ) : (
                <div
                  onClick={() => handleFieldClick(field.id, value)}
                  style={{
                    cursor: "pointer",
                    padding: "4px 0",
                    minHeight: 24,
                  }}
                >
                  <CellDisplay
                    field={field}
                    value={value}
                    recordData={record.data}
                  />
                </div>
              )}
            </div>
          );
        })}

        <Divider style={{ margin: "24px 0 16px" }} />
        
        {/* 反向关联面板 */}
        <BacklinkPanel recordId={record.id} onRecordClick={(clickedId) => {
          // 关闭当前面板，打开点击记录的详情
          onClose();
          setTimeout(() => {
            if (window.openRecordDetail) {
              window.openRecordDetail(clickedId);
            }
          }, 100);
        }} />
        
        <Divider style={{ margin: "24px 0 16px" }} />
        <div style={{ fontSize: 12, color: "#8c8c8c" }}>
          <div>创建时间：{new Date(record.createdAt).toLocaleString("zh-CN")}</div>
          <div>
            更新时间：{new Date(record.updatedAt).toLocaleString("zh-CN")}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DetailPanel;
