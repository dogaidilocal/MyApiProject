// my-frontend/src/components/TaskList.js
import React, { useEffect, useState } from "react";

function TaskList() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";
  const token = localStorage.getItem("token") || "";

  const toDate = (v) => {
    if (!v) return null;
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d.toLocaleDateString();
  };

  const fetchTasks = async () => {
    setLoading(true);
    setErr("");
    try {
      const res = await fetch(`${API_URL}/api/Tasks`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `API ${res.status} hatası`);
      }

      // Bazı durumlarda API plain-text dönerse hata önlemi:
      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error("API JSON formatında cevap vermedi.");
      }

      setTasks(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Tasks fetch error:", e);
      setErr(e.message || "Görevler alınamadı.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <div className="section"><p>Yükleniyor…</p></div>;
  if (err) return <div className="section"><p style={{color:"red"}}>Hata: {err}</p></div>;

  if (!tasks.length) {
    return (
      <div className="section">
        <h2>Task List</h2>
        <p>Kayıt bulunamadı.</p>
      </div>
    );
  }

  return (
    <div className="section">
      <h2>Task List</h2>
      <ul>
        {tasks.map((raw, i) => {
          // Casing-dostu normalizasyon
          const task = raw || {};
          const id =
            task.TaskID ?? task.taskID ?? task.id ?? `row-${i}`;
          const name =
            task.TaskName ?? task.taskName ?? task.tname ?? "No Task Name";
          const start =
            task.Start_date ?? task.start_date ?? task.StartDate ?? task.startDate ?? null;
          // due/end farklı isimlerle gelebilir:
          const due =
            task.Due_date ?? task.due_date ?? task.End_date ?? task.end_date ?? null;
          const completion =
            task.Completion_rate ?? task.completion_rate ?? task.completion ?? 0;
          const pnum =
            task.Pnumber ?? task.pnumber ?? task.ProjectId ?? task.projectId ?? "-";

          return (
            <li key={id}>
              <strong>{name}</strong> (ID: {id})
              <br />
              Dates: {toDate(start) ?? "?"} – {toDate(due) ?? "?"}
              <br />
              Completion: %{Number.isFinite(+completion) ? +completion : 0}
              <br />
              Project ID: {pnum}
              <hr />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default TaskList;