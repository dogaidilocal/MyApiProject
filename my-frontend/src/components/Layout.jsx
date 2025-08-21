import React from "react";
import { NavLink, useNavigate } from "react-router-dom";

const linkStyle = ({ isActive }) => ({
  display: "block",
  padding: "10px 12px",
  borderRadius: 8,
  textDecoration: "none",
  color: isActive ? "#fff" : "#222",
  background: isActive ? "#3b82f6" : "transparent",
});

export default function Layout({ children }) {
  const nav = useNavigate();
  const token = localStorage.getItem("token");

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    nav("/login", { replace: true });
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f5f7fb" }}>
      {/* Topbar */}
      <header
        style={{
          height: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          background: "#111827",
          color: "white",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ fontWeight: 700 }}>🧭 Project Portal</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ opacity: 0.7, fontSize: 12 }}>
            API: {process.env.REACT_APP_API_URL || "http://localhost:5001"}
          </span>
          {token && (
            <button
              onClick={logout}
              style={{
                marginLeft: 8,
                background: "#ef4444",
                color: "#fff",
                border: 0,
                borderRadius: 6,
                padding: "6px 10px",
                cursor: "pointer",
              }}
            >
              Çıkış
            </button>
          )}
        </div>
      </header>

      {/* Shell */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "240px 1fr",
          gap: 16,
          padding: 16,
          maxWidth: 1280,
          margin: "0 auto",
        }}
      >
        {/* Sidebar */}
        <aside
          style={{
            background: "#fff",
            borderRadius: 12,
            padding: 12,
            boxShadow: "0 1px 3px rgba(0,0,0,.08)",
            alignSelf: "start",
            position: "sticky",
            top: 72,
          }}
        >
          <nav style={{ display: "grid", gap: 6 }}>
            <NavLink to="/dashboard" style={linkStyle}>
              📊 Dashboard
            </NavLink>
            <NavLink to="/departments" style={linkStyle}>
              🗂️ Departmanlar
            </NavLink>
            <NavLink to="/projects" style={linkStyle}>
              🧱 Projeler
            </NavLink>
            <NavLink to="/leaders" style={linkStyle}>
              👑 Proje Liderleri
            </NavLink>
          </nav>
        </aside>

        {/* Content */}
        <main>{children}</main>
      </div>
    </div>
  );
}