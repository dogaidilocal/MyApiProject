// src/App.js
import React, { useEffect, useMemo, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import AppShell from "./layout/AppShell";

import LoginPage from "./components/LoginPage";
import DepartmentList from "./components/DepartmentList";
import DepartmentDetails from "./components/DepartmentDetails";
import ProjectsPage from "./pages/ProjectsPage"; // projeler için sayfa
import ProjectDetails from "./components/ProjectDetails";
import TaskDetails from "./components/TaskDetails";
import EmployeeList from "./components/EmployeeList";
import ProjectLeaderList from "./components/ProjectLeaderList";
import Dashboard from "./pages/Dashboard";
import CredentialsAdmin from "./pages/CredentialsAdmin";

function getRoleFromToken(token) {
  if (!token) return "";
  try {
    const payload = JSON.parse(atob(token.split(".")[1] || ""));
    
    // Try multiple possible role claim names
    const role = payload.role || 
                 payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ||
                 payload.roles ||
                 payload.Role;
    
    if (Array.isArray(role)) return role[0] || "";
    return (role || "").toLowerCase();
  } catch (error) {
    console.error("Error parsing JWT token:", error);
    return "";
  }
}

function getSSNFromToken(token) {
  if (!token) return "";
  try {
    const payload = JSON.parse(atob(token.split(".")[1] || ""));
    return payload.SSN || "";
  } catch {
    return "";
  }
}

function Protected({ token, children }) {
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");
  const [role, setRole] = useState(() => localStorage.getItem("role") || "");

  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
      const r = getRoleFromToken(token);
      setRole(r);
      localStorage.setItem("role", r || "");
    } else {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      setRole("");
    }
  }, [token]);

  const isAdmin = useMemo(() => role?.toLowerCase() === "admin", [role]);

  const handleLogout = () => {
    setToken("");
    setRole("");
    localStorage.removeItem("token");
    localStorage.removeItem("role");
  };

  return (
    <Routes>
      {/* Root yönlendirme */}
      <Route
        path="/"
        element={<Navigate to={token ? "/dashboard" : "/login"} replace />}
      />

      {/* Login serbest */}
      <Route path="/login" element={<LoginPage setToken={setToken} />} />

      {/* Korumalı alan: AppShell + Outlet */}
      <Route
        element={
          <Protected token={token}>
            <AppShell onLogout={handleLogout} />
          </Protected>
        }
      >
        {/* Shell içi çocuk rotalar */}
        <Route path="/dashboard" element={<Dashboard />} />

        <Route
          path="/departments"
          element={<DepartmentList token={token} role={role} />}
        />
        <Route
          path="/departments/:dnumber"
          element={<DepartmentDetails token={token} role={role} />}
        />
        <Route
          path="/departments/:dnumber/projects/:pnumber"
          element={<ProjectDetails token={token} role={role} />}
        />

        {/* Projeler sayfası (liste + detay layout’u) */}
        <Route path="/projects" element={<ProjectsPage />} />
        <Route
          path="/projects/:pnumber"
          element={<ProjectDetails token={token} role={role} isAdmin={isAdmin} />}
        />

        {/* Görev detayı (opsiyonel) */}
        <Route
          path="/tasks/:taskId"
          element={<TaskDetails token={token} role={role} isAdmin={isAdmin} />}
        />

        {/* Çalışanlar & Liderler */}
        <Route path="/employees" element={<EmployeeList />} />
        <Route path="/leaders" element={<ProjectLeaderList />} />
        <Route path="/admin/credentials" element={isAdmin ? <CredentialsAdmin /> : <Navigate to="/dashboard" replace />} />

        {/* Shell içinde bilinmeyen yol -> dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>

      {/* Shell dışındaki bilinmeyen yol -> root */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
