import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function DepartmentDetails({ token, role }) {
  const { dnumber } = useParams();
  const depNum = Number(dnumber);

  const isAdmin = useMemo(() => role?.toLowerCase() === "admin", [role]);
  const isLeader = useMemo(() => role?.toLowerCase() === "leader", [role]);

  const [department, setDepartment] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Arama & sıralama
  const [q, setQ] = useState("");
  const [sortBy, setSortBy] = useState("name"); // name | id | completion

  // Form
  const [showForm, setShowForm] = useState(false);
  const [mode, setMode] = useState("new"); // new | edit
  const [form, setForm] = useState({
    pnumber: "",
    pname: "",
    start_date: "",
    due_date: "",
    completion_status: 0,
  });

  // Departman & Projeleri yükle
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setErr("");
      try {
        // Departman
        const dRes = await fetch(`${API_URL}/api/Departments/${depNum}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!dRes.ok) throw new Error(`Departman getirilemedi (${dRes.status})`);
        const dep = await dRes.json();
        if (!cancelled) setDepartment(dep);

        // Projeler (tümünü çekip filtrele)
        const pRes = await fetch(`${API_URL}/api/Projects`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!pRes.ok) throw new Error(`Projeler getirilemedi (${pRes.status})`);
        const all = await pRes.json();
        const filtered = (all || []).filter((p) => Number(p.dnumber) === depNum);
        if (!cancelled) setProjects(filtered);
      } catch (e) {
        if (!cancelled) {
          console.error(e);
          setErr(e.message || "Yükleme hatası");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [depNum, token]);

  // Form yardımcıları
  const openNew = () => {
    setMode("new");
    setForm({
      pnumber: "",
      pname: "",
      start_date: "",
      due_date: "",
      completion_status: 0,
    });
    setShowForm(true);
  };

  const openEdit = (p) => {
    setMode("edit");
    setForm({
      pnumber: p.pnumber,
      pname: p.pname || "",
      start_date: (p.start_date || "").slice(0, 10),
      due_date: (p.due_date || "").slice(0, 10),
      completion_status: Number(p.completion_status || 0),
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((x) => ({ ...x, [name]: value }));
  };

  const completionOf = (p) => {
    // Eğer tasks varsa ortalama; yoksa project.completion_status
    if (Array.isArray(p.tasks) && p.tasks.length) {
      const sum = p.tasks.reduce(
        (acc, t) => acc + Number(t.completion_rate || 0),
        0
      );
      return Math.round(sum / p.tasks.length);
    }
    return Math.round(Number(p.completion_status || 0));
  };

  // Kaydet (POST/PUT)
  const save = async () => {
    const body = {
      pnumber: Number(form.pnumber),
      pname: (form.pname || "").trim(),
      start_date: form.start_date || null,
      due_date: form.due_date || null,
      completion_status: Number(form.completion_status || 0),
      dnumber: depNum,
    };

    if (!body.pnumber || !body.pname) {
      alert("Proje Numarası ve Proje Adı zorunludur.");
      return;
    }

    const isEdit = mode === "edit";
    const url = isEdit
      ? `${API_URL}/api/Projects/${body.pnumber}`
      : `${API_URL}/api/Projects`;
    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `HTTP ${res.status}`);
      }

      let saved = null;
      // Bazı PUT endpoint’leri 204 dönebilir; o durumda form verisini baz al.
      if (res.status === 204) {
        saved = body;
      } else {
        try {
          saved = await res.json();
        } catch {
          saved = body;
        }
      }

      setProjects((list) => {
        if (isEdit) {
          return list.map((p) =>
            Number(p.pnumber) === Number(saved.pnumber) ? { ...p, ...saved } : p
          );
        }
        // aynı id eklenmesin
        if (list.some((p) => Number(p.pnumber) === Number(saved.pnumber))) {
          return list;
        }
        return [...list, saved];
      });

      closeForm();
    } catch (e) {
      console.error("Kaydetme hatası:", e);
      alert("Kaydetme hatası: " + e.message);
    }
  };

  const remove = async (pnumber) => {
    if (!window.confirm("Bu projeyi silmek istiyor musunuz?")) return;
    try {
      const res = await fetch(`${API_URL}/api/Projects/${pnumber}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setProjects((list) => list.filter((p) => Number(p.pnumber) !== Number(pnumber)));
    } catch (e) {
      console.error("Silme hatası:", e);
      alert("Silme başarısız: " + e.message);
    }
  };

  // Arama + sıralama
  const view = useMemo(() => {
    const s = q.trim().toLowerCase();
    let arr = projects.filter(
      (p) =>
        String(p.pnumber).includes(s) ||
        (p.pname || "").toLowerCase().includes(s)
    );

    if (sortBy === "name") {
      arr = arr.sort((a, b) => (a.pname || "").localeCompare(b.pname || ""));
    } else if (sortBy === "id") {
      arr = arr.sort((a, b) => Number(a.pnumber) - Number(b.pnumber));
    } else if (sortBy === "completion") {
      arr = arr.sort((a, b) => completionOf(b) - completionOf(a));
    }
    return arr;
  }, [projects, q, sortBy]);

  if (loading) return <p style={{ padding: 16 }}>Yükleniyor…</p>;
  if (err) return <p style={{ color: "red", padding: 16 }}>{err}</p>;
  if (!department) return <h2 style={{ padding: 16 }}>Departman bulunamadı</h2>;

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ marginTop: 0 }}>
        Departman: {department.dname} (ID: {department.dnumber})
      </h2>

      {/* Araç çubuğu */}
      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <input
          placeholder="Proje ara (ad / ID)…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ padding: 6, minWidth: 240 }}
        />

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{ padding: 6 }}
        >
          <option value="name">Ada göre</option>
          <option value="id">ID’ye göre</option>
          <option value="completion">Tamamlanma oranına göre</option>
        </select>

        {(isAdmin || isLeader) && (
          <span style={{ marginLeft: "auto", color: "#666" }}>
            Rol: <b>{isAdmin ? "Admin" : "Leader"}</b>
          </span>
        )}

        {isAdmin && (
          <button onClick={openNew} style={{ marginLeft: "auto" }}>
            ➕ Yeni Proje
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
            maxWidth: 680,
          }}
        >
          <h3 style={{ marginTop: 0 }}>
            {mode === "edit" ? "Projeyi Düzenle" : "Yeni Proje Ekle"}
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
              maxWidth: 680,
            }}
          >
            <label>
              Proje Numarası
              <input
                type="number"
                name="pnumber"
                value={form.pnumber}
                onChange={onChange}
                disabled={mode === "edit"}
                style={{ display: "block", width: "100%" }}
              />
            </label>

            <label>
              Proje Adı
              <input
                name="pname"
                value={form.pname}
                onChange={onChange}
                style={{ display: "block", width: "100%" }}
              />
            </label>

            <label>
              Başlangıç
              <input
                type="date"
                name="start_date"
                value={form.start_date}
                onChange={onChange}
                style={{ display: "block", width: "100%" }}
              />
            </label>

            <label>
              Bitiş
              <input
                type="date"
                name="due_date"
                value={form.due_date}
                onChange={onChange}
                style={{ display: "block", width: "100%" }}
              />
            </label>

            <label>
              Tamamlanma (%)
              <input
                type="number"
                name="completion_status"
                value={form.completion_status}
                onChange={onChange}
                min={0}
                max={100}
                style={{ display: "block", width: "100%" }}
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

      {/* Proje kartları */}
      <h3 style={{ marginTop: 18 }}>Projeler</h3>
      {view.length === 0 ? (
        <p>Henüz proje yok.</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 12,
          }}
        >
          {view.map((p) => {
            const completion = completionOf(p);
            return (
              <div
                key={p.pnumber}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: 8,
                  padding: 12,
                  background: "#fafafa",
                }}
              >
                <Link
                  to={`/departments/${depNum}/projects/${p.pnumber}`}
                  title="Proje detayına git"
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>
                    {p.pname || "İsimsiz Proje"}
                  </div>
                  <div style={{ color: "#666", marginBottom: 8 }}>
                    ID: {p.pnumber}
                  </div>

                  {/* Basit progress */}
                  <div
                    style={{
                      height: 8,
                      background: "#eee",
                      borderRadius: 4,
                      overflow: "hidden",
                      marginBottom: 8,
                    }}
                  >
                    <div
                      style={{
                        width: `${completion}%`,
                        height: "100%",
                        background: "#79c06e",
                      }}
                    />
                  </div>
                  <div style={{ fontSize: 12, color: "#555" }}>
                    Tamamlanma: %{completion}
                  </div>
                </Link>

                {isAdmin && (
                  <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                    <button onClick={() => openEdit(p)}>✏️ Düzenle</button>
                    <button
                      onClick={() => remove(p.pnumber)}
                      style={{ color: "red" }}
                    >
                      🗑️ Sil
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
