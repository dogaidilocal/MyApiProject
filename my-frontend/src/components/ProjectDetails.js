import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import TaskDetails from "./TaskDetails";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

// ---- küçük yardımcılar ----
const nProject = (p) => ({
  pnumber: p?.pnumber ?? p?.Pnumber,
  pname: p?.pname ?? p?.Pname,
  start_date: p?.start_date ?? p?.Start_date ?? null,
  due_date: p?.due_date ?? p?.Due_date ?? null,
  completion_status: p?.completion_status ?? p?.Completion_status ?? 0,
  dnumber: p?.dnumber ?? p?.Dnumber,
  department: p?.department ?? p?.Department ?? null,
  leader: p?.leader ?? p?.Leader ?? null,
});

const nTask = (t) => ({
  taskID: t?.taskID ?? t?.TaskID,
  taskName: t?.taskName ?? t?.TaskName,
  start_date: t?.start_date ?? t?.Start_date ?? null,
  due_date: t?.due_date ?? t?.Due_date ?? null,
  completion_rate: t?.completion_rate ?? t?.Completion_rate ?? 0,
  task_number: t?.task_number ?? t?.Task_number ?? 0,
  pnumber: t?.pnumber ?? t?.Pnumber,
  dnumber: t?.dnumber ?? t?.Dnumber,
  todos: t?.todos ?? t?.Todos ?? [],
  assignees: t?.assignees ?? t?.Assignees ?? [],
});

const toUtcOrNull = (s) => (s ? new Date(s).toISOString() : null);

