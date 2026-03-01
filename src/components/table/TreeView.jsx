/**
 * TreeView.jsx
 * 树形视图组件
 */

import React, { useState, useMemo } from "react";
import { Tree, Button, Space, Empty, message } from "antd";
import {
  CloseOutlined,
  CaretRightOutlined,
  DragOutlined,
} from "@ant-design/icons";
import { useProjectStore } from "../../store/useProjectStore";
import { buildTree, getAvailableParents } from "../../utils/treeHelper";
import DetailPanel from "./DetailPanel";

const TreeView = ({ onBackToList }) => {
  const { selectedModule, records, updateRecord, moveRecord, deleteRecord } =
    useProjectStore();

  const [selectedRecordId, setSelectedRecordId] = useState(null);
  const [expandedKeys, setExpandedKeys] = useState([]);
  const [draggedRecordId, setDraggedRecordId] = useState(null);

  const nameFieldId = useMemo(() => {
    const textField = selectedModule?.fields?.find(
      (f) => f.type === "text" || f.type === "richtext"
    );
    return textField?.id || "f_name";
  }, [selectedModule]);

  const treeData = useMemo(() => {
    if (!records || records.length === 0) return [];
    return buildTree(records, nameFieldId);
  }, [records, nameFieldId]);

  const selectedRecord = useMemo(() => {
    return records.find((r) => r.id === selectedRecordId);
  }, [records, selectedRecordId]);

  const handleSelect = (selectedKeys) => {
    if (selectedKeys.length > 0) {
      setSelectedRecordId(selectedKeys[0]);
    } else {
      setSelectedRecordId(null);
    }
  };

  const handleExpand = (keys) => {
    setExpandedKeys(keys);
  };

  const handleDragStart = ({ node }) => {
    setDraggedRecordId(node.key);
  };

  const handleDrop = ({ node, dragNode, dropPosition }) => {
    const targetId = node.key;
    const sourceId = dragNode.key;

    if (sourceId === targetId) {
      setDraggedRecordId(null);
      return;
    }

    let newParentId;
    if (dropPosition === 1) {
      newParentId = targetId;
    } else {
      const targetRecord = records.find((r) => r.id === targetId);
      newParentId = targetRecord?.parentId || null;
    }

    const isDescendant = (parentId, childId) => {
      const child = records.find((r) => r.id === childId);
      if (!child) return false;
      if (child.parentId === parentId) return true;
      return isDescendant(parentId, child.parentId);
    };

    if (newParentId && isDescendant(sourceId, newParentId)) {
      message.error("不能将节点移动到其子节点下");
      setDraggedRecordId(null);
      return;
    }

    moveRecord(sourceId, newParentId);
    setDraggedRecordId(null);
    message.success("已调整层级关系");
  };

  const handleDeleteRecord = (recordId) => {
    deleteRecord(recordId);
    if (selectedRecordId === recordId) {
      setSelectedRecordId(null);
    }
    message.success("记录已删除");
  };

  const switcherIcon = ({ expanded }) => {
    return expanded ? (
      <CloseOutlined style={{ fontSize: 10, color: "#1890ff" }} />
    ) : (
      <CaretRightOutlined style={{ fontSize: 10, color: "#1890ff" }} />
    );
  };

  if (!selectedModule) {
    return <Empty description="请选择模块" />;
  }

  return (
    <div style={{ display: "flex", height: "calc(100vh - 140px)" }}>
      <div
        style={{
          width: 400,
          borderRight: "1px solid #f0f0f0",
          padding: 16,
          overflowY: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <span style={{ fontSize: 16, fontWeight: 500 }}>
            {selectedModule.name} - 层级视图
          </span>
          <Button size="small" onClick={onBackToList}>
            切换表格视图
          </Button>
        </div>

        {treeData.length === 0 ? (
          <Empty description="暂无记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <Tree
            showIcon
            showLine
            draggable={{
              icon: <DragOutlined />,
            }}
            defaultExpandAll={false}
            expandedKeys={expandedKeys}
            selectedKeys={selectedRecordId ? [selectedRecordId] : []}
            switcherIcon={switcherIcon}
            treeData={treeData}
            onSelect={handleSelect}
            onExpand={handleExpand}
            onDragStart={handleDragStart}
            onDrop={handleDrop}
            blockNode
          />
        )}
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {selectedRecord ? (
          <DetailPanel
            record={selectedRecord}
            module={selectedModule}
            allRecords={records}
            nameFieldId={nameFieldId}
            onUpdate={updateRecord}
            onDelete={handleDeleteRecord}
            onClose={() => setSelectedRecordId(null)}
          />
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "#999",
            }}
          >
            点击左侧节点查看详情
          </div>
        )}
      </div>
    </div>
  );
};

export default TreeView;
