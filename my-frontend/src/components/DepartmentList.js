import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";

export default function DepartmentList({ token, role }) {
  const navigate = useNavigate();

  // yetki
  const isAdmin = useMemo(() => role?.toLowerCase() === "admin", [role]);

  // state
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // arama
  const [q, setQ] = useState("");

  // form state
  const [showForm, setShowForm] = useState(false);
  const [mode, setMode] = useState("new"); // 'new' | 'edit'
  const [form, setForm] = useState({ dnumber: "", dname: "" });

  // departmanları çek
  useEffect(() => {
    let cancelled = false;

    async function fetchDepartments() {
      setLoading(true);
      setErr("");
      try {
        const res = await fetch(`${API_URL}/api/Departments`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!res.ok) throw new Error(`API ${res.status}`);
        const data = await res.json();
        if (!cancelled) setDepartments(data ?? []);
      } catch (e) {
        if (!cancelled) {
          console.error("Departman çekme hatası:", e);
          setErr("Departman çekme hatası: API JSON formatında cevap vermedi!");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchDepartments();
    return () => {
      cancelled = true;
    };
  }, [token]);

  // arama filtresi
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return departments;
    return departments.filter(
      (d) =>
        String(d.dnumber).includes(s) ||
        (d.dname || "").toLowerCase().includes(s)
    );
  }, [departments, q]);

  // form yardımcıları
  const openNew = () => {
    setMode("new");
    setForm({ dnumber: "", dname: "" });
    setShowForm(true);
  };

  const openEdit = (d) => {
    setMode("edit");
    setForm({ dnumber: d.dnumber, dname: d.dname });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setForm({ dnumber: "", dname: "" });
  };

  const onFormChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  // kaydet (POST/PUT)
  const save = async () => {
    const dnumber = Number(form.dnumber);
    const dname = (form.dname || "").trim();
    if (!dnumber || !dname) {
      alert("Lütfen ID ve Ad alanlarını doldurun.");
      return;
    }

    const isEdit = mode === "edit";
    const url = isEdit
      ? `${API_URL}/api/Departments/${dnumber}`
      : `${API_URL}/api/Departments`;
    const method = isEdit ? "PUT" : "POST";
    const body = JSON.stringify({ dnumber, dname });

    try {
      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body,
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `HTTP ${res.status}`);
      }

      // optimistic update
      if (isEdit) {
        setDepartments((list) =>
          list.map((x) => (x.dnumber === dnumber ? { dnumber, dname } : x))
        );
      } else {
        setDepartments((list) => {
          // aynı dnumber varsa tekrar ekleme
          if (list.some((x) => x.dnumber === dnumber)) return list;
          return [...list, { dnumber, dname }];
        });
      }

      closeForm();
    } catch (e) {
      console.error("Kaydetme hatası:", e);
      alert("Kaydetme hatası: " + e.message);
    }
  };

  // sil
  const remove = async (dnumber) => {
    if (!window.confirm("Bu departmanı silmek istiyor musun?")) return;
    try {
      const res = await fetch(`${API_URL}/api/Departments/${dnumber}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setDepartments((list) => list.filter((x) => x.dnumber !== dnumber));
    } catch (e) {
      console.error("Silme hatası:", e);
      alert("Silme başarısız: " + e.message);
    }
  };

  if (loading) return <p style={{ padding: 16 }}>Yükleniyor…</p>;
  if (err) return <p style={{ color: "red", padding: 16 }}>{err}</p>;

  return (
    <div style={{ padding: 16 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <h2 style={{ margin: 0, marginRight: "auto" }}>Departmanlar</h2>

        <input
          placeholder="Ara (ad veya ID)…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ padding: 6, minWidth: 220 }}
        />

        {isAdmin && (
          <button onClick={openNew} style={{ padding: "6px 10px" }}>
            ➕ Yeni Departman
          </button>
        )}
      </div>

      {/* Ekle/Düzenle formu */}
      {showForm && (
        <div
          style={{
            border: "1px solid #ccc",
            padding: 12,
            borderRadius: 6,
            marginBottom: 14,
            maxWidth: 520,
          }}
        >
          <h3 style={{ marginTop: 0 }}>
            {mode === "edit" ? "Departman Düzenle" : "Yeni Departman Ekle"}
          </h3>

          <div style={{ display: "grid", gap: 10 }}>
            <label>
              ID:
              <input
                type="number"
                name="dnumber"
                value={form.dnumber}
                onChange={onFormChange}
                disabled={mode === "edit"} // editte ID değişmez
                style={{ marginLeft: 8 }}
              />
            </label>

            <label>
              Ad:
              <input
                name="dname"
                value={form.dname}
                onChange={onFormChange}
                style={{ marginLeft: 8 }}
              />
            </label>
          </div>

          <div style={{ marginTop: 12 }}>
            <button onClick={save} style={{ marginRight: 8 }}>
              Kaydet
            </button>
            <button onClick={closeForm}>İptal</button>
          </div>
        </div>
      )}

      {/* Kart grid */}
      {filtered.length === 0 ? (
        <p>Kayıt yok.</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 12,
          }}
        >
          {filtered.map((d) => (
            <div
              key={d.dnumber}
              style={{
                border: "1px solid #ddd",
                borderRadius: 8,
                padding: 12,
                background: "#fafafa",
              }}
            >
              <div
                onClick={() => navigate(`/departments/${d.dnumber}`)}
                style={{ cursor: "pointer" }}
                title="Detaylara git"
              >
                <strong style={{ display: "block", marginBottom: 4 }}>
                  {d.dname}
                </strong>
                <div style={{ color: "#666" }}>ID: {d.dnumber}</div>
              </div>

              {isAdmin && (
                <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                  <button onClick={() => openEdit(d)}>✏️ Düzenle</button>
                  <button
                    onClick={() => remove(d.dnumber)}
                    style={{ color: "red" }}
                  >
                    🗑️ Sil
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}