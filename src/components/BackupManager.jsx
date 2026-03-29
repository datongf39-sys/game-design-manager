/**
 * BackupManager.jsx
 * 数据备份管理组件
 * 功能：
 * - 导出：JSON（完整备份）/ CSV（仅表格）
 * - 导入：从 JSON 备份恢复
 */

import React, { useState, useRef } from "react";
import {
  Modal,
  Button,
  Space,
  Card,
  message,
  Upload,
  Typography,
  Divider,
  Descriptions,
  Badge,
} from "antd";
import {
  DownloadOutlined,
  UploadOutlined,
  FileJsonOutlined,
  FileExcelOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { useProjectStore } from "../store/useProjectStore";
import {
  exportProjectJSON,
  exportModuleCSV,
  importProjectJSON,
  writeBackupToStorage,
} from "../utils/backup";

const { Text } = Typography;

const BackupManager = ({ visible, onClose }) => {
  const { currentProject, modules, init } = useProjectStore();
  const [importPreview, setImportPreview] = useState(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

  // 导出 JSON
  const handleExportJSON = async () => {
    try {
      if (!currentProject) {
        message.warning("请先选择一个项目");
        return;
      }
      await exportProjectJSON(currentProject.id, currentProject);
      message.success("项目导出成功");
    } catch (error) {
      console.error("Export failed:", error);
      message.error("导出失败");
    }
  };

  // 导出 CSV（每个模块一个文件）
  const handleExportCSV = async () => {
    try {
      if (modules.length === 0) {
        message.warning("没有可导出的模块");
        return;
      }

      for (const module of modules) {
        await exportModuleCSV(module.id, module.fields || [], module.name);
      }
      message.success(`已导出 ${modules.length} 个模块为 CSV 文件`);
    } catch (error) {
      console.error("CSV Export failed:", error);
      message.error("导出失败");
    }
  };

  // 选择导入文件
  const handleImportFile = (file) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const result = await importProjectJSON(file);
        setImportPreview(result);
      } catch (error) {
        console.error("Import failed:", error);
        message.error("无效的备份文件");
      }
    };
    reader.readAsText(file);
    return false; // 阻止默认上传行为
  };

  // 确认导入
  const handleConfirmImport = async () => {
    if (!importPreview) return;

    setImporting(true);
    try {
      await writeBackupToStorage(
        importPreview.backup,
        importPreview.newProjectId,
        currentProject || {}
      );
      message.success("项目恢复成功！");
      setImportPreview(null);
      init(); // 重新初始化
      onClose();
    } catch (error) {
      console.error("Import failed:", error);
      message.error("恢复失败");
    } finally {
      setImporting(false);
    }
  };

  return (
    <>
      <Modal
        title="数据备份"
        open={visible}
        onCancel={onClose}
        footer={[
          <Button key="close" onClick={onClose}>
            关闭
          </Button>,
        ]}
        width={600}
      >
        <Card
          size="small"
          title={
            <Space>
              <DownloadOutlined />
              导出数据
            </Space>
          }
          style={{ marginBottom: 16 }}
        >
          <Space direction="vertical" style={{ width: "100%" }}>
            <Button
              icon={<FileJsonOutlined />}
              onClick={handleExportJSON}
              block
              size="large"
            >
              导出为 JSON（完整备份）
            </Button>
            <Text type="secondary" style={{ fontSize: 12 }}>
              包含项目信息、所有模块、字段配置和记录数据
            </Text>

            <Divider style={{ margin: "16px 0" }} />

            <Button
              icon={<FileExcelOutlined />}
              onClick={handleExportCSV}
              block
              size="large"
            >
              导出为 CSV（Excel 可用）
            </Button>
            <Text type="secondary" style={{ fontSize: 12 }}>
              每个模块导出为一个 CSV 文件，可用 Excel 打开编辑
            </Text>
          </Space>
        </Card>

        <Card
          size="small"
          title={
            <Space>
              <UploadOutlined />
              导入数据
            </Space>
          }
        >
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <Upload
              accept=".json"
              showUploadList={false}
              beforeUpload={handleImportFile}
            >
              <Button type="primary" icon={<UploadOutlined />} size="large">
                选择备份文件
              </Button>
            </Upload>
            <div style={{ marginTop: 12, color: "#999", fontSize: 13 }}>
              支持从之前导出的 JSON 备份文件恢复
            </div>
          </div>
        </Card>
      </Modal>

      {/* 导入预览弹窗 */}
      <Modal
        title="导入预览"
        open={!!importPreview}
        onCancel={() => setImportPreview(null)}
        onOk={handleConfirmImport}
        confirmLoading={importing}
        okText="确认恢复"
        cancelText="取消"
        okButtonProps={{ danger: true }}
      >
        {importPreview && (
          <div>
            <Card
              size="small"
              style={{ marginBottom: 16 }}
              title={
                <Space>
                  <CheckCircleOutlined style={{ color: "#52c41a" }} />
                  备份文件有效
                </Space>
              }
            >
              <Descriptions column={1} size="small">
                <Descriptions.Item label="项目名称">
                  {importPreview.backup.project.name}
                </Descriptions.Item>
                <Descriptions.Item label="导出时间">
                  {new Date(importPreview.backup.exportedAt).toLocaleString(
                    "zh-CN"
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="备份版本">
                  {importPreview.backup.version}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card size="small" title="将创建以下内容：">
              <Space direction="vertical" style={{ width: "100%" }}>
                <Badge
                  count={importPreview.stats.moduleCount}
                  style={{ backgroundColor: "#1890ff" }}
                >
                  <div style={{ padding: "8px 12px" }}>模块</div>
                </Badge>
                <Badge
                  count={importPreview.stats.recordCount}
                  style={{ backgroundColor: "#52c41a" }}
                >
                  <div style={{ padding: "8px 12px" }}>记录</div>
                </Badge>
                <Badge
                  count={importPreview.stats.prefixCount}
                  style={{ backgroundColor: "#faad14" }}
                >
                  <div style={{ padding: "8px 12px" }}>前缀</div>
                </Badge>
              </Space>
            </Card>

            <div
              style={{
                marginTop: 16,
                padding: 12,
                backgroundColor: "#fff7e6",
                border: "1px solid #ffd591",
                borderRadius: 4,
              }}
            >
              <Text type="warning">
                注意：恢复将创建一个新项目，不会影响现有数据
              </Text>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default BackupManager;
