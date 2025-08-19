import React, { useEffect, useState } from "react";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function CredentialsAdmin() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = (localStorage.getItem("role") || "").toLowerCase();
    if (role !== "admin") {
      setErr("Bu sayfa sadece adminler içindir.");
      return;
    }
    const load = async () => {
      setLoading(true); setErr("");
      try {
        const res = await fetch(`${API_URL}/api/Users`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : []);
      } catch (e) {
        setErr(e.message || "Yüklenemedi");
      } finally { setLoading(false); }
    };
    load();
  }, []);

  return (
    <div>
      <h2>Kullanıcı Bilgileri (Admin)</h2>
      {err && <p style={{ color: "red" }}>{err}</p>}
      {loading ? (
        <p>Yükleniyor…</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 6 }}>SSN</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 6 }}>Full Name</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 6 }}>Username</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 6 }}>Password</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 6 }}>Role</th>
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
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}


