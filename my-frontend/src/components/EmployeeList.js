import React, { useEffect, useState, useMemo } from "react";

function EmployeeList() {
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [err, setErr]           = useState("");
  const [q, setQ]               = useState("");

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
      </div>

      {err && <p style={{ color: "red", marginTop: 8 }}>Hata: {err}</p>}

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
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default EmployeeList;
