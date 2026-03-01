/**
 * ProjectCard.jsx
 * 项目卡片组件
 * 显示项目信息：名称、颜色标识、模块数量
 * 支持右键菜单：重命名、删除
 */

import React, { useState } from "react";
import { Card, Dropdown, Modal, Input, message } from "antd";
import {
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  AppstoreOutlined,
} from "@ant-design/icons";
import { useProjectStore } from "../store/useProjectStore";

// 预设颜色列表
const PRESET_COLORS = [
  "#3A7BD5", // 蓝色
  "#8E44AD", // 紫色
  "#27AE60", // 绿色
  "#E74C3C", // 红色
  "#F39C12", // 橙色
  "#1ABC9C", // 青色
];

const { confirm } = Modal;

const ProjectCard = ({ project, onClick }) => {
  const { renameProject, deleteProject, getModuleCount } = useProjectStore();
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [newName, setNewName] = useState(project.name);

  // 获取模块数量
  const moduleCount = getModuleCount(project.id);

  // 处理重命名
  const handleRename = () => {
    if (newName.trim() && newName.trim() !== project.name) {
      renameProject(project.id, newName.trim());
      message.success("重命名成功");
    }
    setIsRenameModalOpen(false);
  };

  // 处理删除
  const handleDelete = () => {
    confirm({
      title: "确认删除项目？",
      content: `删除后将无法恢复「${project.name}」及其所有模块数据`,
      okText: "删除",
      okType: "danger",
      cancelText: "取消",
      onOk() {
        deleteProject(project.id);
        message.success("删除成功");
      },
    });
  };

  // 右键菜单项
  const menuItems = [
    {
      key: "rename",
      icon: <EditOutlined />,
      label: "重命名",
      onClick: () => {
        setNewName(project.name);
        setIsRenameModalOpen(true);
      },
    },
    {
      key: "delete",
      icon: <DeleteOutlined />,
      label: "删除",
      danger: true,
      onClick: handleDelete,
    },
  ];

  return (
    <>
      <Dropdown menu={{ items: menuItems }} trigger={["contextMenu"]}>
        <Card
          hoverable
          onClick={onClick}
          style={{
            borderRadius: 12,
            overflow: "hidden",
            border: "none",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}
          bodyStyle={{ padding: 0 }}
        >
          {/* 顶部颜色条 */}
          <div
            style={{
              height: 6,
              backgroundColor: project.color || PRESET_COLORS[0],
            }}
          />

          <div style={{ padding: 20 }}>
            {/* 图标和名称 */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  backgroundColor: `${project.color || PRESET_COLORS[0]}15`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AppstoreOutlined
                  style={{
                    fontSize: 24,
                    color: project.color || PRESET_COLORS[0],
                  }}
                />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3
                  style={{
                    margin: 0,
                    fontSize: 16,
                    fontWeight: 600,
                    color: "#262626",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {project.name}
                </h3>
              </div>
            </div>

            {/* 模块数量 */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontSize: 13, color: "#8c8c8c" }}>
                {moduleCount} 个模块
              </span>
              <MoreOutlined style={{ color: "#bfbfbf" }} />
            </div>
          </div>
        </Card>
      </Dropdown>

      {/* 重命名弹窗 */}
      <Modal
        title="重命名项目"
        open={isRenameModalOpen}
        onOk={handleRename}
        onCancel={() => setIsRenameModalOpen(false)}
        okText="确认"
        cancelText="取消"
      >
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="请输入项目名称"
          maxLength={50}
          showCount
          onPressEnter={handleRename}
          autoFocus
        />
      </Modal>
    </>
  );
};

export default ProjectCard;
