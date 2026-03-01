/**
 * FieldConfig.jsx
 * 字段配置组件
 * 功能：
 * - 配置模块的字段
 * - 支持添加、删除、排序字段
 * - 设置字段类型和选项（选项可绑定前缀库中的前缀）
 * - 支持设置依赖字段，实现联动过滤
 */

import React, { useState, useEffect, useMemo } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  Button,
  Space,
  Table,
  Popconfirm,
  message,
  Card,
  Tag,
  Row,
  Col,
  Tabs,
  Divider,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  DragOutlined,
  SettingOutlined,
  TagOutlined,
  LinkOutlined,
} from "@ant-design/icons";
import { useProjectStore } from "../../store/useProjectStore";

const { Option } = Select;

// 字段类型选项
const FIELD_TYPES = [
  { value: "text", label: "单行文本", color: "blue" },
  { value: "textarea", label: "多行文本", color: "cyan" },
  { value: "richtext", label: "富文本", color: "geekblue" },
  { value: "number", label: "数字", color: "green" },
  { value: "checkbox", label: "勾选框", color: "orange" },
  { value: "select", label: "单选", color: "purple" },
  { value: "multiselect", label: "多选", color: "magenta" },
  { value: "date", label: "日期", color: "red" },
];

const FieldConfig = ({ visible, onClose }) => {
  const { selectedModule, updateModuleFields, prefixes } = useProjectStore();

  const [fields, setFields] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [activeTab, setActiveTab] = useState("basic");
  const [form] = Form.useForm();

  // 初始化字段
  useEffect(() => {
    if (selectedModule?.fields) {
      setFields([...selectedModule.fields].sort((a, b) => (a.order || 0) - (b.order || 0)));
    }
  }, [selectedModule, visible]);

  // 获取可作为依赖的字段列表（select/multiselect 类型）
  const availableParentFields = useMemo(() => {
    return fields.filter(f => 
      f.id !== editingField?.id && 
      (f.type === "select" || f.type === "multiselect")
    );
  }, [fields, editingField]);

  // 添加字段
  const handleAddField = () => {
    const newField = {
      id: `f_${Date.now()}`,
      name: "新字段",
      type: "text",
      order: fields.length,
    };
    setFields([...fields, newField]);
    message.success("字段已添加");
  };

  // 删除字段
  const handleDeleteField = (fieldId) => {
    const updated = fields.filter((f) => f.id !== fieldId);
    // 重新计算 order
    updated.forEach((f, index) => {
      f.order = index;
    });
    // 清除其他字段对删除字段的依赖
    updated.forEach(f => {
      if (f.dependsOn === fieldId) {
        delete f.dependsOn;
        delete f.optionsByParent;
      }
    });
    setFields(updated);
    message.success("字段已删除");
  };

  // 编辑字段
  const handleEditField = (field) => {
    setEditingField(field);
    setActiveTab("basic");
    form.setFieldsValue({
      name: field.name,
      type: field.type,
      dependsOn: field.dependsOn || undefined,
      options: field.options || [],
      optionsByParent: field.optionsByParent || {},
    });
    setIsEditing(true);
  };

  // 保存字段编辑
  const handleSaveField = (values) => {
    const updated = fields.map((f) => {
      if (f.id === editingField.id) {
        const updatedField = {
          ...f,
          name: values.name,
          type: values.type,
        };

        // 保存依赖设置
        if (values.dependsOn) {
          updatedField.dependsOn = values.dependsOn;
          updatedField.optionsByParent = values.optionsByParent || {};
          // 有依赖时不使用普通 options
          delete updatedField.options;
        } else {
          delete updatedField.dependsOn;
          delete updatedField.optionsByParent;
          // 保存普通选项（如果是 select 或 multiselect）
          if (values.type === "select" || values.type === "multiselect") {
            updatedField.options = values.options || [];
          } else {
            delete updatedField.options;
          }
        }

        return updatedField;
      }
      return f;
    });

    setFields(updated);
    setIsEditing(false);
    setEditingField(null);
    form.resetFields();
    message.success("字段已更新");
  };

  // 保存所有字段
  const handleSaveAll = () => {
    if (selectedModule) {
      updateModuleFields(selectedModule.id, fields);
      message.success("字段配置已保存");
      onClose();
    }
  };

  // 获取父字段的选项
  const getParentFieldOptions = (parentFieldId) => {
    const parentField = fields.find(f => f.id === parentFieldId);
    if (!parentField) return [];
    return parentField.options || [];
  };

  // 表格列
  const columns = [
    {
      title: "排序",
      key: "order",
      width: 60,
      render: (_, record, index) => (
        <DragOutlined style={{ cursor: "grab", color: "#999" }} />
      ),
    },
    {
      title: "字段名称",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "字段类型",
      dataIndex: "type",
      key: "type",
      render: (type) => {
        const typeInfo = FIELD_TYPES.find((t) => t.value === type);
        return typeInfo ? (
          <Tag color={typeInfo.color}>{typeInfo.label}</Tag>
        ) : (
          type
        );
      },
    },
    {
      title: "联动/前缀",
      key: "relation",
      render: (_, record) => {
        const items = [];
        
        // 显示依赖关系
        if (record.dependsOn) {
          const parentField = fields.find(f => f.id === record.dependsOn);
          items.push(
            <Tag key="depends" color="blue" icon={<LinkOutlined />}>
              依赖: {parentField?.name || record.dependsOn}
            </Tag>
          );
        }
        
        // 显示前缀绑定
        if (record.options) {
          const prefixCount = record.options.filter(opt => opt.prefixId).length;
          if (prefixCount > 0) {
            items.push(
              <Tag key="prefix" color="orange" icon={<TagOutlined />}>
                {prefixCount}个前缀
              </Tag>
            );
          }
        }
        
        return items.length > 0 ? <Space size="small">{items}</Space> : "-";
      },
    },
    {
      title: "操作",
      key: "action",
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEditField(record)}
          />
          <Popconfirm
            title="确认删除？"
            onConfirm={() => handleDeleteField(record.id)}
            okText="删除"
            cancelText="取消"
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Modal
      title={
        <Space>
          <SettingOutlined />
          字段配置 - {selectedModule?.name}
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={900}
      footer={[
        <Button key="cancel" onClick={onClose}>
          取消
        </Button>,
        <Button key="save" type="primary" onClick={handleSaveAll}>
          保存配置
        </Button>,
      ]}
    >
      <Card size="small" style={{ marginBottom: 16 }}>
        <div style={{ color: "#666", fontSize: 14 }}>
          配置表格显示的字段。ID 列由系统自动生成，无需配置。
          <br />
          <strong>单选/多选字段可以：</strong>
          <br />
          1. 绑定前缀库中的前缀，绑定后选择该选项的记录将使用该前缀生成编号
          <br />
          2. 设置依赖字段实现联动过滤，如"小类"依赖"大类"
        </div>
      </Card>

      <div style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddField}>
          添加字段
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={fields}
        rowKey="id"
        pagination={false}
        size="small"
      />

      {/* 编辑字段弹窗 */}
      <Modal
        title="编辑字段"
        open={isEditing}
        onOk={() => form.submit()}
        onCancel={() => {
          setIsEditing(false);
          setEditingField(null);
          form.resetFields();
        }}
        okText="保存"
        cancelText="取消"
        width={850}
      >
        <Form form={form} layout="vertical" onFinish={handleSaveField}>
          <Form.Item
            name="name"
            label="字段名称"
            rules={[{ required: true, message: "请输入字段名称" }]}
          >
            <Input placeholder="如：物品名称" />
          </Form.Item>

          <Form.Item
            name="type"
            label="字段类型"
            rules={[{ required: true, message: "请选择字段类型" }]}
          >
            <Select placeholder="选择字段类型">
              {FIELD_TYPES.map((type) => (
                <Option key={type.value} value={type.value}>
                  <Tag color={type.color}>{type.label}</Tag>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) =>
              prevValues.type !== currentValues.type
            }
          >
            {({ getFieldValue }) => {
              const type = getFieldValue("type");
              if (type === "select" || type === "multiselect") {
                const tabItems = [
                  {
                    key: "basic",
                    label: "基础选项",
                    children: (
                      <>
                        <Form.Item label="依赖字段（可选）" style={{ marginBottom: 16 }}>
                          <Space direction="vertical" style={{ width: "100%" }}>
                            <Form.Item
                              name="dependsOn"
                              noStyle
                            >
                              <Select
                                placeholder="选择依赖字段（实现联动过滤）"
                                allowClear
                                style={{ width: "100%" }}
                              >
                                {availableParentFields.map(field => (
                                  <Option key={field.id} value={field.id}>
                                    {field.name} ({field.type === "select" ? "单选" : "多选"})
                                  </Option>
                                ))}
                              </Select>
                            </Form.Item>
                            <div style={{ fontSize: 12, color: "#666" }}>
                              设置依赖后，此字段的选项将根据依赖字段的值动态过滤
                            </div>
                          </Space>
                        </Form.Item>

                        <Form.Item
                          noStyle
                          shouldUpdate={(prev, curr) => 
                            prev.dependsOn !== curr.dependsOn
                          }
                        >
                          {({ getFieldValue: getValue }) => {
                            const dependsOn = getValue("dependsOn");
                            if (dependsOn) {
                              // 有依赖字段时，按父级配置选项
                              return <CascadingOptionsForm fields={fields} form={form} />;
                            } else {
                              // 无依赖字段时，普通选项配置
                              return <BasicOptionsForm prefixes={prefixes} />;
                            }
                          }}
                        </Form.Item>
                      </>
                    ),
                  },
                ];
                return (
                  <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
                );
              }
              return null;
            }}
          </Form.Item>
        </Form>
      </Modal>
    </Modal>
  );
};

/**
 * 普通选项配置表单
 */
function BasicOptionsForm({ prefixes }) {
  return (
    <Form.Item label="选项配置">
      <Form.List name="options">
        {(fields, { add, remove }) => (
          <>
            {fields.map((field) => (
              <Row key={field.key} gutter={8} style={{ marginBottom: 8 }}>
                <Col span={7}>
                  <Form.Item
                    key={`${field.key}-label`}
                    name={[field.name, "label"]}
                    rules={[{ required: true, message: "请输入选项名" }]}
                    noStyle
                  >
                    <Input placeholder="选项名" />
                  </Form.Item>
                </Col>
                <Col span={5}>
                  <Form.Item
                    key={`${field.key}-color`}
                    name={[field.name, "color"]}
                    noStyle
                  >
                    <Input placeholder="颜色 #1890ff" />
                  </Form.Item>
                </Col>
                <Col span={9}>
                  <Form.Item
                    key={`${field.key}-prefix`}
                    name={[field.name, "prefixId"]}
                    noStyle
                  >
                    <Select 
                      placeholder="选择前缀（可选）"
                      allowClear
                      style={{ width: "100%" }}
                    >
                      {prefixes.map(prefix => (
                        <Option key={prefix.id} value={prefix.id}>
                          {prefix.name} ({prefix.prefix})
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={3}>
                  <Button type="text" danger onClick={() => remove(field.name)}>
                    删除
                  </Button>
                </Col>
              </Row>
            ))}
            <Button type="dashed" onClick={() => add({ color: "#1890ff" })} block>
              <PlusOutlined /> 添加选项
            </Button>
          </>
        )}
      </Form.List>
      <div style={{ marginTop: 8, fontSize: 12, color: "#666" }}>
        <TagOutlined /> 为选项选择前缀后，选择该选项的记录将使用该前缀生成编号
      </div>
    </Form.Item>
  );
}

/**
 * 级联选项配置表单
 */
function CascadingOptionsForm({ fields, form }) {
  const dependsOn = form.getFieldValue("dependsOn");
  const parentField = fields.find(f => f.id === dependsOn);
  const parentOptions = parentField?.options || [];

  return (
    <Form.Item label="按父级配置选项">
      <div style={{ marginBottom: 8, fontSize: 12, color: "#666" }}>
        依赖字段：{parentField?.name}，请为每个父级选项配置对应的子选项
      </div>
      <Form.Item name="optionsByParent">
        <CascadingOptionsEditor parentOptions={parentOptions} />
      </Form.Item>
    </Form.Item>
  );
}

/**
 * 级联选项编辑器
 */
function CascadingOptionsEditor({ value = {}, onChange, parentOptions }) {
  const [optionsByParent, setOptionsByParent] = useState(value);

  useEffect(() => {
    setOptionsByParent(value);
  }, [value]);

  const handleChange = (parentLabel, subOptions) => {
    const newValue = { ...optionsByParent, [parentLabel]: subOptions };
    setOptionsByParent(newValue);
    onChange?.(newValue);
  };

  return (
    <div style={{ maxHeight: 400, overflow: "auto" }}>
      {parentOptions.map(parentOpt => (
        <Card 
          key={parentOpt.label} 
          size="small" 
          title={
            <Tag color={parentOpt.color}>{parentOpt.label}</Tag>
          }
          style={{ marginBottom: 8 }}
        >
          <SubOptionsList
            options={optionsByParent[parentOpt.label] || []}
            onChange={(opts) => handleChange(parentOpt.label, opts)}
          />
        </Card>
      ))}
    </div>
  );
}

/**
 * 子选项列表
 */
function SubOptionsList({ options = [], onChange }) {
  const [localOptions, setLocalOptions] = useState(options);

  useEffect(() => {
    setLocalOptions(options);
  }, [options]);

  const handleAdd = () => {
    const newOptions = [...localOptions, { label: "", color: "#1890ff" }];
    setLocalOptions(newOptions);
    onChange(newOptions);
  };

  const handleRemove = (index) => {
    const newOptions = localOptions.filter((_, i) => i !== index);
    setLocalOptions(newOptions);
    onChange(newOptions);
  };

  const handleChange = (index, field, value) => {
    const newOptions = localOptions.map((opt, i) => 
      i === index ? { ...opt, [field]: value } : opt
    );
    setLocalOptions(newOptions);
    onChange(newOptions);
  };

  return (
    <>
      {localOptions.map((opt, index) => (
        <Row key={index} gutter={8} style={{ marginBottom: 8 }}>
          <Col span={10}>
            <Input
              placeholder="选项名"
              value={opt.label}
              onChange={(e) => handleChange(index, "label", e.target.value)}
              size="small"
            />
          </Col>
          <Col span={10}>
            <Input
              placeholder="颜色"
              value={opt.color}
              onChange={(e) => handleChange(index, "color", e.target.value)}
              size="small"
            />
          </Col>
          <Col span={4}>
            <Button type="text" danger size="small" onClick={() => handleRemove(index)}>
              删除
            </Button>
          </Col>
        </Row>
      ))}
      <Button type="dashed" size="small" onClick={handleAdd} block>
        <PlusOutlined /> 添加选项
      </Button>
    </>
  );
}

export default FieldConfig;
