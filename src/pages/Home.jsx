/**
 * Home.jsx
 * 首页 - 显示所有游戏项目的卡片列表
 * 功能：
 * - 显示项目卡片网格
 * - 右上角"新建项目"按钮
 * - 空状态引导
 * - 点击卡片进入项目
 */

import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Modal,
  Input,
  Empty,
  Row,
  Col,
  message,
  Space,
} from "antd";
import { PlusOutlined, AppstoreOutlined } from "@ant-design/icons";
import { useProjectStore } from "../store/useProjectStore";
import ProjectCard from "../components/ProjectCard";

// 预设颜色列表
const PRESET_COLORS = [
  { color: "#3A7BD5", name: "蓝色" },
  { color: "#8E44AD", name: "紫色" },
  { color: "#27AE60", name: "绿色" },
  { color: "#E74C3C", name: "红色" },
  { color: "#F39C12", name: "橙色" },
  { color: "#1ABC9C", name: "青色" },
];

const Home = () => {
  const navigate = useNavigate();
  const { projects, init, addProject, selectProject } = useProjectStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0].color);

  // 初始化加载数据 - 使用 useCallback 确保函数稳定
  const handleInit = useCallback(() => {
    init();
  }, [init]);

  useEffect(() => {
    handleInit();
  }, [handleInit]);

  // 打开新建项目弹窗
  const showModal = () => {
    setProjectName("");
    setSelectedColor(PRESET_COLORS[0].color);
    setIsModalOpen(true);
  };

  // 创建项目
  const handleCreate = () => {
    if (!projectName.trim()) {
      message.warning("请输入项目名称");
      return;
    }
    const newProject = addProject(projectName.trim(), selectedColor);
    setIsModalOpen(false);
    message.success("项目创建成功");
    // 进入新项目
    selectProject(newProject.id);
    navigate(`/project/${newProject.id}`);
  };

  // 进入项目
  const enterProject = (projectId) => {
    selectProject(projectId);
    navigate(`/project/${projectId}`);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f5f7fa",
        padding: "40px 48px",
      }}
    >
        {/* 头部 */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 32,
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 28,
                fontWeight: 600,
                color: "#1a1a1a",
              }}
            >
              游戏设计管理平台
            </h1>
            <p style={{ margin: "8px 0 0", color: "#666", fontSize: 14 }}>
              管理和组织你的游戏设计项目
            </p>
          </div>
          <Space>
            <Button
              type="primary"
              size="large"
              icon={<PlusOutlined />}
              onClick={showModal}
              style={{
                backgroundColor: "#2B4C7E",
                borderRadius: 8,
                height: 44,
                padding: "0 24px",
              }}
            >
              新建项目
            </Button>
          </Space>
        </div>

        {/* 项目列表 */}
        {projects.length > 0 ? (
          <Row gutter={[24, 24]}>
            {projects.map((project) => (
              <Col key={project.id} xs={24} sm={12} md={8} lg={6} xl={5}>
                <ProjectCard
                  project={project}
                  onClick={() => enterProject(project.id)}
                />
              </Col>
            ))}
          </Row>
        ) : (
          /* 空状态 */
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              paddingTop: 120,
            }}
          >
            <Empty
              image={
                <div
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: 24,
                    backgroundColor: "#e6f0ff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 24px",
                  }}
                >
                  <AppstoreOutlined
                    style={{ fontSize: 56, color: "#2B4C7E" }}
                  />
                </div>
              }
              description={
                <div style={{ textAlign: "center" }}>
                  <p
                    style={{
                      fontSize: 18,
                      fontWeight: 500,
                      color: "#262626",
                      marginBottom: 8,
                    }}
                  >
                    还没有项目
                  </p>
                  <p style={{ fontSize: 14, color: "#8c8c8c", marginBottom: 24 }}>
                    创建你的第一个游戏设计项目，开始组织创意
                  </p>
                  <Button
                    type="primary"
                    size="large"
                    icon={<PlusOutlined />}
                    onClick={showModal}
                    style={{
                      backgroundColor: "#2B4C7E",
                      borderRadius: 8,
                      height: 44,
                      padding: "0 32px",
                    }}
                  >
                    新建项目
                  </Button>
                </div>
              }
            />
          </div>
        )}

        {/* 新建项目弹窗 */}
        <Modal
          title="新建项目"
          open={isModalOpen}
          onOk={handleCreate}
          onCancel={() => setIsModalOpen(false)}
          okText="创建"
          cancelText="取消"
          okButtonProps={{
            style: { backgroundColor: "#2B4C7E" },
          }}
        >
          <div style={{ marginBottom: 24 }}>
            <label
              style={{
                display: "block",
                marginBottom: 8,
                fontSize: 14,
                fontWeight: 500,
                color: "#262626",
              }}
            >
              项目名称
            </label>
            <Input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="请输入项目名称"
              maxLength={50}
              showCount
              onPressEnter={handleCreate}
              autoFocus
              size="large"
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                marginBottom: 12,
                fontSize: 14,
                fontWeight: 500,
                color: "#262626",
              }}
            >
              选择颜色标识
            </label>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {PRESET_COLORS.map((item) => (
                <div
                  key={item.color}
                  onClick={() => setSelectedColor(item.color)}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    backgroundColor: item.color,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border:
                      selectedColor === item.color
                        ? "3px solid #2B4C7E"
                        : "3px solid transparent",
                    boxShadow:
                      selectedColor === item.color
                        ? "0 4px 12px rgba(43, 76, 126, 0.3)"
                        : "none",
                    transition: "all 0.2s ease",
                  }}
                  title={item.name}
                >
                  {selectedColor === item.color && (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M5 13L9 17L19 7"
                        stroke="white"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Modal>
      </div>
  );
};

export default Home;
