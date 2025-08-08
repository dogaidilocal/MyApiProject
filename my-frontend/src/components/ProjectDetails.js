import React, { useState } from "react";
import { useParams } from "react-router-dom";
import TaskDetails from "./TaskDetails";

const ProjectDetails = ({ projects, token, role }) => {
  const { pnumber } = useParams();
  const projNum = parseInt(pnumber, 10);
  const project = projects.find(p => p.pnumber === projNum);
  const isAdmin = role?.toLowerCase() === "admin";

  const [tasks, setTasks] = useState(project?.tasks || []);
  const [showNewForm, setShowNewForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [newTaskAttrs, setNewTaskAttrs] = useState({});
  const [selectedTask, setSelectedTask] = useState(null);

  if (!project) return <h2>Proje bulunamadı</h2>;

  const totalRate = tasks.length
    ? Math.round(tasks.reduce((a, t) => a + (t.completion_rate || 0), 0) / tasks.length)
    : 0;

  const toUTC = (dateStr) => {
    const d = new Date(dateStr);
    return d.toISOString();
  };

  const handleAdd = () => {
    setNewTaskAttrs({
      taskID: "", taskName: "", start_date: "", due_date: "", completion_rate: 0, task_number: 0
    });
    setShowNewForm(true);
    setEditingTask(null);
  };

  const handleEdit = t => {
    setEditingTask(t);
    setNewTaskAttrs({
      taskID: t.taskID,
      taskName: t.taskName,
      start_date: t.start_date?.slice(0, 10),
      due_date: t.due_date?.slice(0, 10),
      completion_rate: t.completion_rate,
      task_number: t.task_number
    });
    setShowNewForm(false);
    setSelectedTask(null);
  };

  const handleDelete = async taskID => {
    if (!window.confirm("Bu görevi silmek istediğinize emin misiniz?")) return;
    const res = await fetch(`${process.env.REACT_APP_API_URL}/api/Tasks/${taskID}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) setTasks(prev => prev.filter(t => t.taskID !== taskID));
    else alert("Silme başarısız");
  };

  const handleSave = async () => {
    const method = editingTask ? "PUT" : "POST";
    const url = editingTask
      ? `${process.env.REACT_APP_API_URL}/api/Tasks/${editingTask.taskID}`
      : `${process.env.REACT_APP_API_URL}/api/Tasks`;

    const baseAttrs = {
      ...newTaskAttrs,
      start_date: newTaskAttrs.start_date ? toUTC(newTaskAttrs.start_date) : null,
      due_date: newTaskAttrs.due_date ? toUTC(newTaskAttrs.due_date) : null,
    };

    const body = editingTask
      ? { ...editingTask, ...baseAttrs }
      : { ...baseAttrs, pnumber: project.pnumber, dnumber: project.dnumber };

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });

    if (res.ok) {
      const data = await res.json();
      setTasks(prev =>
        editingTask
          ? prev.map(t => t.taskID === data.taskID ? data : t)
          : [...prev, data]
      );
      setShowNewForm(false);
      setEditingTask(null);
    } else {
      alert("Kaydetme hatası: " + await res.text());
    }
  };

  const handleChange = e =>
    setNewTaskAttrs(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleTaskClick = t => {
    if (!isAdmin) return;
    setSelectedTask(t);
    setShowNewForm(false);
    setEditingTask(null);
  };

  const handleUpdate = updated => {
    setTasks(prev => prev.map(t => t.taskID === updated.taskID ? updated : t));
    setSelectedTask(null);
  };

  return (
    <div>
      <h2>{project.pname} (ID: {project.pnumber})</h2>
      <p>Toplam Tamamlanma: %{totalRate}</p>

      {isAdmin && !showNewForm && !selectedTask && (
        <button onClick={handleAdd}>➕ Yeni Görev</button>
      )}

      {(showNewForm || editingTask) && (
        <div style={{ border: "1px solid #333", padding: "1rem", margin: "1rem 0" }}>
          <h3>{editingTask ? "Görevi Düzenle" : "Yeni Görev"}</h3>
          {Object.entries(newTaskAttrs).map(([k, v]) => (
            <div key={k} style={{ marginBottom: "0.5rem" }}>
              <label>{k}: <input
                name={k}
                value={v}
                onChange={handleChange}
                type={k.includes("date") ? "date" : (typeof v === "number" ? "number" : "text")}
              /></label>
            </div>
          ))}
          <button onClick={handleSave}>Kaydet ✅</button>
          <button onClick={() => {
            setEditingTask(null);
            setShowNewForm(false);
            setSelectedTask(null);
          }}>İptal</button>
        </div>
      )}

      {selectedTask && (
        <TaskDetails task={selectedTask} isAdmin={isAdmin} token={token} onUpdate={handleUpdate} />
      )}

      <h3>Görevler</h3>
      <ul style={{ padding: 0 }}>
        {tasks.length ? tasks.map(task => (
          <li key={task.taskID} style={{ marginBottom: "0.8rem", border: "1px solid #ccc", padding: "0.5rem" }}>
            <span onClick={() => handleTaskClick(task)} style={{ cursor: isAdmin ? "pointer" : "default" }}>
              <strong>{task.taskName}</strong> (%{task.completion_rate})<br />
              {task.start_date?.slice(0, 10)} → {task.due_date?.slice(0, 10)}
            </span>
            {isAdmin && (
              <span style={{ marginLeft: "1rem" }}>
                <button onClick={() => handleEdit(task)}>✏️ Düzenle</button>
                <button onClick={() => handleDelete(task.taskID)}>🗑️ Sil</button>
              </span>
            )}
          </li>
        )) : <li>Görev yok</li>}
      </ul>
    </div>
  );
};

export default ProjectDetails;
