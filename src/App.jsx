/**
 * App.jsx
 * 应用根组件
 */

import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import Home from "./pages/Home";
import ProjectView from "./pages/ProjectView";
import PublicForm from "./pages/PublicForm";
import Inbox from "./pages/Inbox";

const App = () => {
  return (
    <ConfigProvider locale={zhCN}>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/project/:projectId" element={<ProjectView />} />
          <Route path="/form/:formId" element={<PublicForm />} />
          <Route path="/inbox" element={<Inbox />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ConfigProvider>
  );
};

export default App;