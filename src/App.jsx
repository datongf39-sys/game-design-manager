/**
 * App.jsx
 * 应用根组件
 * 配置 React Router v6 路由
 * 定义应用的所有页面路由规则
 */

import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import ProjectView from "./pages/ProjectView";

const App = () => {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        {/* 首页 - 显示所有项目 */}
        <Route path="/" element={<Home />} />

        {/* 项目内部视图 - 显示项目详情和模块 */}
        <Route path="/project/:projectId" element={<ProjectView />} />

        {/* 404 页面 - 未匹配的路由重定向到首页 */}
        <Route path="*" element={<Home />} />
      </Routes>
    </Router>
  );
};

export default App;
