import React, { useEffect, useMemo, useState } from "react";

function ProjectList({ projects, onSelect, isAdmin, onAdd }) {
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    pname: "",
    pnumber: "",
    start_date: "",
    due_date: "",
    completion_status: "",
    dnumber: "",
  });

  // ── Lider ata bloğu ────────────────────────────────────────────────────────
  const [employees, setEmployees] = useState([]);
  const [empQuery, setEmpQuery] = useState("");
  const [selectedEmp, setSelectedEmp] = useState(null);

  // Form açıldığında çalışanları bir kere çek (sadece Authorization header)
  useEffect(() => {
    if (!showForm) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    fetch(`${API_URL}/api/Employees`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error(`Çalışanlar yüklenemedi (${r.status})`);
        return r.json();
      })
      .then(setEmployees)
      .catch((e) => console.error(e));
  }, [showForm, API_URL]);

  const filteredEmployees = useMemo(() => {
    const q = (empQuery || "").toLowerCase();
    return employees
      .filter((e) => {
        const fname = String(e.fname ?? e.Fname ?? "").toLowerCase();
        const lname = String(e.lname ?? e.Lname ?? "").toLowerCase();
        const ssn = String(e.ssn ?? e.SSN ?? "").toLowerCase();
        return (
          (q && fname.includes(q)) || (q && lname.includes(q)) || (q && ssn.includes(q))
        );
      })
      .slice(0, 12);
  }, [employees, empQuery]);

  const employeeId = (emp) => emp.ssn ?? emp.SSN ?? "";
  const employeeLabel = (emp) =>
    `${emp.fname ?? emp.Fname ?? ""} ${emp.lname ?? emp.Lname ?? ""}`.trim() +
    (employeeId(emp) ? ` — ${employeeId(emp)}` : "");

  // ── form helpers ───────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const toUTC = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return d.toISOString(); // UTC
  };

  // Lider atama (1) /project/{pnumber}/assign; olmazsa (2) POST /ProjectLeaders
  const tryAssignLeader = async (project) => {
    try {
      if (!selectedEmp) return true; // lider seçilmemişse atlama
      const token = localStorage.getItem("token");
      const leaderSSN = employeeId(selectedEmp);

      // 1) tercihen assign endpoint'i
      const body1 = { leaderSSN, usernameForUserTable: null };
      const res1 = await fetch(
        `${API_URL}/api/ProjectLeaders/project/${project.pnumber}/assign`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body1),
        }
      );
      if (res1.ok) return true;

      // 2) fallback: doğrudan ProjectLeaders
      const body2 = {
        LeaderSSN: leaderSSN,
        Pnumber: project.pnumber,
        Start_date: new Date().toISOString(),
      };
      const res2 = await fetch(`${API_URL}/api/ProjectLeaders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body2),
      });

      return res2.ok;
    } catch (err) {
      console.error("Leader assign failed:", err);
      // Lider atama başarısız olabilir; projeyi yine de oluşturmuş kabul edelim
      return false;
    }
  };

  // ── submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Token bulunamadı, lütfen tekrar giriş yapın.");
      return;
    }

    const pnumber = parseInt(form.pnumber, 10);
    const dnumber = parseInt(form.dnumber, 10);
    const completion = parseInt(form.completion_status, 10);

    if (!form.pname || Number.isNaN(pnumber) || Number.isNaN(dnumber) || Number.isNaN(completion)) {
      alert("Lütfen tüm alanları eksiksiz ve doğru doldurun.");
      return;
    }

    const payload = {
      Pnumber: pnumber,
      Pname: form.pname,
      Start_date: toUTC(form.start_date),
      Due_date: toUTC(form.due_date),
      Completion_status: completion,
      Dnumber: dnumber,
      Tasks: [],
    };

    try {
      // 1) Projeyi oluştur
      const response = await fetch(`${API_URL}/api/Projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errText = await response.text();
        alert("⚠️ Proje ekleme hatası: " + (errText || `${response.status} ${response.statusText}`));
        return;
      }

      const created = await response.json();

      // 2) Lider seçiliyse ata (başarısız olsa bile devam et)
      const assigned = await tryAssignLeader(created);
      if (!assigned && selectedEmp) {
        console.warn("Lider atanamadı, formda seçilmişti ancak atama başarısız oldu.");
      }

      // 3) UI temizle & üst bileşeni haberdar et
      onAdd && onAdd(created);
      setShowForm(false);
      setForm({
        pname: "",
        pnumber: "",
        start_date: "",
        due_date: "",
        completion_status: "",
        dnumber: "",
      });
      setSelectedEmp(null);
      setEmpQuery("");
    } catch (err) {
      console.error("Project create failed:", err);
      alert("Bir hata oluştu: " + err.message);
    }
  };

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ flex: 1 }}>
      <h2>Proje Listesi</h2>
      {isAdmin && (
        <button onClick={() => setShowForm(true)}>➕ Yeni Proje Ekle</button>
      )}

      {showForm && (
        <div
          style={{
            border: "1px solid #ccc",
            padding: "1rem",
            marginTop: "1rem",
            background: "#f7f7f7",
            borderRadius: 8,
          }}
        >
          <h4>Yeni Proje Bilgileri</h4>
          <form onSubmit={handleSubmit}>
            <input
              name="pname"
              placeholder="Proje İsmi"
              value={form.pname}
              onChange={handleChange}
              required
            /><br />
            <input
              name="pnumber"
              placeholder="Proje No"
              type="number"
              value={form.pnumber}
              onChange={handleChange}
              required
            /><br />
            <input
              name="start_date"
              type="date"
              placeholder="Başlangıç (YYYY-MM-DD)"
              value={form.start_date}
              onChange={handleChange}
              required
            /><br />
            <input
              name="due_date"
              type="date"
              placeholder="Bitiş (YYYY-MM-DD)"
              value={form.due_date}
              onChange={handleChange}
              required
            /><br />
            <input
              name="completion_status"
              placeholder="Tamamlanma Oranı (%)"
              type="number"
              value={form.completion_status}
              onChange={handleChange}
              required
            /><br />
            <input
              name="dnumber"
              placeholder="Departman No"
              type="number"
              value={form.dnumber}
              onChange={handleChange}
              required
            /><br />

            {/* ── Lider Ata Bloğu ───────────────────────────────────────── */}
            <div style={{ marginTop: "1rem", paddingTop: ".75rem", borderTop: "1px solid #ddd" }}>
              <strong>Proje Lideri Ata (opsiyonel)</strong>
              <div style={{ marginTop: ".5rem" }}>
                <input
                  placeholder="İsim / Soyisim / SSN ara…"
                  value={empQuery}
                  onChange={(e) => setEmpQuery(e.target.value)}
                  style={{ width: 320 }}
                />
              </div>
              <div style={{ maxHeight: 180, overflow: "auto", marginTop: ".5rem" }}>
                {filteredEmployees.map((emp) => {
                  const id = employeeId(emp);
                  return (
                    <label key={id} style={{ display: "block", cursor: "pointer" }}>
                      <input
                        type="radio"
                        name="leaderPick"
                        checked={selectedEmp ? employeeId(selectedEmp) === id : false}
                        onChange={() => setSelectedEmp(emp)}
                      />{" "}
                      {employeeLabel(emp)}
                    </label>
                  );
                })}
                {filteredEmployees.length === 0 && (
                  <div style={{ opacity: 0.7 }}>Sonuç yok</div>
                )}
              </div>
            </div>

            <div style={{ marginTop: ".75rem" }}>
              <button type="submit">Ekle</button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setSelectedEmp(null);
                  setEmpQuery("");
                }}
                style={{ marginLeft: "0.5rem" }}
              >
                İptal
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={{ marginTop: "1rem" }}>
        {projects.map((p) => (
          <div
            key={p.pnumber}
            onClick={() => onSelect(p)}
            style={{
              padding: "1rem",
              marginBottom: "0.5rem",
              background: "#fff",
              borderRadius: "8px",
              boxShadow: "0 0 4px rgba(0,0,0,0.1)",
              cursor: "pointer",
            }}
          >
            <div>
              <strong>{p.pname || "Proje İsimsiz"}</strong> (ID: {p.pnumber})
              {p.leader && (
                <span style={{ marginLeft: 8, opacity: 0.85 }}>
                  • Lider: {p.leader.fullName ?? p.leader.leaderID ?? "—"}
                </span>
              )}
            </div>
            <div style={{ marginTop: 4, opacity: 0.75 }}>
              Tamamlanma: %{p.completion_status ?? 0}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProjectList;
