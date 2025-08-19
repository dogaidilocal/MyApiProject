// src/components/SidebarNav.jsx
import React from "react";
import { NavLink } from "react-router-dom";

const itemStyle = (isActive) => ({
  display: "block",
  padding: "14px 16px",
  borderRadius: 12,
  background: isActive ? "#5b7cff" : "#ffffff",
  color: isActive ? "white" : "#111827",
  textDecoration: "none",
  fontWeight: 600,
  marginBottom: 10,
  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
});

export default function SidebarNav() {
  const role = (localStorage.getItem("role") || "").toLowerCase();
  const isAdmin = role === "admin";
  return (
    <nav
      style={{
        background: "#fff",
        padding: 12,
        borderRadius: 12,
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
      }}
    >
      <NavLink to="/dashboard" style={({ isActive }) => itemStyle(isActive)}>
        <span role="img" aria-label="dash">📊</span> Dashboard
      </NavLink>

      <NavLink to="/departments" style={({ isActive }) => itemStyle(isActive)}>
        <span role="img" aria-label="dep">📁</span> Departmanlar
      </NavLink>

      <NavLink to="/projects" style={({ isActive }) => itemStyle(isActive)}>
        <span role="img" aria-label="proj">🧱</span> Projeler
      </NavLink>

      <NavLink to="/leaders" style={({ isActive }) => itemStyle(isActive)}>
        <span role="img" aria-label="leader">👑</span> Proje Liderleri
      </NavLink>
      {isAdmin && (
        <NavLink to="/admin/credentials" style={({ isActive }) => itemStyle(isActive)}>
          <span role="img" aria-label="users">🔐</span> Kullanıcı Bilgileri
        </NavLink>
      )}
    </nav>
  );
}
