// src/pages/Dashboard.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      <p style={{ marginTop: 8 }}>
        <Link to="/departments">Departmanlar</Link> ·{" "}
        <Link to="/projects">Projeler</Link> ·{" "}
        <Link to="/leaders">Proje Liderleri</Link>
      </p>
    </div>
  );
}
