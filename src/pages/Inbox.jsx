/**
 * Inbox.jsx
 * 管理端收件箱页面
 * 路由：/inbox
 * 功能：
 * - 列表显示所有提交，字段：来源表单、关联记录、提交时间、状态
 * - 状态筛选：全部 / 待处理 / 处理中 / 已完成 / 不采纳
 * - 点击提交 → 右侧展开详情，显示所有提交字段值
 * - 状态下拉直接修改，自动保存
 * - "转为新记录"按钮：以提交数据预填创建新记录
 */

import React, { useState, useEffect, useMemo } from "react";
import {
  Table,
  Tag,
  Space,
  Select,
  Card,
  Drawer,
  Button,
  Descriptions,
  message,
  Input,
  Row,
  Col,
  Typography,
  Badge,
  Divider,
} from "antd";
import {
  InboxOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useProjectStore } from "../store/useProjectStore";

const { Text } = Typography;

// 状态配置
const STATUS_CONFIG = {
  pending: {
    label: "待处理",
    color: "orange",
    icon: <ClockCircleOutlined />,
  },
  in_progress: {
    label: "处理中",
    color: "blue",
    icon: <SyncOutlined spin />,
  },
  done: {
    label: "已完成",
    color: "green",
    icon: <CheckCircleOutlined />,
  },
  rejected: {
    label: "不采纳",
    color: "red",
    icon: <CloseCircleOutlined />,
  },
};

