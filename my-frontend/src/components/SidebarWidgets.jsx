import React from "react";

export default function SidebarWidgets({ employees = [], departments = [], loading = {} }) {
  return (
    <div style={{ width: 320 }}>
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 12,
          boxShadow: "0 1px 3px rgba(0,0,0,.08)",
          marginBottom: 16,
        }}
      >
        <h4 style={{ margin: 0, marginBottom: 8 }}>Departmanlar</h4>
        {loading.departments ? (
          <div>Yükleniyor…</div>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 16 }}>
            {departments.slice(0, 6).map((d) => (
              <li key={d.dnumber}>{d.dname}</li>
            ))}
          </ul>
        )}
      </div>

      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 12,
          boxShadow: "0 1px 3px rgba(0,0,0,.08)",
        }}
      >
        <h4 style={{ margin: 0, marginBottom: 8 }}>Çalışanlar</h4>
        {loading.employees ? (
          <div>Yükleniyor…</div>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 16 }}>
            {employees.slice(0, 8).map((e) => (
              <li key={e.ssn}>
                {(e.fname || "") + " " + (e.lname || "")}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}