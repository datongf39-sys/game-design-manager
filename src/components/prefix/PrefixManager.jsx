/**
 * PrefixManager.jsx
 * 前缀库管理组件
 * 功能：
 * - 在项目设置页面管理
 * - 可新建前缀（名称 + 前缀字符串，如 "食物" + "C-"）
 * - 建模块时可选择绑定哪个前缀
 */

import React, { useState } from "react";
import {
  Modal,
  Form,
  Input,
  Button,
  Table,
  Space,
  Popconfirm,
  message,
  Card,
  Typography,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  TagOutlined,
} from "@ant-design/icons";
import { useProjectStore } from "../../store/useProjectStore";

const { Title, Text } = Typography;

const PrefixManager = ({ visible, onClose }) => {
  const { prefixes, addPrefix, updatePrefix, deletePrefix, modules } =
    useProjectStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPrefix, setEditingPrefix] = useState(null);
  const [form] = Form.useForm();

  // 表格列
  const columns = [
    {
      title: "前缀名称",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "前缀字符串",
      dataIndex: "prefix",
      key: "prefix",
      render: (prefix) => (
        <code style={{ background: "#f5f5f5", padding: "2px 6px", borderRadius: 4 }}>
          {prefix}
        </code>
      ),
    },
    {
      title: "示例编号",
      key: "example",
      render: (_, record) => (
        <span style={{ fontFamily: "monospace", color: "#666" }}>
          {record.prefix}001
        </span>
      ),
    },
    {
      title: "使用状态",
      key: "usage",
      render: (_, record) => {
        const usedCount = modules.filter((m) => m.prefixId === record.id).length;
        return usedCount > 0 ? (
          <Text type="secondary">已被 {usedCount} 个模块使用</Text>
        ) : (
          <Text type="success">未使用</Text>
        );
      },
    },
    {
      title: "操作",
      key: "action",
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="确认删除？"
            description="删除后无法恢复，使用该前缀的模块将使用默认前缀"
            onConfirm={() => handleDelete(record.id)}
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 打开新建弹窗
  const handleAdd = () => {
    setEditingPrefix(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  // 打开编辑弹窗
  const handleEdit = (prefix) => {
    setEditingPrefix(prefix);
    form.setFieldsValue({
      name: prefix.name,
      prefix: prefix.prefix,
    });
    setIsModalOpen(true);
  };

  // 删除前缀
  const handleDelete = (prefixId) => {
    const result = deletePrefix(prefixId);
    if (result.error) {
      message.error(result.error);
    } else {
      message.success("前缀已删除");
    }
  };

  // 保存前缀
  const handleSave = (values) => {
    if (editingPrefix) {
      updatePrefix(editingPrefix.id, values);
      message.success("前缀已更新");
    } else {
      addPrefix(values.name, values.prefix);
      message.success("前缀已创建");
    }
    setIsModalOpen(false);
    form.resetFields();
  };

  return (
    <Modal
      title={
        <Space>
          <TagOutlined />
          前缀库管理
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="close" onClick={onClose}>
          关闭
        </Button>,
      ]}
    >
      <Card
        style={{ marginBottom: 16 }}
        size="small"
      >
        <Text type="secondary">
          前缀用于自动生成记录的编号。例如设置前缀 "C-"，则记录编号为 C-001、C-002 等。
          删除记录后，新记录会自动填补空缺编号。
        </Text>
      </Card>

      <div style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新建前缀
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={prefixes}
        rowKey="id"
        pagination={false}
        size="small"
      />

      {/* 新建/编辑弹窗 */}
      <Modal
        title={editingPrefix ? "编辑前缀" : "新建前缀"}
        open={isModalOpen}
        onOk={() => form.submit()}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        okText="保存"
        cancelText="取消"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
        >
          <Form.Item
            name="name"
            label="前缀名称"
            rules={[
              { required: true, message: "请输入前缀名称" },
              { max: 50, message: "名称不超过50个字符" },
            ]}
          >
            <Input placeholder="如：食物类物品" />
          </Form.Item>

          <Form.Item
            name="prefix"
            label="前缀字符串"
            rules={[
              { required: true, message: "请输入前缀字符串" },
              { max: 10, message: "前缀不超过10个字符" },
              {
                pattern: /^[A-Za-z0-9_-]+$/,
                message: "前缀只能包含字母、数字、下划线和连字符",
              },
            ]}
          >
            <Space.Compact style={{ width: "100%" }}>
              <Input placeholder="如：C- 或 ITEM_" />
              <Input disabled value="001" style={{ width: 80, textAlign: "center" }} />
            </Space.Compact>
          </Form.Item>

          <Form.Item>
            <Text type="secondary">
              提示：前缀字符串会作为编号的一部分，如 "C-" 会生成 C-001、C-002 等编号
            </Text>
          </Form.Item>
        </Form>
      </Modal>
    </Modal>
  );
};

export default PrefixManager;
