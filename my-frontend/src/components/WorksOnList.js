// my-frontend/src/components/WorksOnList.js
import React, { useEffect, useState } from "react";

function WorksOnList() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
  const token = localStorage.getItem("token") || "";

  const toDate = (v) => {
    if (!v) return null;
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d.toLocaleDateString();
  };

  const fetchWorksOn = async () => {
    setLoading(true);
    setErr("");
    try {
      const res = await fetch(`${API_URL}/api/WorksOn`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `API ${res.status} hatası`);
      }
      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error("API JSON formatında cevap vermedi.");
      }
      setRecords(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("WorksOn fetch error:", e);
      setErr(e.message || "Kayıtlar alınamadı.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorksOn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="section">
      <h2>Work Assignments</h2>

      {loading && <p>Yükleniyor…</p>}
      {err && <p style={{ color: "red" }}>Hata: {err}</p>}

      {!loading && !err && (
        <>
          {records.length === 0 ? (
            <p>Kayıt bulunamadı.</p>
          ) : (
            <ul>
              {records.map((raw, i) => {
                const item = raw || {};

                // Employee normalize
                const emp = item.Employee ?? item.employee ?? {};
                const fname = emp.Fname ?? emp.fname ?? "";
                const lname = emp.Lname ?? emp.lname ?? "";
                const dept = emp.Department ?? emp.department ?? {};
                const deptName = dept.Dname ?? dept.dname ?? "Unknown";

                // Project normalize
                const proj = item.Project ?? item.project ?? {};
                const pname = proj.Pname ?? proj.pname ?? "Unknown";
                const pStart =
                  proj.Start_date ?? proj.start_date ?? proj.StartDate ?? proj.startDate ?? null;
                const pDue =
                  proj.Due_date ?? proj.due_date ?? proj.End_date ?? proj.end_date ?? null;
                const pComp =
                  proj.Completion_status ?? proj.completion_status ?? "-";

                // Key için SSN+Pnumber veya fallback index
                const ssn = item.SSN ?? item.ssn ?? emp.SSN ?? emp.ssn ?? "";
                const pnum = item.Pnumber ?? item.pnumber ?? proj.Pnumber ?? proj.pnumber ?? "";
                const key = `${ssn}-${pnum}-${i}`;

                return (
                  <li key={key} style={{ marginBottom: "1rem" }}>
                    <p>
                      <strong>Employee:</strong> {fname} {lname} —{" "}
                      <strong>Department:</strong> {deptName}
                    </p>
                    <p>
                      <strong>Project:</strong> {pname} (Start:{" "}
                      {toDate(pStart) ?? "?"}, End: {toDate(pDue) ?? "?"})
                    </p>
                    <p>
                      <strong>Completion:</strong> %{Number.isFinite(+pComp) ? +pComp : "-"}
                    </p>
                    <hr />
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

export default WorksOnList;
