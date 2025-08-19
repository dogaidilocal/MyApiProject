import React, { useEffect, useState, useMemo } from "react";

function EmployeeList() {
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [err, setErr]           = useState("");
  const [q, setQ]               = useState("");

  const role = (localStorage.getItem("role") || "").toLowerCase();
  const isAdmin = role === "admin";

  // --- casing-dostu yardımcılar ---
  const getId   = (e) => e.SSN ?? e.ssn ?? e.id ?? e.userId ?? e.userid;
  const fName   = (e) => e.Fname ?? e.fname ?? e.firstName ?? "";
  const lName   = (e) => e.Lname ?? e.lname ?? e.lastName ?? "";
  const dno     = (e) => e.Dno ?? e.dno ?? e.departmentId ?? e.departmentID ?? null;
  const deptObj = (e) => e.Department ?? e.department ?? null;
  const deptNm  = (e) => {
    const d = deptObj(e);
    return d ? (d.Dname ?? d.dname ?? d.name ?? `#${dno(e) ?? "—"}`) : (dno(e) ?? "—");
  };

  const fetchEmployees = async (signal) => {
    setLoading(true);
    setErr("");

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/Employees`, {
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        signal,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`API ${res.status}: ${text || "İstek başarısız"}`);
      }

      const data = await res.json();
      if (!Array.isArray(data)) {
        throw new Error("API beklenen formatta bir liste döndürmedi.");
      }
      setEmployees(data);
    } catch (e) {
      if (e.name !== "AbortError") {
        console.error("Employees fetch error:", e);
        setErr(e.message || "Çalışanlar yüklenemedi.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchEmployees(controller.signal);
    return () => controller.abort();
  }, [API_URL]);

  // arama filtresi (ad/soyad/SSN)
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return employees;
    return employees.filter((e) => {
      const parts = [fName(e), lName(e), String(getId(e) ?? "")].map((x) =>
        String(x).toLowerCase()
      );
      return parts.some((p) => p.includes(s));
    });
  }, [employees, q]);

  // ---- Admin form state ----
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ SSN: "", Fname: "", Lname: "", Dno: "", Username: "", Password: "" });

  const openNew = () => {
    setForm({ SSN: "", Fname: "", Lname: "", Dno: "", Username: "", Password: "" });
    setShowForm(true);
  };
  const onChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const createEmployee = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/api/Employees`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          SSN: form.SSN,
          Fname: form.Fname,
          Lname: form.Lname,
          Dno: Number(form.Dno || 0),
          Username: form.Username || form.Fname?.toLowerCase(),
          Password: form.Password || undefined,
        }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `HTTP ${res.status}`);
      }
      const created = await res.json();
      await fetchEmployees();
      setShowForm(false);
      // Admin’e oluşturulan bilgiler için bildirim
      alert(`Kullanıcı oluşturuldu\nSSN: ${created.SSN}\nUsername: ${created.Username}\nŞifre: ${created.Password}\nRol: ${created.Role}`);
    } catch (e) {
      alert("Ekleme hatası: " + e.message);
    }
  };

  const deleteEmployee = async (ssn) => {
    if (!window.confirm("Bu çalışan silinsin mi?")) return;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/api/Employees/${ssn}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await fetchEmployees();
    } catch (e) {
      alert("Silme hatası: " + e.message);
    }
  };

  return (
    <div className="section">
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <h2 style={{ margin: 0 }}>Çalışanlar</h2>
        <input
          placeholder="Ara (ad, soyad, SSN)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ padding: "6px 8px", minWidth: 220 }}
        />
        <button onClick={() => fetchEmployees()} disabled={loading} style={{ padding: "6px 10px" }}>
          {loading ? "Yükleniyor..." : "↻ Yenile"}
        </button>
        {isAdmin && (
          <button onClick={openNew} style={{ marginLeft: 8 }}>+ Yeni Çalışan</button>
        )}
      </div>

      {err && <p style={{ color: "red", marginTop: 8 }}>Hata: {err}</p>}

      {isAdmin && showForm && (
        <div style={{ marginTop: 12, border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
          <h3 style={{ marginTop: 0 }}>Yeni Çalışan Ekle</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <label>SSN<input name="SSN" value={form.SSN} onChange={onChange} /></label>
            <label>Ad<input name="Fname" value={form.Fname} onChange={onChange} /></label>
            <label>Soyad<input name="Lname" value={form.Lname} onChange={onChange} /></label>
            <label>Departman No<input name="Dno" type="number" value={form.Dno} onChange={onChange} /></label>
            <label>Kullanıcı Adı<input name="Username" value={form.Username} onChange={onChange} placeholder="Boş bırakırsan ad'dan üretir" /></label>
            <label>Şifre<input name="Password" value={form.Password} onChange={onChange} placeholder="Boş bırakırsan otomatik" /></label>
          </div>
          <div style={{ marginTop: 10 }}>
            <button onClick={createEmployee} style={{ marginRight: 8 }}>Kaydet</button>
            <button onClick={() => setShowForm(false)}>İptal</button>
          </div>
        </div>
      )}

      {!err && !loading && filtered.length === 0 && (
        <p style={{ marginTop: 12 }}>Kayıt bulunamadı.</p>
      )}

      {!err && (
        <ul style={{ listStyle: "none", padding: 0, marginTop: 12 }}>
          {filtered.map((e) => (
            <li
              key={getId(e) ?? Math.random()}
              style={{
                border: "1px solid #e5e5e5",
                borderRadius: 8,
                padding: "10px 12px",
                marginBottom: 8,
                background: "#fafafa",
              }}
            >
              <strong>
                {`${fName(e)} ${lName(e)}`.trim() || "İsimsiz"}
              </strong>{" "}
              — SSN: {getId(e) ?? "—"} — Departman: {deptNm(e)}
              {isAdmin && (
                <span style={{ float: "right" }}>
                  <button onClick={() => deleteEmployee(getId(e))} style={{ color: "red" }}>Sil</button>
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default EmployeeList;
