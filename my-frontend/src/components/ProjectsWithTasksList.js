// my-frontend/src/components/ProjectsWithTasksList.js
import React, { useEffect, useState, useMemo } from "react";

const ProjectsWithTasksList = () => {
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
  const token = localStorage.getItem("token");

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // Casing-dostu yardımcılar
  const projectId   = (p) => p.pnumber ?? p.Pnumber ?? p.id ?? p.Id;
  const projectName = (p) => p.pname ?? p.Pname ?? p.name ?? p.Name;
  const projectTasks = (p) => p.tasks ?? p.Tasks ?? [];

  const taskId   = (t) => t.taskID ?? t.TaskID ?? t.id ?? t.Id;
  const taskName = (t) => t.taskName ?? t.TaskName ?? t.name ?? t.Name;
  const taskRate = (t) => {
    const r = t.completion_rate ?? t.Completion_rate ?? t.rate ?? t.Rate;
    const n = Number(r);
    return Number.isFinite(n) ? n : 0;
  };

  const calcProjectRate = (tasks) => {
    const list = (tasks || []).map(taskRate);
    if (!list.length) return 0;
    const sum = list.reduce((a, b) => a + b, 0);
    return Math.round(sum / list.length);
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const res = await fetch(`${API_URL}/api/ProjectsWithTasks`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `HTTP ${res.status}`);
        }
        const data = await res.json();
        setProjects(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
        setErr("Projeler yüklenemedi. " + e.message);
        setProjects([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [API_URL, token]);

  const normalized = useMemo(
    () =>
      projects.map((p) => ({
        id: projectId(p),
        name: projectName(p),
        tasks: projectTasks(p),
      })),
    [projects]
  );

  return (
    <div style={{ flex: 2 }}>
      <h2>Projeler ve Görevler</h2>

      {loading && <p>Yükleniyor...</p>}
      {!loading && err && <p style={{ color: "red" }}>{err}</p>}
      {!loading && !err && normalized.length === 0 && <p>Kayıt bulunamadı.</p>}

      {!loading && !err && normalized.length > 0 && (
        <ul>
          {normalized.map((proj) => (
            <li key={proj.id} style={{ marginBottom: "1.25rem" }}>
              <strong>{proj.name ?? "İsimsiz Proje"}</strong>{" "}
              — Tamamlanma: %{calcProjectRate(proj.tasks)}
              {proj.tasks && proj.tasks.length > 0 ? (
                <ul style={{ marginTop: ".35rem" }}>
                  {proj.tasks.map((t) => (
                    <li key={taskId(t)}>
                      {taskName(t) ?? "Görev"} — %{taskRate(t)}
                    </li>
                  ))}
                </ul>
              ) : (
                <div style={{ opacity: 0.7, marginTop: ".25rem" }}>
                  Bu projeye ait görev bulunmuyor.
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ProjectsWithTasksList;
