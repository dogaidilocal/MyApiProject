import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

import LoginPage from "./components/LoginPage";
import DepartmentList from "./components/DepartmentList";
import DepartmentDetails from "./components/DepartmentDetails";
import ProjectDetails from "./components/ProjectDetails";
import TaskDetails from "./components/TaskDetails";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [projects, setProjects] = useState([]);

  // Token varsa decode et
  useEffect(() => {
    if (!token) return;

    try {
      const decoded = jwtDecode(token);
      setUser(decoded);

      const headers = { Authorization: `Bearer ${token}` };

      fetch(`${process.env.REACT_APP_API_URL}/api/Departments`, { headers })
        .then(r => {
          if (!r.ok) throw new Error("Departmanlar yüklenemedi");
          return r.json();
        })
        .then(setDepartments)
        .catch(err => {
          console.error(err);
          handleLogout();
        });

      fetch(`${process.env.REACT_APP_API_URL}/api/ProjectsWithTasks`, { headers })
        .then(r => {
          if (!r.ok) throw new Error("Projeler yüklenemedi");
          return r.json();
        })
        .then(setProjects)
        .catch(err => {
         
          handleLogout();
        });

    } catch (err) {
      console.error("Token çözümlenemedi:", err);
      handleLogout();
    }
  }, [token]);

  const handleSetToken = (tok) => {
    try {
      const decoded = jwtDecode(tok);
      localStorage.setItem("token", tok);
      setToken(tok);
      setUser(decoded);
    } catch (err) {
      console.error("Geçersiz token:", err);
      alert("Oturum başlatılamadı. Lütfen tekrar giriş yapın.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  if (!token) {
    return <LoginPage setToken={handleSetToken} />;
  }

  const role = user?.["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
  const isAdmin = ["admin"].includes(role?.toLowerCase());

  return (
    <div style={{ padding: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
        <h3>
          👋 Hoşgeldin, <strong>{user?.username || user?.name || "Kullanıcı"}</strong>!
        </h3>
        <button onClick={handleLogout}>Çıkış Yap</button>
      </div>

      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route
          path="/dashboard"
          element={<DepartmentList token={token} role={role?.toLowerCase()} />}
        />
        <Route
          path="/departments/:dnumber"
          element={<DepartmentDetails token={token} role={role} />}
        />
        <Route
          path="/departments/:dnumber/projects/:pnumber"
          element={<ProjectDetails projects={projects} isAdmin={isAdmin} token={token} role={role} />}
        />
        <Route
          path="/departments/:dnumber/projects/:pnumber/tasks/:taskID"
          element={<TaskDetails token={token} isAdmin={isAdmin} />}
        />
      </Routes>
    </div>
  );
}

export default App;
