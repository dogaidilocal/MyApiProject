// src/layout/AppShell.jsx
import React from "react";
import { Outlet } from "react-router-dom";
import SidebarNav from "../components/SidebarNav";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";

export default function AppShell({ onLogout }) {
  return (
    <div style={{ minHeight: "100vh", display: "grid", gridTemplateRows: "56px 1fr" }}>
      {/* Header */}
      <header
        style={{
          background: "#0f172a",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
        }}
      >
        <div style={{ fontWeight: 700 }}>
          <span role="img" aria-label="logo">🧭</span> Project Portal
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <small style={{ opacity: 0.8 }}>API: {API_URL}</small>
          <button
            onClick={onLogout}
            style={{
              background: "#ef4444",
              color: "white",
              border: 0,
              borderRadius: 8,
              padding: "6px 10px",
              cursor: "pointer",
            }}
          >
            Çıkış
          </button>
        </div>
      </header>

      {/* Body: sidebar + content */}
      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 16 }}>
        <aside style={{ padding: 16 }}>
          <SidebarNav />
        </aside>

        <main style={{ padding: 16 }}>
          {/* ÇOCUK ROUTE’LAR BURAYA GELİR */}
          <Outlet />
        </main>
      </div>
    </div>
  );
}