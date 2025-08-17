// my-frontend/src/App.js
import React, { useEffect, useState } from "react";
import {
  Routes,
  Route,
  Navigate,
  Link,
  useNavigate,
} from "react-router-dom";

import LoginPage from "./components/LoginPage";
import DepartmentList from "./components/DepartmentList";
import DepartmentDetails from "./components/DepartmentDetails";

function Topbar({ onLogout, hasToken }) {
  const nav = useNavigate();
  return (
    <div style={{ padding: 12, borderBottom: "1px solid #ddd" }}>
      <Link to="/" style={{ marginRight: 12, fontWeight: 700 }}>
        Dashboard
      </Link>
      <Link to="/departments" style={{ marginRight: 12 }}>
        Departmanlar
      </Link>
      {hasToken ? (
        <button
          onClick={() => {
            onLogout();
            nav("/login", { replace: true });
          }}
          style={{ marginLeft: 12 }}
        >
          Çıkış
        </button>
      ) : null}
    </div>
  );
}

function Dashboard() {
  return (
    <div style={{ padding: 16 }}>
      <h1>Dashboard</h1>
      <p>
        <Link to="/departments">Departmanlar</Link>
      </p>
    </div>
  );
}

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");
  const [role, setRole] = useState(() => localStorage.getItem("role") || "");

  useEffect(() => {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");
  }, [token]);

  const handleLogout = () => {
    setToken("");
    setRole("");
    localStorage.removeItem("token");
    localStorage.removeItem("role");
  };

  return (
    <>
      <Topbar onLogout={handleLogout} hasToken={!!token} />

      <Routes>
        {/* Root: token varsa dashboard, yoksa login */}
        <Route
          path="/"
          element={<Navigate to={token ? "/dashboard" : "/login"} replace />}
        />

        {/* Login */}
        <Route path="/login" element={<LoginPage setToken={setToken} />} />

        {/* Korunan sayfalar */}
        <Route
          path="/dashboard"
          element={token ? <Dashboard /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/departments"
          element={
            token ? (
              <DepartmentList token={token} role={role} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/departments/:dnumber"
          element={
            token ? (
              <DepartmentDetails token={token} role={role} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Bilinmeyen yol */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
