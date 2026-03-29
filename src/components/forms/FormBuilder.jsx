/**
 * FormBuilder.jsx
 * 表单配置管理组件
 * 功能：
 * - 显示该模块现有的表单列表
 * - 新建表单：选择要暴露的字段、写表单标题和说明、设置是否包含"关联记录"选择器
 * - 激活/停用表单
 * - 显示表单链接，支持一键复制
 */

import React, { useState, useEffect } from "react";
import {
  Modal,
  Table,
  Button,
  Space,
  Tag,
  Input,
  Form,
  Switch,
  message,
  Tooltip,
  Checkbox,
  Divider,
  Card,
} from "antd";
import {
  CopyOutlined,
  LinkOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PoweroffOutlined,
} from "@ant-design/icons";
import { useProjectStore } from "../../store/useProjectStore";

const FormBuilder = ({ visible, onClose, moduleId }) => {
  const { selectedModule } = useProjectStore();
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingForm, setEditingForm] = useState(null);
  const [form] = Form.useForm();

  // 加载表单列表
  useEffect(() => {
    if (visible && moduleId) {
      loadForms();
    }
  }, [visible, moduleId]);

  const loadForms = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/forms/${moduleId}`);
      if (response.ok) {
        const data = await response.json();
        setForms(data);
      } else {
        setForms([]);
      }
    } catch (error) {
      console.error("Failed to load forms:", error);
      setForms([]);
    } finally {
      setLoading(false);
    }
  };

  // 创建表单
  const handleCreate = async (values) => {
    try {
      const response = await fetch("/api/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleId,
          title: values.title,
          description: values.description,
          config: {
            exposedFields: values.exposedFields,
            includeRecordLink: values.includeRecordLink,
            recordLinkLabel: values.recordLinkLabel || "关联记录",
          },
        }),
      });

      if (response.ok) {
        message.success("表单创建成功");
        setIsCreateModalOpen(false);
        form.resetFields();
        loadForms();
      } else {
        message.error("创建失败");
      }
    } catch (error) {
      console.error("Failed to create form:", error);
      message.error("创建失败");
    }
  };

  // 更新表单
  const handleUpdate = async (formId, updates) => {
    try {
      const response = await fetch(`/api/forms/${formId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        message.success("更新成功");
        loadForms();
      } else {
        message.error("更新失败");
      }
    } catch (error) {
      console.error("Failed to update form:", error);
      message.error("更新失败");
    }
  };

  // 删除表单
  const handleDelete = (form) => {
    Modal.confirm({
      title: "确认删除？",
      content: `删除表单「${form.title}」后，所有提交记录也将被删除，且无法恢复。`,
      okText: "删除",
      okType: "danger",
      cancelText: "取消",
      onOk: async () => {
        try {
          const response = await fetch(`/api/forms/${form.id}`, {
            method: "DELETE",
          });

          if (response.ok) {
            message.success("删除成功");
            loadForms();
          } else {
            message.error("删除失败");
          }
        } catch (error) {
          console.error("Failed to delete form:", error);
          message.error("删除失败");
        }
      },
    });
  };

  // 复制链接
  const copyLink = (token) => {
    const url = `${window.location.origin}/form/${token}`;
    navigator.clipboard.writeText(url);
    message.success("链接已复制到剪贴板");
  };

  // 切换激活状态
  const toggleActive = (form) => {
    handleUpdate(form.id, { isActive: !form.isActive });
  };

  const columns = [
    {
      title: "表单名称",
      dataIndex: "title",
      key: "title",
    },
    {
      title: "状态",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive) => (
        <Tag color={isActive ? "green" : "red"}>
          {isActive ? "已激活" : "已停用"}
        </Tag>
      ),
    },
    {
      title: "创建时间",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (createdAt) => new Date(createdAt).toLocaleString("zh-CN"),
    },
    {
      title: "操作",
      key: "action",
      render: (_, record) => (
        <Space>
          <Tooltip title="复制链接">
            <Button
              type="text"
              icon={<LinkOutlined />}
              onClick={() => copyLink(record.token)}
            />
          </Tooltip>
          <Tooltip title={record.isActive ? "停用" : "激活"}>
            <Button
              type="text"
              icon={<PoweroffOutlined />}
              onClick={() => toggleActive(record)}
            />
          </Tooltip>
          <Tooltip title="删除">
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Modal
        title="表单管理"
        open={visible}
        onCancel={onClose}
        width={900}
        footer={[
          <Button key="close" onClick={onClose}>
            关闭
          </Button>,
        ]}
      >
        <div style={{ marginBottom: 16 }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            新建表单
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={forms}
          rowKey="id"
          loading={loading}
          pagination={false}
        />
      </Modal>

      {/* 创建表单弹窗 */}
      <Modal
        title="新建表单"
        open={isCreateModalOpen}
        onOk={() => form.submit()}
        onCancel={() => {
          setIsCreateModalOpen(false);
          form.resetFields();
        }}
        okText="创建"
        cancelText="取消"
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreate}
          initialValues={{
            includeRecordLink: false,
            recordLinkLabel: "关联记录",
          }}
        >
          <Form.Item
            name="title"
            label="表单标题"
            rules={[{ required: true, message: "请输入表单标题" }]}
          >
            <Input placeholder="如：功能反馈表" />
          </Form.Item>

          <Form.Item name="description" label="表单说明">
            <Input.TextArea
              rows={3}
              placeholder="简要说明此表单的用途，将显示在填写页顶部"
            />
          </Form.Item>

          <Divider>暴露字段</Divider>

          <Form.Item
            name="exposedFields"
            label="选择要暴露给外部填写的字段"
            rules={[
              { required: true, message: "请至少选择一个字段" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || value.length === 0) {
                    return Promise.reject("请至少选择一个字段");
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <Checkbox.Group style={{ width: "100%" }}>
              <Space direction="vertical" style={{ width: "100%" }}>
                {selectedModule?.fields
                  ?.filter((f) => f.id !== "f_name") // 排除名称字段
                  .map((field) => (
                    <Checkbox
                      key={field.id}
                      value={field.id}
                      style={{ display: "flex" }}
                    >
                      <span>{field.name}</span>
                      <Tag size="small" style={{ marginLeft: 8 }}>
                        {field.type}
                      </Tag>
                    </Checkbox>
                  ))}
              </Space>
            </Checkbox.Group>
          </Form.Item>

          <Divider>关联记录</Divider>

          <Form.Item
            name="includeRecordLink"
            label="是否包含'关联记录'选择器"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) =>
              prevValues.includeRecordLink !== currentValues.includeRecordLink
            }
          >
            {({ getFieldValue }) =>
              getFieldValue("includeRecordLink") ? (
                <Form.Item
                  name="recordLinkLabel"
                  label="关联记录选择器标签"
                  rules={[{ required: true, message: "请输入标签文字" }]}
                >
                  <Input placeholder="如：对应功能、相关模块等" />
                </Form.Item>
              ) : null
            }
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default FormBuilder;
