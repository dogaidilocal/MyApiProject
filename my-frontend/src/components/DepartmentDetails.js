import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";

const DepartmentDetails = ({ token, role }) => {
  const { dnumber } = useParams();
  const depNum = parseInt(dnumber, 10);
  const isAdmin = role?.toLowerCase() === "admin";

  const [department, setDepartment] = useState(null);
  const [localProjects, setLocalProjects] = useState([]);
  const [editingProject, setEditingProject] = useState(null);
  const [formData, setFormData] = useState({});
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const fetchDepartmentAndProjects = async () => {
      try {
        const depRes = await fetch(`${process.env.REACT_APP_API_URL}/api/Departments/${depNum}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!depRes.ok) throw new Error("Departman getirilemedi");
        const depData = await depRes.json();
        setDepartment(depData);

        const projRes = await fetch(`${process.env.REACT_APP_API_URL}/api/Projects`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!projRes.ok) throw new Error("Projeler getirilemedi");
        const projData = await projRes.json();
        const filteredProjects = projData.filter(p => p.dnumber === depNum);
        setLocalProjects(filteredProjects);
      } catch (err) {
        console.error("Hata:", err);
      }
    };

    fetchDepartmentAndProjects();
  }, [depNum, token]);

  const handleEdit = proj => {
    setEditingProject(proj);
    setFormData({
      pnumber: proj.pnumber, // pnumber alanı düzenlemeye eklendi
      pname: proj.pname,
      start_date: proj.start_date?.slice(0, 10),
      due_date: proj.due_date?.slice(0, 10),
      completion_status: proj.completion_status,
      dnumber: proj.dnumber,
    });
    setShowForm(true);
  };

  const handleNew = () => {
    setEditingProject(null);
    setFormData({
      pnumber: "", // yeni ekleme için boş pnumber
      pname: "",
      start_date: "",
      due_date: "",
      completion_status: 0,
      dnumber: depNum,
    });
    setShowForm(true);
  };

  const handleDelete = async pnumber => {
    if (!window.confirm("Silmek istediğinize emin misiniz?")) return;

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/Projects/${pnumber}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setLocalProjects(prev => prev.filter(p => p.pnumber !== pnumber));
      } else {
        alert("Silme başarısız");
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const handleSave = async () => {
    const editing = Boolean(editingProject);
    const method = editing ? "PUT" : "POST";
    const url = editing
      ? `${process.env.REACT_APP_API_URL}/api/Projects/${editingProject.pnumber}`
      : `${process.env.REACT_APP_API_URL}/api/Projects`;

    const body = {
      ...formData,
      pnumber: parseInt(formData.pnumber),
      dnumber: depNum,
      completion_status: parseInt(formData.completion_status)
    };

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        setLocalProjects(prev =>
          editing ? prev.map(p => p.pnumber === data.pnumber ? data : p) : [...prev, data]
        );
        setShowForm(false);
        setEditingProject(null);
      } else {
        alert("Hata: " + await res.text());
      }
    } catch (err) {
      console.error("Save error:", err);
    }
  };

  const handleChange = e =>
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  if (!department) return <h2>Departman bulunamadı</h2>;

  return (
    <div>
      <h2>Departman: {department.dname} (ID: {department.dnumber})</h2>

      {isAdmin && !showForm && (
        <button onClick={handleNew}>➕ Yeni Proje</button>
      )}

      {showForm && (
        <div style={{ marginTop: "1rem", border: "1px solid #888", padding: "1rem" }}>
          <h3>{editingProject ? "Projeyi Düzenle" : "Yeni Proje Ekle"}</h3>
          <label>
            Proje Numarası:
            <input
              type="number"
              name="pnumber"
              value={formData.pnumber}
              onChange={handleChange}
              required
              disabled={editingProject !== null} // sadece yeni proje eklerken düzenlenebilir
            />
          </label>
          <br />
          <label>
            Proje Adı:
            <input name="pname" value={formData.pname} onChange={handleChange} />
          </label>
          <br />
          <label>
            Başlangıç Tarihi:
            <input type="date" name="start_date" value={formData.start_date} onChange={handleChange} />
          </label>
          <br />
          <label>
            Bitiş Tarihi:
            <input type="date" name="due_date" value={formData.due_date} onChange={handleChange} />
          </label>
          <br />
          <label>
            Tamamlanma (%):
            <input
              type="number"
              name="completion_status"
              value={formData.completion_status}
              onChange={handleChange}
            />
          </label>
          <br />
          <button onClick={handleSave}>Kaydet</button>
          <button onClick={() => setShowForm(false)}>İptal</button>
        </div>
      )}

      <h3>Projeler</h3>
      {localProjects.length === 0 ? (
        <p>Henüz proje yok</p>
      ) : (
        <ul>
          {localProjects.map(p => (
            <li key={p.pnumber} style={{ marginBottom: "0.8rem" }}>
              <Link to={`/departments/${depNum}/projects/${p.pnumber}`}>
                <strong>{p.pname}</strong> (ID: {p.pnumber})
              </Link>{" "}
              — Tamamlanma: %{
                Math.round(
                  p.tasks?.length
                    ? p.tasks.reduce((s, t) => s + (t.completion_rate || 0), 0) / p.tasks.length
                    : p.completion_status || 0
                )
              }
              {isAdmin && (
                <>
                  <button onClick={() => handleEdit(p)} style={{ marginLeft: "1rem" }}>✏️</button>
                  <button onClick={() => handleDelete(p.pnumber)}>🗑️</button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default DepartmentDetails;
