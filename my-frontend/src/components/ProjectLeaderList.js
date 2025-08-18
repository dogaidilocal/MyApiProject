// my-frontend/src/components/ProjectLeaderList.js
import React, { useEffect, useMemo, useState } from "react";

export default function ProjectLeaderList() {
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");

  // --- Güvenli alan okuyucular ---
  const getSSN = (l) => l.LeaderSSN || l.leaderSSN || l.id || l.leaderId || "";
  const getFullName = (l) => {
    if (l.FullName) return l.FullName;
    if (l.fullName) return l.fullName;
    if (l.Employee) {
      const f = l.Employee.Fname || l.Employee.fname || "";
      const g = l.Employee.Lname || l.Employee.lname || "";
      return `${f} ${g}`.trim();
    }
    if (l.employee) {
      const f = l.employee.fname || "";
      const g = l.employee.lname || "";
      return `${f} ${g}`.trim();
    }
    return "";
  };
  const getPnumber = (l) =>
    l.Pnumber || l.pnumber || (l.Project && (l.Project.Pnumber || l.Project.pnumber));
  const getDnumber = (l) =>
    l.Dnumber || l.dnumber || (l.Department && (l.Department.Dnumber || l.Department.dnumber));
  const getStartDate = (l) => l.Start_date || l.start_date || l.startDate || null;
  const getProjectName = (l) =>
    (l.Project && (l.Project.Pname || l.Project.pname)) || `#${getPnumber(l) || "—"}`;
  const getDeptName = (l) =>
    (l.Department && (l.Department.Dname || l.Department.dname)) || (getDnumber(l) || "—");

  const fetchLeaders = async (signal) => {
    setLoading(true);
    setErr("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/ProjectLeaders`, {
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        signal,
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error("API liste döndürmedi");
      setLeaders(data);
    } catch (e) {
      if (e.name !== "AbortError") setErr(e.message || "Yükleme hatası");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const c = new AbortController();
    fetchLeaders(c.signal);
    return () => c.abort();
  }, [API_URL]);

  const filtered = useMemo(() => {
    const s = (q || "").trim().toLowerCase();
    if (!s) return leaders;
    return leaders.filter((l) => {
      const parts = [
        getFullName(l),
        String(getSSN(l) || ""),
        String(getPnumber(l) || ""),
        String(getDnumber(l) || ""),
        String(getProjectName(l) || ""),
        String(getDeptName(l) || ""),
      ].map((x) => String(x).toLowerCase());
      return parts.some((p) => p.includes(s));
    });
  }, [leaders, q]);

  return (
    <div className="section">
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <h2 style={{ margin: 0 }}>Project Leaders</h2>
        <input
          placeholder="Ara (ad, ssn, proje, departman)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ padding: "6px 8px", minWidth: 260 }}
        />
        <button onClick={() => fetchLeaders()} disabled={loading} style={{ padding: "6px 10px" }}>
          {loading ? "Yükleniyor..." : "↻ Yenile"}
        </button>
      </div>

      {err && <p style={{ color: "red", marginTop: 8 }}>Hata: {err}</p>}

      {!err && !loading && filtered.length === 0 && (
        <p style={{ marginTop: 12 }}>Kayıt bulunamadı.</p>
      )}

      {!err && (
        <ul style={{ listStyle: "none", padding: 0, marginTop: 12 }}>
          {filtered.map((l, i) => (
            <li
              key={getSSN(l) || i}
              style={{
                border: "1px solid #e5e5e5",
                borderRadius: 8,
                padding: "10px 12px",
                marginBottom: 8,
                background: "#fafafa",
              }}
            >
              <strong>{getFullName(l) || "—"}</strong>{" "}
              — SSN: {getSSN(l) || "—"} — Proje: {getProjectName(l)} — Departman: {getDeptName(l)}{" "}
              {getStartDate(l) ? (
                <span>— Başlangıç: {new Date(getStartDate(l)).toLocaleDateString()}</span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