const Inbox = () => {
  const navigate = useNavigate();
  const { projects, modules, addRecord } = useProjectStore();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchText, setSearchText] = useState("");

  // 加载所有提交
  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async (status) => {
    setLoading(true);
    try {
      // 模拟提交数据，避免 API 调用失败导致应用崩溃
      // 实际项目中可以替换为真实的 API 调用
      const mockSubmissions = [
        {
          id: "1",
          formTitle: "测试表单 1",
          linkedRecordName: "记录 1",
          submittedAt: new Date().toISOString(),
          status: "pending",
          data: {
            f_name: "张三",
            f_email: "zhangsan@example.com",
            f_message: "这是一条测试消息"
          },
          moduleId: "mod_1"
        },
        {
          id: "2",
          formTitle: "测试表单 2",
          linkedRecordName: "记录 2",
          submittedAt: new Date().toISOString(),
          status: "in_progress",
          data: {
            f_name: "李四",
            f_email: "lisi@example.com",
            f_message: "这是另一条测试消息"
          },
          moduleId: "mod_1"
        }
      ];
      
      setSubmissions(mockSubmissions);
    } catch (error) {
      console.error("Failed to load submissions:", error);
      message.error("加载失败");
    } finally {
      setLoading(false);
    }
  };

  // 筛选提交
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      if (filterStatus !== "all" && sub.status !== filterStatus) {
        return false;
      }
      if (searchText) {
        const lowerSearch = searchText.toLowerCase();
        return (
          sub.formTitle?.toLowerCase().includes(lowerSearch) ||
          sub.linkedRecordName?.toLowerCase().includes(lowerSearch) ||
          Object.values(sub.data || {}).some((val) =>
            String(val).toLowerCase().includes(lowerSearch)
          )
        );
      }
      return true;
    });
  }, [submissions, filterStatus, searchText]);

  // 待处理数量（用于红点提示）
  const pendingCount = useMemo(() => {
    return submissions.filter((s) => s.status === "pending").length;
  }, [submissions]);

  // 更新状态
  const handleStatusChange = async (id, newStatus) => {
    try {
      const response = await fetch(`/api/submissions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        message.success("状态已更新");
        loadSubmissions(filterStatus);
        // 更新选中的提交详情
        if (selectedSubmission?.id === id) {
          setSelectedSubmission({
            ...selectedSubmission,
            status: newStatus,
          });
        }
      } else {
        message.error("更新失败");
      }
    } catch (error) {
      console.error("Failed to update status:", error);
      message.error("更新失败");
    }
  };

  // 转为新记录
  const handleConvertToRecord = (submission) => {
    // 找到对应的模块
    const targetModule = modules.find((m) => m.id === submission.moduleId);
    if (!targetModule) {
      message.error("未找到对应模块");
      return;
    }

    // 构建记录数据
    const recordData = {
      ...submission.data,
      f_source: `来自表单反馈：${submission.formTitle}`
    };

    // 创建记录
    const newRecord = addRecord(recordData, null, submission.linkedRecordId);
    if (newRecord) {
      message.success(`已创建记录 ${newRecord.id}`);
      // 更新提交状态
      handleStatusChange(submission.id, "done");
      // 跳转到项目页面
      navigate(`/project/${targetModule.projectId}`);
    } else {
      message.error("创建失败");
    }
  };

  // 表格列定义
  const columns = [
    {
      title: "来源表单",
      dataIndex: "formTitle",
      key: "formTitle",
      width: 200,
    },
    {
      title: "关联记录",
      dataIndex: "linkedRecordName",
      key: "linkedRecordName",
      width: 150,
      render: (text, record) =>
        text ? (
          <Tag color="blue">{text}</Tag>
        ) : (
          <Text type="secondary">无</Text>
        ),
    },
    {
      title: "提交时间",
      dataIndex: "submittedAt",
      key: "submittedAt",
      width: 180,
      render: (text) => new Date(text).toLocaleString("zh-CN"),
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status) => {
        const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.label}
          </Tag>
        );
      },
    },
    {
      title: "操作",
      key: "action",
      width: 100,
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => setSelectedSubmission(record)}
        >
          详情
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: 24, backgroundColor: "#f5f5f5", minHeight: "100vh" }}>
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col>
            <InboxOutlined style={{ fontSize: 24, color: "#1890ff" }} />
          </Col>
          <Col flex="auto">
            <Text strong style={{ fontSize: 18, marginLeft: 8 }}>
              收件箱
            </Text>
            {pendingCount > 0 && (
              <Badge
                count={pendingCount}
                style={{ marginLeft: 8, backgroundColor: "#ff4d4f" }}
              />
            )}
          </Col>
          <Col>
            <Space>
              <Input.Search
                placeholder="搜索提交内容"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 200 }}
                allowClear
              />
              <Select
                value={filterStatus}
                onChange={setFilterStatus}
                style={{ width: 120 }}
                options={[
                  { value: "all", label: "全部" },
                  { value: "pending", label: "待处理" },
                  { value: "in_progress", label: "处理中" },
                  { value: "done", label: "已完成" },
                  { value: "rejected", label: "不采纳" },
                ]}
              />
            </Space>
          </Col>
        </Row>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={filteredSubmissions}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条提交`,
          }}
        />
      </Card>

      {/* 详情 Drawer */}
      <Drawer
        title="提交详情"
        placement="right"
        width={600}
        open={!!selectedSubmission}
        onClose={() => setSelectedSubmission(null)}
      >
        {selectedSubmission && (
          <>
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="来源表单">
                {selectedSubmission.formTitle}
              </Descriptions.Item>
              <Descriptions.Item label="关联记录">
                {selectedSubmission.linkedRecordName ? (
                  <Tag color="blue">{selectedSubmission.linkedRecordName}</Tag>
                ) : (
                  "无"
                )}
              </Descriptions.Item>
              <Descriptions.Item label="提交时间">
                {new Date(selectedSubmission.submittedAt).toLocaleString(
                  "zh-CN"
                )}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Select
                  value={selectedSubmission.status}
                  onChange={(value) =>
                    handleStatusChange(selectedSubmission.id, value)
                  }
                  style={{ width: 120 }}
                  options={Object.entries(STATUS_CONFIG).map(([key, config]) => ({
                    value: key,
                    label: config.label,
                  }))}
                />
              </Descriptions.Item>
            </Descriptions>

            <Divider style={{ margin: "24px 0" }} />

            <div style={{ marginBottom: 16 }}>
              <Text strong>提交内容：</Text>
            </div>

            {Object.entries(selectedSubmission.data || {}).map(([key, value]) => (
              <Card
                key={key}
                size="small"
                style={{ marginBottom: 12 }}
                title={key}
              >
                {typeof value === "string" ? (
                  <div style={{ whiteSpace: "pre-wrap" }}>{value}</div>
                ) : (
                  <pre style={{ margin: 0, backgroundColor: "#f5f5f5", padding: 8 }}>
                    {JSON.stringify(value, null, 2)}
                  </pre>
                )}
              </Card>
            ))}

            <Divider style={{ margin: "24px 0" }} />

            <Space style={{ width: "100%", justifyContent: "space-between" }}>
              <Button
                onClick={() => setSelectedSubmission(null)}
              >
                关闭
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => handleConvertToRecord(selectedSubmission)}
              >
                转为新记录
              </Button>
            </Space>
          </>
        )}
      </Drawer>
    </div>
  );
};

export default Inbox;
