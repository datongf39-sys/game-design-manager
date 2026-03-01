/**
 * main.jsx
 * 应用入口文件
 * 初始化 React 应用并挂载到 DOM
 */

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// 导入 Ant Design 样式
import "antd/dist/reset.css";

// 创建根节点并渲染应用
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
