import React, { useEffect, useState } from "react";

function AssignmentLogList() {
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // --- küçük yardımcılar: farklı casing'lere dayanıklı alan okuyucular ---
  const asDate = (v) => (v ? new Date(v) : null);
  const fmtDate = (v) => (asDate(v) ? asDate(v).toLocaleDateString() : "—");

  const getEmployee = (log) => log.Employee ?? log.employee ?? {};
  const getTask     = (log) => log.Task ?? log.task ?? {};
  const getDept     = (emp) => emp.Department ?? emp.department ?? {};

  const getId   = (log) => log.LogID ?? log.logID ?? log.id ?? undefined;
  const fName   = (emp) => emp.Fname ?? emp.fname ?? emp.firstName ?? "";
  const lName   = (emp) => emp.Lname ?? emp.lname ?? emp.lastName ?? "";
  const deptNm  = (dep) => dep.Dname ?? dep.dname ?? dep.name ?? "Unknown";
  const taskNm  = (tsk) => tsk.TaskName ?? tsk.taskName ?? tsk.name ?? "Unnamed Task";
  const startDt = (tsk) => tsk.Start_date ?? tsk.start_date ?? tsk.startDate ?? null;
  const dueDt   = (tsk) => tsk.Due_date ?? tsk.due_date ?? tsk.dueDate ?? null;
  const compl   = (tsk) => tsk.Completion_rate ?? tsk.completion_rate ?? tsk.completion ?? "-";

  const fetchAssignmentLogs = async (signal) => {
    setLoading(true);
    setErr("");
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${API_URL}/api/AssignmentLogs`, {
        method: "GET",
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
      setLogs(data);
    } catch (e) {
      if (e.name !== "AbortError") {
        console.error("AssignmentLogs fetch error:", e);
        setErr(e.message || "Veri alınamadı.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchAssignmentLogs(controller.signal);
    return () => controller.abort();
    // API_URL bağımlı—env değişirse yeniden çeker
  }, [API_URL]);

  return (
    <div className="section">
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <h2 style={{ margin: 0 }}>Assignment Logs</h2>
        <button
          onClick={() => fetchAssignmentLogs()}
          disabled={loading}
          style={{ padding: "4px 10px" }}
        >
          {loading ? "Yükleniyor..." : "↻ Yenile"}
        </button>
      </div>

      {err && <p style={{ color: "red", marginTop: 8 }}>Hata: {err}</p>}

      {!loading && !err && (
        <>
          {logs.length === 0 ? (
            <p>Listelenecek kayıt yok.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, marginTop: 12 }}>
              {logs.map((raw) => {
                const id  = getId(raw);
                const emp = getEmployee(raw);
                const tsk = getTask(raw);
                const dep = getDept(emp);

                return (
                  <li
                    key={id ?? Math.random()}
                    style={{
                      border: "1px solid #e5e5e5",
                      borderRadius: 8,
                      padding: "12px 14px",
                      marginBottom: 10,
                      background: "#fafafa",
                    }}
                  >
                    <p style={{ margin: 0 }}>
                      <strong>Employee:</strong>{" "}
                      {(fName(emp) || lName(emp)) ? `${fName(emp)} ${lName(emp)}`.trim() : "Unknown"}{" "}
                      — <strong>Department:</strong> {deptNm(dep)}
                    </p>

                    <p style={{ margin: "6px 0 0" }}>
                      <strong>Task:</strong> {taskNm(tsk)}{" "}
                      <span style={{ opacity: 0.8 }}>
                        {`(Start: ${fmtDate(startDt(tsk))}, End: ${fmtDate(dueDt(tsk))})`}
                      </span>
                    </p>

                    <p style={{ margin: "6px 0 0" }}>
                      <strong>Completion:</strong> %{compl(tsk)}{" "}
                      <span style={{ opacity: 0.7 }}>(LogID: {id ?? "—"})</span>
                    </p>
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

export default AssignmentLogList;
