// my-frontend/src/components/TaskCompletionLogList.js
import React, { useEffect, useState } from "react";

function TaskCompletionLogList() {
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";
  const token = localStorage.getItem("token");

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // --- casing-dostu yardımcılar ---
  const logId = (l) => l.logID ?? l.LogID ?? l.id ?? l.Id;

  const empObj = (l) => l.employee ?? l.Employee ?? null;
  const deptObj = (e) => e?.department ?? e?.Department ?? null;
  const taskObj = (l) => l.task ?? l.Task ?? null;

  const empFname = (e) => e?.fname ?? e?.Fname ?? e?.firstName ?? "";
  const empLname = (e) => e?.lname ?? e?.Lname ?? e?.lastName ?? "";
  const empFullName = (e) => {
    const f = empFname(e);
    const l = empLname(e);
    if (f || l) return `${f} ${l}`.trim();
    return e?.username ?? e?.Username ?? "Unknown";
  };

  const deptName = (d) => d?.dname ?? d?.Dname ?? d?.name ?? d?.Name ?? "Unknown";

  const taskName = (t) =>
    t?.taskName ?? t?.TaskName ?? t?.tname ?? t?.Tname ?? "Unnamed Task";

  const taskStart = (t) =>
    t?.start_date ?? t?.Start_date ?? t?.startDate ?? t?.StartDate ?? null;

  const taskDue = (t) =>
    t?.due_date ?? t?.Due_date ?? t?.end_date ?? t?.End_date ?? t?.dueDate ?? t?.DueDate ?? null;

  const completionFromLogOrTask = (l, t) => {
    const v =
      l?.completionRate ??
      l?.CompletionRate ??
      t?.completion_rate ??
      t?.Completion_rate ??
      t?.rate ??
      t?.Rate;
    const n = Number(v);
    return Number.isFinite(n) ? n : "-";
  };

  const gradeFromLog = (l) => l?.mark ?? l?.Mark ?? "-";

  const fmt = (d) => {
    if (!d) return "?";
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? "?" : dt.toLocaleDateString();
    // isterseniz .toLocaleString() ile saat de gösterebilirsiniz
  };

  const fetchLogs = async () => {
    setLoading(true);
    setErr("");
    try {
      const res = await fetch(`${API_URL}/api/TaskCompletionLogs`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setLogs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching task completion logs:", error);
      setErr("Kayıtlar alınamadı. " + error.message);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="section">
      <h2>Task Completion Records</h2>

      {loading && <p>Loading...</p>}
      {!loading && err && <p style={{ color: "red" }}>{err}</p>}
      {!loading && !err && logs.length === 0 && <p>Kayıt bulunamadı.</p>}

      {!loading && !err && logs.length > 0 && (
        <ul>
          {logs.map((log) => {
            const e = empObj(log);
            const d = deptObj(e);
            const t = taskObj(log);

            return (
              <li key={logId(log)} style={{ marginBottom: "1rem" }}>
                <p>
                  <strong>Employee:</strong> {empFullName(e)} —{" "}
                  <strong>Department:</strong> {deptName(d)}
                </p>
                <p>
                  <strong>Task:</strong> {taskName(t)} (Start: {fmt(taskStart(t))}, End:{" "}
                  {fmt(taskDue(t))})
                </p>
                <p>
                  <strong>Completion:</strong> %{completionFromLogOrTask(log, t)},{" "}
                  <strong>Grade:</strong> {gradeFromLog(log)}
                </p>
                <hr />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default TaskCompletionLogList;