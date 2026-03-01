/**
 * ProjectView.jsx
 * 项目内部视图
 * 功能：
 * - 左侧固定导航栏（宽220px，可折叠）
 * - 右侧主内容区显示表格视图或空占位
 */

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Empty, Button, ConfigProvider } from "antd";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  InboxOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { useProjectStore } from "../store/useProjectStore";
import Sidebar from "../components/Sidebar";
import TableView from "../components/table/TableView";
import FieldConfig from "../components/table/FieldConfig";
import PrefixManager from "../components/prefix/PrefixManager";

const ProjectView = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const {
    projects,
    currentProject,
    modules,
    selectedModule,
    init,
    selectProject,
    clearCurrentProject,
  } = useProjectStore();
  
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isFieldConfigOpen, setIsFieldConfigOpen] = useState(false);
  const [isPrefixManagerOpen, setIsPrefixManagerOpen] = useState(false);

  // 初始化加载
  useEffect(() => {
    init();
  }, [init]);

  // 根据 URL 参数加载项目
  useEffect(() => {
    if (projects.length > 0 && projectId) {
      const project = projects.find((p) => p.id === projectId);
      if (project) {
        selectProject(projectId);
      } else {
        // 项目不存在，返回首页
        navigate("/");
      }
      setLoading(false);
    } else if (projects.length === 0) {
      // 还没有任何项目
      setLoading(false);
    }
  }, [projects, projectId, selectProject, navigate]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      clearCurrentProject();
    };
  }, [clearCurrentProject]);

  if (loading) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f5f7fa",
        }}
      >
        <div style={{ color: "#666" }}>加载中...</div>
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f5f7fa",
        }}
      >
        <Empty description="项目不存在或已被删除" />
      </div>
    );
  }

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#2B4C7E",
          colorInfo: "#4F8EF7",
        },
      }}
    >
      <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
        {/* 左侧导航栏 */}
        <Sidebar 
          collapsed={collapsed} 
          onCollapse={setCollapsed}
          onOpenPrefixManager={() => setIsPrefixManagerOpen(true)}
        />

        {/* 主内容区 */}
        <main
          style={{
            flex: 1,
            backgroundColor: "#f5f7fa",
            overflow: "auto",
            position: "relative",
          }}
        >
          {/* 折叠按钮 */}
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              position: "absolute",
              top: 16,
              left: 16,
              zIndex: 10,
              width: 40,
              height: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          />

          {/* 内容区域 */}
          <div
            style={{
              padding: "80px 0 48px",
              minHeight: "100%",
            }}
          >
            {selectedModule ? (
              /* 选中模块后的表格视图 */
              <TableView 
                onFieldConfig={() => setIsFieldConfigOpen(true)}
              />
            ) : (
              /* 未选中模块时的空占位 */
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: "calc(100vh - 200px)",
                  padding: "0 48px",
                }}
              >
                <Empty
                  image={
                    <div
                      style={{
                        width: 160,
                        height: 160,
                        borderRadius: 32,
                        backgroundColor: "#e6f0ff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto 24px",
                      }}
                    >
                      <InboxOutlined
                        style={{ fontSize: 80, color: "#2B4C7E" }}
                      />
                    </div>
                  }
                  description={
                    <div style={{ textAlign: "center" }}>
                      <p
                        style={{
                          fontSize: 20,
                          fontWeight: 500,
                          color: "#262626",
                          marginBottom: 8,
                        }}
                      >
                        {modules.length > 0
                          ? "请选择或新建一个模块"
                          : "还没有模块"}
                      </p>
                      <p
                        style={{
                          fontSize: 14,
                          color: "#8c8c8c",
                          marginBottom: 24,
                        }}
                      >
                        {modules.length > 0
                          ? "点击左侧模块开始工作，或创建新模块"
                          : "创建你的第一个模块来组织数据"}
                      </p>
                      <Button
                        type="primary"
                        size="large"
                        icon={<PlusOutlined />}
                        onClick={() => {
                          // 触发 Sidebar 中的新建模块弹窗
                          const event = new CustomEvent("openNewModuleModal");
                          window.dispatchEvent(event);
                        }}
                        style={{
                          backgroundColor: "#2B4C7E",
                          borderRadius: 8,
                          height: 44,
                          padding: "0 32px",
                        }}
                      >
                        新建模块
                      </Button>
                    </div>
                  }
                />
              </div>
            )}
          </div>
        </main>
      </div>

      {/* 字段配置弹窗 */}
      <FieldConfig
        visible={isFieldConfigOpen}
        onClose={() => setIsFieldConfigOpen(false)}
      />

      {/* 前缀库管理弹窗 */}
      <PrefixManager
        visible={isPrefixManagerOpen}
        onClose={() => setIsPrefixManagerOpen(false)}
      />
    </ConfigProvider>
  );
};

export default ProjectView;
