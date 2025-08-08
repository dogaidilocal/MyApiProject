import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function DepartmentList({ token, role }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const isAdmin = role?.toLowerCase() === "admin";

  const [departments, setDepartments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState("new"); // "edit" or "new"
  const [formData, setFormData] = useState({ dname: "", dnumber: "" });

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/api/Departments`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error(`Departmanlar alınamadı. Hata kodu: ${res.status}`);
        }

        const data = await res.json();
        setDepartments(data);
      } catch (err) {
        console.error("Departman çekme hatası:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDepartments();
  }, [token]);

  const openNewForm = () => {
    setFormData({ dname: "", dnumber: "" });
    setFormMode("new");
    setShowForm(true);
  };

  const openEditForm = (dept) => {
    setFormData({ dname: dept.dname, dnumber: dept.dnumber });
    setFormMode("edit");
    setShowForm(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    const { dname, dnumber } = formData;
    if (!dname || !dnumber) return alert("Boş alan bırakmayın");

    const url = `${process.env.REACT_APP_API_URL}/api/Departments${formMode === "edit" ? `/${dnumber}` : ""}`;
    const method = formMode === "edit" ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        alert(formMode === "edit" ? "Güncellendi ✏️" : "Departman eklendi ✔️");
        window.location.reload();
      } else {
        alert(await res.text());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Departmanı silmek istiyor musun?")) return;

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/Departments/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        alert("Silindi 🗑️");
        window.location.reload();
      } else {
        alert("Silme başarısız ❌");
      }
    } catch (err) {
      console.error("DELETE error:", err);
    }
  };

  return (
    <div>
      <h2>Departmanlar</h2>

      {isAdmin && (
        <button onClick={openNewForm} style={{ marginBottom: "1rem" }}>
          ➕ Yeni Departman
        </button>
      )}

      {showForm && (
        <div style={{ marginBottom: "1rem", border: "1px solid #888", padding: "1rem" }}>
          <h3>{formMode === "edit" ? "Departman Düzenle" : "Yeni Departman Ekle"}</h3>
          <label>
            Adı:{" "}
            <input name="dname" value={formData.dname} onChange={handleChange} />
          </label>
          <br />
          <label>
            ID:{" "}
            <input
              name="dnumber"
              value={formData.dnumber}
              onChange={handleChange}
              disabled={formMode === "edit"}
              type="number"
            />
          </label>
          <br />
          <button onClick={handleSubmit}>Kaydet ✅</button>
          <button onClick={() => setShowForm(false)}>İptal</button>
        </div>
      )}

      <hr />

      {loading ? (
        <p>Yükleniyor...</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {departments.map((d) => (
            <li
              key={d.dnumber}
              style={{
                cursor: "pointer",
                padding: "0.8rem",
                marginBottom: "0.5rem",
                background: "#f0f0f0",
                borderRadius: "4px",
              }}
            >
              <div onClick={() => navigate(`/departments/${d.dnumber}`)}>
                <strong>{d.dname}</strong> (ID: {d.dnumber})
              </div>

              {isAdmin && (
                <div style={{ marginTop: "0.3rem" }}>
                  <button
                    onClick={() => openEditForm(d)}
                    style={{ marginRight: "0.5rem" }}
                  >
                    ✏️ Düzenle
                  </button>
                  <button
                    onClick={() => handleDelete(d.dnumber)}
                    style={{ color: "red" }}
                  >
                    🗑️ Sil
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default DepartmentList;