export default function ProjectDetails({ token: propToken, role }) {
  const { dnumber, pnumber } = useParams();
  const depNum = Number(dnumber);
  const projNum = Number(pnumber);

  const token = propToken || localStorage.getItem("token") || "";
  const isAdmin = useMemo(() => (role || localStorage.getItem("role") || "").toLowerCase() === "admin", [role]);
  const isLeader = useMemo(() => (role || localStorage.getItem("role") || "").toLowerCase() === "leader", [role]);

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // form
  const [showForm, setShowForm] = useState(false);
  const [mode, setMode] = useState("new"); // new | edit
  const [form, setForm] = useState({
    taskName: "",
    start_date: "",
    due_date: "",
    completion_rate: 0,
    task_number: 0,
  });

  const [selectedTask, setSelectedTask] = useState(null);

  // fetch helper
  const fetchJson = async (url) => {
    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    return res;
  };

  // Proje ve görevleri yükle (with fallback)
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setErr("");
      try {
        // 1) Önce /api/ProjectsWithTasks/{id} dene
        const res = await fetchJson(`${API_URL}/api/ProjectsWithTasks/${projNum}`);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) {
            setProject(nProject(data));
            setTasks(Array.isArray(data.tasks) ? data.tasks.map(nTask) : []);
          }
        } else {
          // 2) Fallback: ayrı ayrı çek ve birleştir
          const [pRes, tRes] = await Promise.all([
            fetchJson(`${API_URL}/api/Projects/${projNum}`),
            fetchJson(`${API_URL}/api/Tasks`)
          ]);

          if (!pRes.ok) {
            const text = await pRes.text();
            throw new Error(text || `Projects HTTP ${pRes.status}`);
          }
          const pData = await pRes.json();
          const proj = nProject(pData);

          let allTasks = [];
          if (tRes.ok) {
            const tData = await tRes.json();
            allTasks = (Array.isArray(tData) ? tData : [])
              .filter((t) => Number((t.pnumber ?? t.Pnumber)) === projNum)
              .map(nTask);
          }

          if (!cancelled) {
            setProject(proj);
            setTasks(allTasks);
          }
        }
      } catch (e) {
        if (!cancelled) {
          console.error(e);
          setErr(e.message || "Failed to fetch");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [projNum, token]);

  const completionOf = (t) => Math.round(Number(t.completion_rate || 0));
  const totalRate = useMemo(() => {
    if (!tasks.length) return 0;
    const sum = tasks.reduce((a, t) => a + Number(t.completion_rate || 0), 0);
    return Math.round(sum / tasks.length);
  }, [tasks]);

  // ---------- Form helpers ----------
  const openNew = () => {
    setMode("new");
    setForm({
      taskName: "",
      start_date: "",
      due_date: "",
      completion_rate: 0,
      task_number: 0,
    });
    setSelectedTask(null);
    setShowForm(true);
  };
  const openEdit = (t) => {
    setMode("edit");
    setForm({
      taskID: t.taskID,
      taskName: t.taskName || "",
      start_date: (t.start_date || "").slice(0, 10),
      due_date: (t.due_date || "").slice(0, 10),
      completion_rate: Number(t.completion_rate || 0),
      task_number: Number(t.task_number || 0),
    });
    setSelectedTask(null);
    setShowForm(true);
  };
  const closeForm = () => setShowForm(false);
  const onChange = (e) => setForm((x) => ({ ...x, [e.target.name]: e.target.value }));

  // ---------- CRUD: Tasks ----------
  const saveTask = async () => {
    const isEdit = mode === "edit";
    const url = isEdit
      ? `${API_URL}/api/Tasks/${form.taskID}`
      : `${API_URL}/api/Tasks`;
    const method = isEdit ? "PUT" : "POST";

    const body = {
      ...(isEdit ? { taskID: Number(form.taskID) } : {}),
      taskName: (form.taskName || "").trim(),
      pnumber: projNum,
      dnumber: depNum,
      start_date: toUtcOrNull(form.start_date),
      due_date: toUtcOrNull(form.due_date),
      completion_rate: Number(form.completion_rate || 0),
      task_number: Number(form.task_number || 0),
    };
    if (!body.taskName) {
      alert("Görev adı zorunludur.");
      return;
    }

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `HTTP ${res.status}`);
      }

      let saved = null;
      if (res.status === 204) saved = { ...body };
      else {
        try { saved = await res.json(); } catch { saved = { ...body }; }
      }

      setTasks((list) =>
        isEdit
          ? list.map((t) =>
              Number(t.taskID) === Number(saved.taskID) ? { ...t, ...saved } : t
            )
          : [...list, nTask(saved)]
      );
      closeForm();
    } catch (e) {
      console.error("Kaydetme hatası:", e);
      alert("Kaydetme hatası: " + e.message);
    }
  };

  const deleteTask = async (taskID) => {
    if (!window.confirm("Bu görevi silmek istiyor musunuz?")) return;
    try {
      const res = await fetch(`${API_URL}/api/Tasks/${taskID}`, {
        method: "DELETE",
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setTasks((list) => list.filter((t) => Number(t.taskID) !== Number(taskID)));
      if (selectedTask?.taskID === taskID) setSelectedTask(null);
    } catch (e) {
      console.error("Silme hatası:", e);
      alert("Silme başarısız: " + e.message);
    }
  };

  const openTaskDetails = (t) => {
    setSelectedTask(t);
    setShowForm(false);
  };

  const handleTaskUpdated = (updated) => {
    setTasks((list) =>
      list.map((t) =>
        Number(t.taskID) === Number(updated.taskID) ? { ...t, ...updated } : t
      )
    );
    setSelectedTask(null);
  };

  if (loading) return <p style={{ padding: 16 }}>Yükleniyor…</p>;
  if (err) return <p style={{ padding: 16, color: "red" }}>{err}</p>;
  if (!project) return <h2 style={{ padding: 16 }}>Proje bulunamadı</h2>;

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", gap: 16, alignItems: "baseline" }}>
        <h2 style={{ margin: 0 }}>
          {project.pname} <span style={{ color: "#777" }}>(ID: {project.pnumber})</span>
        </h2>
        <span style={{ color: "#666" }}>
          Departman: <b>{project.department?.dname || project.dnumber}</b>
        </span>
        <span style={{ marginLeft: "auto", color: "#666" }}>
          Tamamlanma (ortalama): <b>%{totalRate}</b>
        </span>
      </div>

      {project.leader && (
        <div style={{ marginTop: 6, color: "#444" }}>
          Lider: <b>{project.leader.fullName || project.leader.leaderSSN}</b>
        </div>
      )}

      <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
        <Link to={`/departments/${depNum}`}>← Bölüme dön</Link>
        {(isAdmin || isLeader) && (
          <span style={{ marginLeft: "auto", color: "#666" }}>
            Rol: <b>{isAdmin ? "Admin" : "Leader"}</b>
          </span>
        )}
        {isAdmin && (
          <button onClick={openNew} style={{ marginLeft: "auto" }}>
            ➕ Yeni Görev
          </button>
        )}
      </div>

      {showForm && (
        <div
          style={{
            border: "1px solid #ccc",
            padding: 12,
            borderRadius: 8,
            marginTop: 12,
            maxWidth: 720,
          }}
        >
          <h3 style={{ marginTop: 0 }}>
            {mode === "edit" ? "Görevi Düzenle" : "Yeni Görev"}
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
              maxWidth: 720,
            }}
          >
            {mode === "edit" && (
              <label>
                TaskID
                <input value={form.taskID} disabled style={{ display: "block", width: "100%" }} />
              </label>
            )}

            <label>
              Görev Adı
              <input
                name="taskName"
                value={form.taskName}
                onChange={onChange}
                style={{ display: "block", width: "100%" }}
              />
            </label>

            <label>
              Başlangıç
              <input
                type="date"
                name="start_date"
                value={form.start_date}
                onChange={onChange}
                style={{ display: "block", width: "100%" }}
              />
            </label>

            <label>
              Bitiş
              <input
                type="date"
                name="due_date"
                value={form.due_date}
                onChange={onChange}
                style={{ display: "block", width: "100%" }}
              />
            </label>

            <label>
              Tamamlanma (%)
              <input
                type="number"
                name="completion_rate"
                value={form.completion_rate}
                onChange={onChange}
                min={0}
                max={100}
                style={{ display: "block", width: "100%" }}
              />
            </label>

            <label>
              Görev No
              <input
                type="number"
                name="task_number"
                value={form.task_number}
                onChange={onChange}
                min={0}
                style={{ display: "block", width: "100%" }}
              />
            </label>
          </div>

          <div style={{ marginTop: 12 }}>
            <button onClick={saveTask} style={{ marginRight: 8 }}>
              Kaydet
            </button>
            <button onClick={closeForm}>İptal</button>
          </div>
        </div>
      )}

      {selectedTask && (
        <div style={{ marginTop: 16 }}>
          <TaskDetails
            task={selectedTask}
            isAdmin={isAdmin}
            token={token}
            onUpdate={handleTaskUpdated}
          />
        </div>
      )}

      <h3 style={{ marginTop: 18 }}>Görevler</h3>
      {tasks.length === 0 ? (
        <p>Henüz görev yok.</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 12,
          }}
        >
          {tasks.map((t) => {
            const c = completionOf(t);
            return (
              <div
                key={t.taskID}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: 8,
                  padding: 12,
                  background: "#fafafa",
                }}
              >
                <div
                  onClick={() => openTaskDetails(t)}
                  style={{ cursor: "pointer", userSelect: "none" }}
                  title="Görev detaylarını aç"
                >
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>
                    {t.taskName || "İsimsiz Görev"}
                  </div>
                  <div style={{ color: "#666", marginBottom: 8 }}>
                    {t.start_date?.slice(0, 10)} → {t.due_date?.slice(0, 10)}
                  </div>

                  <div
                    style={{
                      height: 8,
                      background: "#eee",
                      borderRadius: 4,
                      overflow: "hidden",
                      marginBottom: 8,
                    }}
                  >
                    <div
                      style={{
                        width: `${c}%`,
                        height: "100%",
                        background: "#79c06e",
                      }}
                    />
                  </div>
                  <div style={{ fontSize: 12, color: "#555" }}>
                    Tamamlanma: %{c}
                  </div>

                  {Array.isArray(t.assignees) && t.assignees.length > 0 && (
                    <div style={{ marginTop: 6, fontSize: 12, color: "#555" }}>
                      Atananlar:{" "}
                      {t.assignees
                        .map((a) => a.employee || a.ssn)
                        .filter(Boolean)
                        .join(", ")}
                    </div>
                  )}
                </div>

                {isAdmin && (
                  <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                    <button onClick={() => openEdit(t)}>✏️ Düzenle</button>
                    <button onClick={() => deleteTask(t.taskID)} style={{ color: "red" }}>
                      🗑️ Sil
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
