import React, { useState } from "react";

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Token bulunamadı, lütfen tekrar giriş yapın.");
      return;
    }

   const toUTC = (dateStr) => {
  const d = new Date(dateStr);
  // UTC zaman dilimini al
  return d.toISOString(); 
};


    const payload = {
  pnumber: parseInt(form.pnumber),
  pname: form.pname,
  start_date: toUTC(form.start_date),
  due_date: toUTC(form.due_date),
  completion_status: parseInt(form.completion_status),
  dnumber: parseInt(form.dnumber), // sadece ID, obje değil ❗
  tasks: []
};


    try {
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

      const yeni = await response.json();
      onAdd(yeni);
      setShowForm(false);
      setForm({
        pname: "",
        pnumber: "",
        start_date: "",
        due_date: "",
        completion_status: "",
        dnumber: ""
      });
    } catch (err) {
      alert("Bir hata oluştu: " + err.message);
    }
  };

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
            background: "#f7f7f7"
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
            <button type="submit">Ekle</button>
            <button type="button" onClick={() => setShowForm(false)} style={{ marginLeft: "0.5rem" }}>
              İptal
            </button>
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
            {p.pname || "Proje İsimsiz"} (ID: {p.pnumber})
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProjectList;
