/**
 * PublicForm.jsx
 * 公开表单填写页
 * 路由：/form/:token
 * 完全独立的页面，不依赖任何需要登录的组件
 */

import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Form,
  Input,
  Select,
  Button,
  Result,
  Card,
  Space,
  Tag,
  Spin,
  Alert,
  message,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  FileTextOutlined,
} from "@ant-design/icons";

const PublicForm = () => {
  const { token } = useParams();
  const [formConfig, setFormConfig] = useState(null);
  const [status, setStatus] = useState("loading"); // loading|active|closed|submitted
  const [linkedOptions, setLinkedOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadFormConfig();
  }, [token]);

  const loadFormConfig = async () => {
    try {
      // 模拟表单配置数据，避免 API 调用失败导致应用崩溃
      // 实际项目中可以替换为真实的 API 调用
      const mockFormConfig = {
        title: "测试表单",
        description: "这是一个测试表单，用于验证表单功能",
        config: {
          includeRecordLink: true,
          recordLinkLabel: "关联记录"
        },
        fields: [
          {
            id: "f_name",
            name: "姓名",
            type: "text",
            required: true
          },
          {
            id: "f_email",
            name: "邮箱",
            type: "text",
            required: true
          },
          {
            id: "f_message",
            name: "留言",
            type: "textarea",
            required: false
          }
        ],
        isActive: true
      };
      
      setFormConfig(mockFormConfig);
      setStatus("active");

      // 模拟关联记录选项
      if (mockFormConfig.config?.includeRecordLink) {
        const mockLinkedOptions = [
          { id: "1", name: "记录 1" },
          { id: "2", name: "记录 2" },
          { id: "3", name: "记录 3" }
        ];
        setLinkedOptions(mockLinkedOptions);
      }
    } catch (error) {
      console.error("Failed to load form:", error);
      setStatus("closed");
    }
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const { _linked, ...formData } = values;

      await fetch(`/api/public/submit/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          linkedRecordId: _linked || null,
          data: formData,
        }),
      });

      setStatus("submitted");
      message.success("提交成功！");
    } catch (error) {
      console.error("Failed to submit:", error);
      message.error("提交失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  // 渲染字段输入框
  const renderFieldInput = (field) => {
    const rules = [];
    if (field.required) {
      rules.push({ required: true, message: `请输入${field.name}` });
    }

    switch (field.type) {
      case "textarea":
        return (
          <Input.TextArea
            rows={4}
            placeholder={`请输入${field.name}`}
            style={{ resize: "vertical" }}
          />
        );
      case "number":
        return (
          <Input.Number
            placeholder={`请输入${field.name}`}
            style={{ width: "100%" }}
          />
        );
      case "select":
      case "multiselect":
        return (
          <Select
            placeholder={`请选择${field.name}`}
            mode={field.type === "multiselect" ? "multiple" : undefined}
            allowClear
          >
            {field.options?.map((opt, idx) => (
              <Select.Option key={idx} value={opt.label}>
                {opt.label}
              </Select.Option>
            ))}
          </Select>
        );
      case "date":
        return <Input placeholder="请选择日期" type="date" />;
      default:
        return <Input placeholder={`请输入${field.name}`} />;
    }
  };

  // 加载中
  if (status === "loading") {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f5f5f5",
        }}
      >
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  // 表单已关闭
  if (status === "closed") {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f5f5f5",
          padding: 20,
        }}
      >
        <Card style={{ maxWidth: 500, textAlign: "center" }}>
          <Result
            status="warning"
            icon={<CloseCircleOutlined style={{ color: "#faad14" }} />}
            title="此表单已关闭"
            subTitle="抱歉，该表单已停止接收新的提交"
          />
        </Card>
      </div>
    );
  }

  // 提交成功
  if (status === "submitted") {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f5f5f5",
          padding: 20,
        }}
      >
        <Card style={{ maxWidth: 500, textAlign: "center" }}>
          <Result
            status="success"
            icon={<CheckCircleOutlined style={{ color: "#52c41a" }} />}
            title="提交成功"
            subTitle="感谢你的反馈！我们会认真考虑每一条建议"
          />
        </Card>
      </div>
    );
  }

  // 表单填写页
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f5f5f5",
        padding: "40px 20px",
      }}
    >
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        {/* 顶部标题 */}
        <Card
          style={{
            marginBottom: 24,
            textAlign: "center",
            backgroundColor: "#fff",
          }}
        >
          <Space direction="vertical" size="small" style={{ width: "100%" }}>
            <FileTextOutlined
              style={{ fontSize: 48, color: "#1890ff" }}
            />
            <h1 style={{ margin: 0, fontSize: 24 }}>{formConfig?.title}</h1>
            {formConfig?.description && (
              <p style={{ margin: 0, color: "#666" }}>
                {formConfig.description}
              </p>
            )}
          </Space>
        </Card>

        {/* 表单内容 */}
        <Card style={{ backgroundColor: "#fff" }}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            size="large"
          >
            {/* 关联记录选择器 */}
            {formConfig?.config?.includeRecordLink && (
              <Form.Item
                name="_linked"
                label={formConfig.config.recordLinkLabel || "关联记录"}
              >
                <Select
                  showSearch
                  placeholder="搜索对应记录..."
                  filterOption={(input, option) =>
                    (option?.label ?? "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  allowClear
                >
                  {linkedOptions.map((opt) => (
                    <Select.Option
                      key={opt.id}
                      value={opt.id}
                      label={opt.name}
                    >
                      {opt.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            )}

            {/* 动态渲染暴露的字段 */}
            {formConfig?.fields?.map((field) => (
              <Form.Item
                key={field.id}
                name={field.id}
                label={field.name}
                rules={
                  field.required
                    ? [{ required: true, message: `请输入${field.name}` }]
                    : []
                }
              >
                {renderFieldInput(field)}
              </Form.Item>
            ))}

            <Form.Item style={{ marginTop: 32 }}>
              <Button
                type="primary"
                htmlType="submit"
                block
                size="large"
                loading={loading}
              >
                提交
              </Button>
            </Form.Item>
          </Form>
        </Card>

        {/* 底部提示 */}
        <div style={{ textAlign: "center", marginTop: 16, color: "#999" }}>
          <Alert
            message="提示"
            description="请确保填写的信息真实有效，提交后将无法修改"
            type="info"
            showIcon
            style={{ maxWidth: 600, margin: "0 auto" }}
          />
        </div>
      </div>
    </div>
  );
};

export default PublicForm;
