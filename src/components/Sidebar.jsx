/**
 * Sidebar.jsx
 * 项目内部左侧导航栏组件
 * 功能：
 * - 显示项目名称（点击返回首页）
 * - 列出所有模块（图标+名称）
 * - 支持模块重命名（双击）、删除（右键菜单）
 * - 支持拖拽排序
 * - 底部新建模块按钮
 */

import React, { useState } from "react";
import {
  Button,
  Input,
  Dropdown,
  Modal,
  message,
  Tooltip,
  Menu,
} from "antd";
import {
  LeftOutlined,
  PlusOutlined,
  TableOutlined,
  EditOutlined,
  DeleteOutlined,
  MenuOutlined,
  TagOutlined,
} from "@ant-design/icons";
import { useProjectStore } from "../store/useProjectStore";
import { useNavigate } from "react-router-dom";

const { confirm } = Modal;

const Sidebar = ({ collapsed, onCollapse, onOpenPrefixManager }) => {
  const navigate = useNavigate();
  const {
    currentProject,
    modules,
    selectedModule,
    clearCurrentProject,
    addModule,
    renameModule,
    deleteModule,
    reorderModules,
    selectModule,
  } = useProjectStore();

  const [editingModuleId, setEditingModuleId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [isNewModuleModalOpen, setIsNewModuleModalOpen] = useState(false);
  const [newModuleName, setNewModuleName] = useState("");

  // 返回首页
  const handleBackHome = () => {
    clearCurrentProject();
    navigate("/");
  };

  // 开始编辑模块名称
  const startEditing = (module, e) => {
    e.stopPropagation();
    setEditingModuleId(module.id);
    setEditingName(module.name);
  };

  // 保存模块名称
  const saveModuleName = () => {
    const { modules } = useProjectStore.getState();
    const module = modules.find(m => m.id === editingModuleId);
    if (editingName.trim() && module && editingName.trim() !== module.name) {
      renameModule(editingModuleId, editingName.trim());
    }
    setEditingModuleId(null);
    setEditingName("");
  };

  // 取消编辑
  const cancelEditing = () => {
    setEditingModuleId(null);
    setEditingName("");
  };

  // 删除模块
  const handleDeleteModule = (module) => {
    confirm({
      title: "确认删除模块？",
      content: `删除后将无法恢复「${module.name}」`,
      okText: "删除",
      okType: "danger",
      cancelText: "取消",
      onOk() {
        deleteModule(module.id);
        message.success("删除成功");
      },
    });
  };

  // 新建模块
  const handleAddModule = () => {
    if (newModuleName.trim()) {
      addModule(newModuleName.trim());
      setNewModuleName("");
      setIsNewModuleModalOpen(false);
      message.success("模块创建成功");
    }
  };

  // 模块右键菜单
  const getModuleMenuItems = (module) => [
    {
      key: "rename",
      icon: <EditOutlined />,
      label: "重命名",
      onClick: (e) => {
        e.domEvent.stopPropagation();
        setEditingModuleId(module.id);
        setEditingName(module.name);
      },
    },
    {
      key: "delete",
      icon: <DeleteOutlined />,
      label: "删除",
      danger: true,
      onClick: (e) => {
        e.domEvent.stopPropagation();
        handleDeleteModule(module);
      },
    },
  ];

  // 拖拽相关
  const [draggingIndex, setDraggingIndex] = useState(null);

  const handleDragStart = (index) => {
    setDraggingIndex(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggingIndex === null || draggingIndex === index) return;

    // 重新排序
    const newModules = [...modules];
    const draggedItem = newModules[draggingIndex];
    newModules.splice(draggingIndex, 1);
    newModules.splice(index, 0, draggedItem);

    reorderModules(newModules);
    setDraggingIndex(index);
  };

  const handleDragEnd = () => {
    setDraggingIndex(null);
  };

  if (!currentProject) return null;

  return (
    <>
      <aside
        style={{
          width: collapsed ? 64 : 220,
          height: "100vh",
          backgroundColor: "#fff",
          borderRight: "1px solid #f0f0f0",
          display: "flex",
          flexDirection: "column",
          transition: "width 0.3s ease",
        }}
      >
        {/* 顶部项目信息 */}
        <div
          style={{
            padding: collapsed ? "16px 8px" : "16px 20px",
            borderBottom: "1px solid #f0f0f0",
            display: "flex",
            alignItems: "center",
            gap: 12,
            cursor: "pointer",
          }}
          onClick={handleBackHome}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: currentProject.color,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <span style={{ color: "#fff", fontSize: 14, fontWeight: 600 }}>
              {currentProject.name.charAt(0).toUpperCase()}
            </span>
          </div>
          {!collapsed && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#262626",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {currentProject.name}
              </div>
              <div style={{ fontSize: 12, color: "#8c8c8c" }}>点击返回首页</div>
            </div>
          )}
          {!collapsed && <LeftOutlined style={{ color: "#bfbfbf" }} />}
        </div>

        {/* 模块列表 */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
          {modules.map((module, index) => (
            <Dropdown
              key={module.id}
              menu={{ items: getModuleMenuItems(module) }}
              trigger={["contextMenu"]}
            >
              <div
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                onClick={() => selectModule(module.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: collapsed ? "10px" : "10px 12px",
                  borderRadius: 8,
                  cursor: "pointer",
                  marginBottom: 4,
                  backgroundColor:
                    selectedModule?.id === module.id ? "#e6f4ff" : "transparent",
                  border:
                    selectedModule?.id === module.id
                      ? "1px solid #2B4C7E"
                      : "1px solid transparent",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  if (selectedModule?.id !== module.id) {
                    e.currentTarget.style.backgroundColor = "#f5f5f5";
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedModule?.id !== module.id) {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }
                }}
              >
                {/* 拖拽手柄 */}
                {!collapsed && (
                  <MenuOutlined
                    style={{
                      fontSize: 12,
                      color: "#bfbfbf",
                      cursor: "grab",
                    }}
                  />
                )}

                {/* 图标 */}
                <TableOutlined
                  style={{
                    fontSize: 16,
                    color:
                      selectedModule?.id === module.id ? "#2B4C7E" : "#595959",
                  }}
                />

                {/* 模块名称 */}
                {!collapsed &&
                  (editingModuleId === module.id ? (
                    <Input
                      size="small"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onBlur={saveModuleName}
                      onPressEnter={saveModuleName}
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                      style={{ flex: 1 }}
                    />
                  ) : (
                    <span
                      style={{
                        flex: 1,
                        fontSize: 14,
                        color:
                          selectedModule?.id === module.id
                            ? "#2B4C7E"
                            : "#262626",
                        fontWeight:
                          selectedModule?.id === module.id ? 500 : 400,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      onDoubleClick={(e) => startEditing(module, e)}
                    >
                      {module.name}
                    </span>
                  ))}
              </div>
            </Dropdown>
          ))}
        </div>

        {/* 底部按钮区域 */}
        <div style={{ padding: "12px", borderTop: "1px solid #f0f0f0" }}>
          {/* 前缀库管理按钮 */}
          {collapsed ? (
            <Tooltip title="前缀库管理" placement="right">
              <Button
                icon={<TagOutlined />}
                onClick={onOpenPrefixManager}
                style={{ width: "100%", marginBottom: 8 }}
              />
            </Tooltip>
          ) : (
            <Button
              icon={<TagOutlined />}
              onClick={onOpenPrefixManager}
              style={{ width: "100%", marginBottom: 8 }}
            >
              前缀库管理
            </Button>
          )}

          {/* 新建模块按钮 */}
          {collapsed ? (
            <Tooltip title="新建模块" placement="right">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setIsNewModuleModalOpen(true)}
                style={{ width: "100%" }}
              />
            </Tooltip>
          ) : (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsNewModuleModalOpen(true)}
              style={{ width: "100%" }}
            >
              新建模块
            </Button>
          )}
        </div>
      </aside>

      {/* 新建模块弹窗 */}
      <Modal
        title="新建模块"
        open={isNewModuleModalOpen}
        onOk={handleAddModule}
        onCancel={() => {
          setIsNewModuleModalOpen(false);
          setNewModuleName("");
        }}
        okText="创建"
        cancelText="取消"
      >
        <Input
          value={newModuleName}
          onChange={(e) => setNewModuleName(e.target.value)}
          placeholder="请输入模块名称"
          maxLength={30}
          showCount
          onPressEnter={handleAddModule}
          autoFocus
        />
      </Modal>
    </>
  );
};

export default Sidebar;
