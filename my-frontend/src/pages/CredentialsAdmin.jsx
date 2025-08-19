import React, { useEffect, useState } from "react";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function CredentialsAdmin() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    username: "",
    password: "",
    role: "",
    ssn: "",
    fullName: "",
    departmentName: ""
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = (localStorage.getItem("role") || "").toLowerCase();
    console.log("Current role:", role, "Token:", token ? "exists" : "missing");
    
    if (role !== "admin") {
      setErr("Bu sayfa sadece adminler içindir.");
      return;
    }
    
    const load = async () => {
      setLoading(true); setErr("");
      try {
        // Debug: Check user info first
        const debugRes = await fetch(`${API_URL}/api/Users/debug-user`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (debugRes.ok) {
          const debugData = await debugRes.json();
          console.log("Debug user info:", debugData);
        }

        // Debug: Check all users
        const debugAllRes = await fetch(`${API_URL}/api/Users/debug-all-users`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (debugAllRes.ok) {
          const debugAllData = await debugAllRes.json();
          console.log("Debug all users:", debugAllData);
        }
        
        const res = await fetch(`${API_URL}/api/Users`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!res.ok) {
          const errorText = await res.text();
          console.error("Users fetch failed:", res.status, errorText);
          throw new Error(errorText);
        }
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Load error:", e);
        setErr(e.message || "Yüklenemedi");
      } finally { setLoading(false); }
    };
    load();
  }, []);

  // Auto-refresh every 5 seconds to see role changes
  useEffect(() => {
    const interval = setInterval(() => {
      const token = localStorage.getItem("token");
      const role = (localStorage.getItem("role") || "").toLowerCase();
      if (role === "admin" && !loading) {
        fetch(`${API_URL}/api/Users`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        })
        .then(res => res.ok ? res.json() : [])
        .then(data => setUsers(Array.isArray(data) ? data : []))
        .catch(() => {}); // Silent refresh
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [loading]);

  const refreshData = () => {
    const token = localStorage.getItem("token");
    setLoading(true);
    fetch(`${API_URL}/api/Users`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
    .then(res => res.ok ? res.json() : [])
    .then(data => setUsers(Array.isArray(data) ? data : []))
    .catch(e => setErr(e.message || "Yüklenemedi"))
    .finally(() => setLoading(false));
  };

  const startEdit = (user) => {
    console.log("Editing user:", user); // Debug log
    console.log("User fields:", {
      username: user.Username || user.username,
      password: user.PasswordHash || user.passwordHash,
      role: user.Role || user.role,
      ssn: user.SSN || user.ssn,
      fullName: user.FullName || user.fullName,
      departmentName: user.DepartmentName || user.departmentName
    });
    setEditingUser(user);
    setEditForm({
      username: user.Username || user.username || "",
      password: user.PasswordHash || user.passwordHash || "",
      role: user.Role || user.role || "",
      ssn: user.SSN || user.ssn || "",
      fullName: user.FullName || user.fullName || "",
      departmentName: user.DepartmentName || user.departmentName || ""
    });
  };

  const cancelEdit = () => {
    setEditingUser(null);
    setEditForm({
      username: "",
      password: "",
      role: "",
      ssn: "",
      fullName: "",
      departmentName: ""
    });
  };

  const saveEdit = async () => {
    const token = localStorage.getItem("token");
    try {
      const originalUsername = editingUser?.Username || editingUser?.username || editForm.username;
      const originalSSN = editingUser?.SSN || editingUser?.ssn || editForm.ssn;

      console.log("Saving user:", {
        originalUsername,
        newUsername: editForm.username,
        password: editForm.password,
        role: editForm.role
      });

      // Update user credentials
      const userRes = await fetch(`${API_URL}/api/Users/${encodeURIComponent(originalUsername)}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: editForm.username,
          password: editForm.password,
          role: editForm.role
        }),
      });

      if (!userRes.ok) {
        const errorText = await userRes.text();
        console.error("User update failed:", userRes.status, errorText);
        throw new Error(`Kullanıcı güncellenemedi: ${errorText}`);
      }

      // Update employee data if SSN changed
      if (originalSSN && originalSSN !== editForm.ssn) {
        const employeeRes = await fetch(`${API_URL}/api/Employees/${encodeURIComponent(originalSSN)}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ssn: editForm.ssn,
            fname: editForm.fullName.split(" ")[0] || "",
            lname: editForm.fullName.split(" ").slice(1).join(" ") || "",
            dno: 1 // Default department, you might want to make this editable
          }),
        });

        if (!employeeRes.ok) {
          console.warn("Çalışan bilgileri güncellenemedi");
        }
      }

      alert("Kullanıcı başarıyla güncellendi!");
      cancelEdit();
      refreshData();
    } catch (error) {
      alert("Güncelleme hatası: " + error.message);
    }
  };

  const handleEditFormChange = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

    return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Kullanıcı Bilgileri (Admin)</h2>
        <button onClick={refreshData} disabled={loading} style={{ padding: "6px 12px" }}>
          {loading ? "Yükleniyor..." : "🔄 Yenile"}
        </button>
      </div>
      {err && <p style={{ color: "red" }}>{err}</p>}
      {loading ? (
        <p>Yükleniyor…</p>
      ) : (
        <>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 6 }}>SSN</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 6 }}>İsim Soyisim</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 6 }}>Username</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 6 }}>Password</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 6 }}>Role</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 6 }}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={i}>
                  <td style={{ borderBottom: "1px solid #eee", padding: 6 }}>{u.SSN ?? u.ssn ?? "—"}</td>
                  <td style={{ borderBottom: "1px solid #eee", padding: 6 }}>{u.FullName ?? "—"}</td>
                  <td style={{ borderBottom: "1px solid #eee", padding: 6 }}>{u.Username ?? u.username}</td>
                  <td style={{ borderBottom: "1px solid #eee", padding: 6 }}>{u.PasswordHash ?? u.passwordHash}</td>
                  <td style={{ borderBottom: "1px solid #eee", padding: 6 }}>{u.Role ?? u.role}</td>
                  <td style={{ borderBottom: "1px solid #eee", padding: 6 }}>
                    <button 
                      onClick={() => startEdit(u)}
                      style={{ 
                        padding: "4px 8px", 
                        fontSize: "12px", 
                        backgroundColor: "#007bff", 
                        color: "white", 
                        border: "none", 
                        borderRadius: "4px",
                        cursor: "pointer"
                      }}
                    >
                      ✏️ Düzenle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {editingUser && (
            <div style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000
            }}>
              <div style={{
                backgroundColor: "white",
                padding: "20px",
                borderRadius: "8px",
                minWidth: "400px",
                maxWidth: "600px"
              }}>
                <h3 style={{ marginTop: 0 }}>Kullanıcı Düzenle</h3>
                
                <div style={{ display: "grid", gap: "12px", marginBottom: "20px" }}>
                  <label>
                    Username:
                    <input
                      type="text"
                      value={editForm.username}
                      onChange={(e) => handleEditFormChange("username", e.target.value)}
                      style={{ display: "block", width: "100%", padding: "8px", marginTop: "4px" }}
                    />
                  </label>
                  
                  <label>
                    Password:
                    <input
                      type="text"
                      value={editForm.password}
                      onChange={(e) => handleEditFormChange("password", e.target.value)}
                      style={{ display: "block", width: "100%", padding: "8px", marginTop: "4px" }}
                    />
                  </label>
                  
                  <label>
                    Role:
                    <select
                      value={editForm.role}
                      onChange={(e) => handleEditFormChange("role", e.target.value)}
                      style={{ display: "block", width: "100%", padding: "8px", marginTop: "4px" }}
                    >
                      <option value="employee">Employee</option>
                      <option value="Leader">Leader</option>
                      <option value="admin">Admin</option>
                    </select>
                  </label>
                  
                  <label>
                    SSN:
                    <input
                      type="text"
                      value={editForm.ssn}
                      onChange={(e) => handleEditFormChange("ssn", e.target.value)}
                      style={{ display: "block", width: "100%", padding: "8px", marginTop: "4px" }}
                    />
                  </label>
                  
                  <label>
                    İsim Soyisim:
                    <input
                      type="text"
                      value={editForm.fullName}
                      onChange={(e) => handleEditFormChange("fullName", e.target.value)}
                      style={{ display: "block", width: "100%", padding: "8px", marginTop: "4px" }}
                    />
                  </label>
                  
                  <label>
                    Departman:
                    <input
                      type="text"
                      value={editForm.departmentName}
                      onChange={(e) => handleEditFormChange("departmentName", e.target.value)}
                      style={{ display: "block", width: "100%", padding: "8px", marginTop: "4px" }}
                    />
                  </label>
                </div>
                
                <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                  <button 
                    onClick={cancelEdit}
                    style={{ 
                      padding: "8px 16px", 
                      backgroundColor: "#6c757d", 
                      color: "white", 
                      border: "none", 
                      borderRadius: "4px",
                      cursor: "pointer"
                    }}
                  >
                    İptal
                  </button>
                  <button 
                    onClick={saveEdit}
                    style={{ 
                      padding: "8px 16px", 
                      backgroundColor: "#28a745", 
                      color: "white", 
                      border: "none", 
                      borderRadius: "4px",
                      cursor: "pointer"
                    }}
                  >
                    Kaydet
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
 }


