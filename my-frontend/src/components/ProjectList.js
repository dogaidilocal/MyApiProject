import React, { useEffect, useMemo, useState } from "react";

function ProjectList({ projects, onSelect, isAdmin, onAdd }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    pname: "",
    pnumber: "",
    start_date: "",
    due_date: "",
    completion_status: "",
    dnumber: ""
  });

  // ── Lider ata bloğu için state ───────────────────────────────────────────────
  const [employees, setEmployees] = useState([]);
  const [empQuery, setEmpQuery] = useState("");
  const [selectedEmp, setSelectedEmp] = useState(null);

  // Form açıldığında çalışanları bir kere çek
  useEffect(() => {
    if (!showForm) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    fetch(`${process.env.REACT_APP_API_URL}/api/Employees`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(setEmployees)
      .catch(console.error);
  }, [showForm]);

  const filteredEmployees = useMemo(() => {
    const q = (empQuery || "").toLowerCase();
    return employees
      .filter(e =>
        (e.fname?.toLowerCase().includes(q) || false) ||
        (e.lname?.toLowerCase().includes(q) || false) ||
        (e.ssn?.toLowerCase().includes(q) || false) ||
        (e.SSN?.toLowerCase().includes(q) || false)
      )
      .slice(0, 12);
  }, [employees, empQuery]);

  const employeeId = emp => emp.ssn ?? emp.SSN ?? "";
  const employeeLabel = emp =>
    `${emp.fname ?? ""} ${emp.lname ?? ""}`.trim() +
    (employeeId(emp) ? ` — ${employeeId(emp)}` : "");

  // ── form helpers ────────────────────────────────────────────────────────────
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

  // ── submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Token bulunamadı, lütfen tekrar giriş yapın.");
      return;
    }

    const payload = {
      pnumber: parseInt(form.pnumber),
      pname: form.pname,
      start_date: toUTC(form.start_date),
      due_date: toUTC(form.due_date),
      completion_status: parseInt(form.completion_status),
      dnumber: parseInt(form.dnumber),
      tasks: []
    };

    try {
      // 1) Projeyi oluştur
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/Projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errText = await response.text();
        alert("⚠️ Ekleme hatası: " + (errText || `${response.status} ${response.statusText}`));
        return;
      }

      const created = await response.json();

      // 2) Lider seçildiyse bu proje için lider ata
      if (selectedEmp) {
        const leaderBody = {
          leaderSSN: employeeId(selectedEmp),
          usernameForUserTable: null // kullanıcı tablosu eşleşmesi yoksa null bırakalım
        };

        const assignRes = await fetch(
          `${process.env.REACT_APP_API_URL}/api/ProjectLeaders/project/${created.pnumber}/assign`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(leaderBody)
          }
        );

        if (!assignRes.ok) {
          // Proje oluşturuldu; lider atanamadı ise kullanıcıya bilgi verelim
          const t = await assignRes.text();
          console.warn("Lider atama başarısız:", t);
          alert("Proje oluşturuldu fakat lider atanamadı.");
        }
      }

      // 3) UI state’lerini temizle & üst komponenti bilgilendir
      onAdd(created);
      setShowForm(false);
      setForm({
        pname: "",
        pnumber: "",
        start_date: "",
        due_date: "",
        completion_status: "",
        dnumber: ""
      });
      setSelectedEmp(null);
      setEmpQuery("");

    } catch (err) {
      alert("Bir hata oluştu: " + err.message);
    }
  };

  // ── render ──────────────────────────────────────────────────────────────────
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
            borderRadius: 8
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
              placeholder="Başlangıç (YYYY-MM-DD)"
              value={form.start_date}
              onChange={handleChange}
              required
            /><br />
            <input
              name="due_date"
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
                {filteredEmployees.map(emp => {
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
                  <div style={{ opacity: .7 }}>Sonuç yok</div>
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
              cursor: "pointer"
            }}
          >
            <div>
              <strong>{p.pname || "Proje İsimsiz"}</strong> (ID: {p.pnumber})
              {p.leader && (
                <span style={{ marginLeft: 8, opacity: 0.85 }}>
                  • Lider: {p.leader.fullName ?? p.leader.leaderID}
                </span>
              )}
            </div>
            <div style={{ marginTop: 4, opacity: .75 }}>
              Tamamlanma: %{p.completion_status ?? 0}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProjectList;
