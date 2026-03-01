/**
 * BacklinkPanel.jsx
 * 反向关联面板
 * 功能：
 * - 显示"被以下记录引用"
 * - 列出所有引用了当前记录的来源
 * - 点击来源记录打开详情面板
 */

import React, { useState, useEffect } from "react";
import { Card, Collapse, Tag, Space, Typography, List, Button, message } from "antd";
import {
  LinkOutlined,
  RightOutlined,
  DownOutlined,
  NumberOutlined,
} from "@ant-design/icons";
import { useProjectStore } from "../../store/useProjectStore";

const { Text } = Typography;
const { Panel } = Collapse;

const BacklinkPanel = ({ recordId, onRecordClick }) => {
  const { getBacklinks, getModuleById, getRecordById } = useProjectStore();
  const [backlinks, setBacklinks] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (recordId) {
      loadBacklinks();
    }
  }, [recordId]);

  const loadBacklinks = async () => {
    setLoading(true);
    try {
      const links = await getBacklinks(recordId);
      setBacklinks(links);
    } catch (error) {
      console.error("Failed to load backlinks:", error);
      message.error("加载引用关系失败");
    } finally {
      setLoading(false);
    }
  };

  const handleRecordClick = (sourceRecordId) => {
    if (onRecordClick) {
      onRecordClick(sourceRecordId);
    }
  };

  if (backlinks.length === 0) {
    return null; // 没有引用时不显示
  }

  return (
    <Card
      size="small"
      title={
        <Space>
          <LinkOutlined style={{ color: "#1890ff" }} />
          <span>被引用</span>
          <Tag color="orange">{backlinks.length}</Tag>
        </Space>
      }
      type="inner"
    >
      <List
        dataSource={backlinks}
        renderItem={(link) => {
          const sourceRecord = getRecordById(link.sourceRecordId);
          const sourceModule = getModuleById(link.sourceModuleId);

          return (
            <List.Item
              style={{
                cursor: "pointer",
                padding: "8px 0",
                borderBottom: "1px solid #f0f0f0",
              }}
              onClick={() => handleRecordClick(link.sourceRecordId)}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#f5f5f5";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <Space style={{ width: "100%" }} align="start">
                <div style={{ flex: 1 }}>
                  <div style={{ marginBottom: 4 }}>
                    <Tag color="blue">{link.sourceRecordId}</Tag>
                    <Text strong style={{ marginLeft: 8 }}>
                      {link.sourceRecordName || "未命名"}
                    </Text>
                  </div>
                  <div style={{ fontSize: 12, color: "#666" }}>
                    <Space split={<span style={{ color: "#d9d9d9" }}>|</span>}>
                      <span>
                        <RightOutlined style={{ fontSize: 10, marginRight: 4 }} />
                        {sourceModule?.name || "未知模块"}
                      </span>
                      <span>{link.sourceFieldName || "未知字段"}</span>
                    </Space>
                  </div>
                </div>
              </Space>
            </List.Item>
          );
        }}
      />
    </Card>
  );
};

export default BacklinkPanel;
