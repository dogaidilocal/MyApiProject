// src/pages/Dashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";

export default function Dashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token") || "";
  const role = (localStorage.getItem("role") || "").toLowerCase();
  const isAdmin = role === "admin";

  const [departments, setDepartments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState({ deps: false, projs: false, emps: false });
  const [err, setErr] = useState("");
  const [empQ, setEmpQ] = useState("");
  const [empFormOpen, setEmpFormOpen] = useState(false);
  const [empMode, setEmpMode] = useState("new");
  const [empForm, setEmpForm] = useState({ SSN: "", Fname: "", Lname: "", Dno: "", Username: "", Password: "" });

  // ---- Fetch helpers ----
  useEffect(() => {
    const load = async () => {
      setErr("");
      setLoading({ deps: true, projs: true, emps: true });
      try {
        const [dRes, pRes, eRes] = await Promise.all([
          fetch(`${API_URL}/api/Departments`, { headers: token ? { Authorization: `Bearer ${token}` } : undefined }),
          fetch(`${API_URL}/api/Projects`, { headers: token ? { Authorization: `Bearer ${token}` } : undefined }),
          fetch(`${API_URL}/api/Employees`, { headers: token ? { Authorization: `Bearer ${token}` } : undefined }),
        ]);

        if (!dRes.ok) throw new Error(`Departments HTTP ${dRes.status}`);
        if (!pRes.ok) throw new Error(`Projects HTTP ${pRes.status}`);
        if (!eRes.ok) throw new Error(`Employees HTTP ${eRes.status}`);

        const [dData, pData, eData] = await Promise.all([dRes.json(), pRes.json(), eRes.json()]);
        setDepartments(Array.isArray(dData) ? dData : []);
        setProjects(Array.isArray(pData) ? pData : []);
        setEmployees(Array.isArray(eData) ? eData : []);
      } catch (e) {
        console.error(e);
        setErr(e.message || "Yükleme hatası");
      } finally {
        setLoading({ deps: false, projs: false, emps: false });
      }
    };
    load();
  }, [token]);

  // ---- Employees filtered ----
  const filteredEmployees = useMemo(() => {
    const s = (empQ || "").toLowerCase();
    if (!s) return employees;
    return employees.filter((e) => {
      const id = String(e.SSN ?? e.ssn ?? "").toLowerCase();
      const fn = String(e.Fname ?? e.fname ?? "").toLowerCase();
      const ln = String(e.Lname ?? e.lname ?? "").toLowerCase();
      return id.includes(s) || fn.includes(s) || ln.includes(s);
    });
  }, [employees, empQ]);

  // ---- Actions ----
  const deleteDepartment = async (dnumber) => {
    if (!isAdmin) return;
    if (!window.confirm("Bu departmanı silmek istiyor musunuz?")) return;
    try {
      const res = await fetch(`${API_URL}/api/Departments/${dnumber}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setDepartments((list) => list.filter((d) => Number(d.dnumber) !== Number(dnumber)));
    } catch (e) {
      alert("Silme hatası: " + (e.message || "bilinmiyor"));
    }
  };

  const deleteProject = async (pnumber) => {
    if (!isAdmin) return;
    if (!window.confirm("Bu projeyi silmek istiyor musunuz?")) return;
    try {
      const res = await fetch(`${API_URL}/api/Projects/${pnumber}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setProjects((list) => list.filter((p) => Number(p.pnumber ?? p.Pnumber) !== Number(pnumber)));
    } catch (e) {
      alert("Silme hatası: " + (e.message || "bilinmiyor"));
    }
  };

  // ---- Employees CRUD (admin) ----
  const openEmpNew = () => {
    setEmpMode("new");
    setEmpForm({ SSN: "", Fname: "", Lname: "", Dno: "", Username: "", Password: "" });
    setEmpFormOpen(true);
  };
  const openEmpEdit = (e) => {
    setEmpMode("edit");
    setEmpForm({
      SSN: e.SSN ?? e.ssn ?? "",
      Fname: e.Fname ?? e.fname ?? "",
      Lname: e.Lname ?? e.lname ?? "",
      Dno: e.Dno ?? e.dno ?? "",
      Username: (e.username || ""),
      Password: "",
    });
    setEmpFormOpen(true);
  };
  const empFormChange = (ev) => setEmpForm((p) => ({ ...p, [ev.target.name]: ev.target.value }));
  const saveEmployee = async () => {
    const headers = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
    try {
      if (empMode === "new") {
        const res = await fetch(`${API_URL}/api/Employees`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            SSN: empForm.SSN,
            Fname: empForm.Fname,
            Lname: empForm.Lname,
            Dno: Number(empForm.Dno || 0),
            Username: empForm.Username || empForm.Fname?.toLowerCase(),
            Password: empForm.Password || undefined,
          }),
        });
        if (!res.ok) throw new Error(await res.text());
      } else {
        const res = await fetch(`${API_URL}/api/Employees/${empForm.SSN}`, {
          method: "PUT",
          headers,
          body: JSON.stringify({
            ssn: empForm.SSN,
            fname: empForm.Fname,
            lname: empForm.Lname,
            dno: Number(empForm.Dno || 0),
          }),
        });
        if (!res.ok) throw new Error(await res.text());
      }
      // refresh employees list
      const eRes = await fetch(`${API_URL}/api/Employees`, { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
      const eData = await eRes.json();
      setEmployees(Array.isArray(eData) ? eData : []);
      setEmpFormOpen(false);
    } catch (e) {
      alert("Kaydetme hatası: " + (e.message || ""));
    }
  };
  const removeEmployee = async (ssn) => {
    if (!window.confirm("Bu çalışan silinsin mi?")) return;
    try {
      const res = await fetch(`${API_URL}/api/Employees/${ssn}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) throw new Error(await res.text());
      setEmployees((list) => list.filter((x) => (x.SSN ?? x.ssn) !== ssn));
    } catch (e) {
      alert("Silme hatası: " + (e.message || ""));
    }
  };

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Dashboard</h1>
      {err && <p style={{ color: "red" }}>Hata: {err}</p>}

      {/* Üst kısım: Departmanlar (sol) — Projeler (sağ) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* Departmanlar */}
        <section>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <h2 style={{ margin: 0 }}>Departmanlar</h2>
            {isAdmin && (
              <button onClick={() => navigate("/departments")}>+ Yeni Departman Ekle</button>
            )}
          </div>
          {loading.deps ? (
            <p>Yükleniyor…</p>
          ) : departments.length === 0 ? (
            <p>Kayıt yok.</p>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
              gap: 12,
              marginTop: 12,
            }}>
              {departments.map((d) => (
                <div key={d.dnumber} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, background: "#fafafa" }}>
                  <div onClick={() => navigate(`/departments/${d.dnumber}`)} style={{ cursor: "pointer" }}>
                    <strong style={{ display: "block" }}>{d.dname}</strong>
                    <small style={{ color: "#666" }}>ID: {d.dnumber}</small>
                  </div>
                  {isAdmin && (
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      <button onClick={() => navigate(`/departments/${d.dnumber}`)}>Düzenle</button>
                      <button onClick={() => deleteDepartment(d.dnumber)} style={{ color: "red" }}>Sil</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Projeler */}
        <section>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <h2 style={{ margin: 0 }}>Projeler</h2>
            {isAdmin && (
              <button onClick={() => navigate("/projects")}>+ Yeni Proje Ekle</button>
            )}
          </div>
          {loading.projs ? (
            <p>Yükleniyor…</p>
          ) : projects.length === 0 ? (
            <p>Kayıt yok.</p>
          ) : (
            <ul style={{ marginTop: 12 }}>
              {projects.map((p) => (
                <li key={p.pnumber ?? p.Pnumber} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ cursor: "pointer" }} onClick={() => navigate(`/projects/${p.pnumber ?? p.Pnumber}`)}>
                      {p.pname ?? p.Pname} (ID: {p.pnumber ?? p.Pnumber})
                    </span>
                    {isAdmin && (
                      <>
                        <button onClick={() => navigate(`/projects/${p.pnumber ?? p.Pnumber}`)}>Düzenle</button>
                        <button onClick={() => deleteProject(p.pnumber ?? p.Pnumber)} style={{ color: "red" }}>Sil</button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Alt: Çalışanlar */}
      <section style={{ marginTop: 24 }}>
        <h2 style={{ marginBottom: 8 }}>Çalışanlar</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span role="img" aria-label="search">🔎</span>
          <input
            placeholder="Ara (ad, soyad, SSN)"
            value={empQ}
            onChange={(e) => setEmpQ(e.target.value)}
            style={{ padding: "6px 8px", minWidth: 260 }}
          />
          {isAdmin && (
            <button onClick={openEmpNew}>+ Yeni Çalışan</button>
          )}
        </div>
        {isAdmin && empFormOpen && (
          <div style={{ marginTop: 12, border: "1px solid #ddd", borderRadius: 8, padding: 12, maxWidth: 740 }}>
            <h3 style={{ marginTop: 0 }}>{empMode === "edit" ? "Çalışan Düzenle" : "Yeni Çalışan"}</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <label>SSN<input name="SSN" value={empForm.SSN} onChange={empFormChange} disabled={empMode === "edit"} /></label>
              <label>Ad<input name="Fname" value={empForm.Fname} onChange={empFormChange} /></label>
              <label>Soyad<input name="Lname" value={empForm.Lname} onChange={empFormChange} /></label>
              <label>Departman No<input name="Dno" type="number" value={empForm.Dno} onChange={empFormChange} /></label>
              {empMode === "new" && (
                <>
                  <label>Kullanıcı Adı<input name="Username" value={empForm.Username} onChange={empFormChange} placeholder="Boş bırakılırsa ad'dan üretilir" /></label>
                  <label>Şifre<input name="Password" value={empForm.Password} onChange={empFormChange} placeholder="Boş: otomatik üret" /></label>
                </>
              )}
            </div>
            <div style={{ marginTop: 10 }}>
              <button onClick={saveEmployee} style={{ marginRight: 8 }}>Kaydet</button>
              <button onClick={() => setEmpFormOpen(false)}>İptal</button>
            </div>
          </div>
        )}
        {loading.emps ? (
          <p>Yükleniyor…</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, marginTop: 12, maxWidth: 720 }}>
            {filteredEmployees.map((e, i) => {
              const dep = e.department || e.Department;
              const depName = dep ? (dep.dname || dep.Dname) : (e.dno || e.Dno || "—");
              const full = `${e.fname ?? e.Fname ?? ""} ${e.lname ?? e.Lname ?? ""}`.trim() || "İsimsiz";
              const ssn = e.ssn ?? e.SSN ?? "—";
              return (
                <li key={(e.SSN ?? e.ssn ?? i)} style={{ border: "1px solid #e5e5e5", borderRadius: 8, padding: "8px 10px", marginBottom: 8, background: "#fafafa" }}>
                  <strong>{full}</strong> — SSN: {ssn} — Departman: {String(depName)}
                  {isAdmin && (
                    <span style={{ float: "right" }}>
                      <button onClick={() => openEmpEdit(e)} style={{ marginRight: 8 }}>Düzenle</button>
                      <button onClick={() => removeEmployee(ssn)} style={{ color: "red" }}>Sil</button>
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}