import React, { useState, useEffect } from "react";

function TaskDetails({ task, isAdmin, token, onUpdate }) {
  const [todos, setTodos] = useState(task.todos || []);
  const [employees, setEmployees] = useState([]);
  const [newDesc, setNewDesc] = useState("");
  const [newRate, setNewRate] = useState("");
  const [newCount, setNewCount] = useState(1);
  const [employeeSelections, setEmployeeSelections] = useState(task.assignments || []);

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/api/Employees`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(setEmployees)
      .catch(console.error);
  }, [token]);

  const handleCheck = idx => {
    const newTodos = todos.map((td, i) =>
      i === idx ? { ...td, done: !td.done } : td
    );
    setTodos(newTodos);
    recalculateAndSave(newTodos, employeeSelections);
  };

  const handleAssignmentChange = (idx, j, empId) => {
    const newAssignments = [...employeeSelections];
    if (!newAssignments[idx]) newAssignments[idx] = [];
    newAssignments[idx][j] = empId;
    setEmployeeSelections(newAssignments);
    recalculateAndSave(todos, newAssignments);
  };

  const recalculateAndSave = async (todosData, employeeData) => {
    const doneSum = todosData.filter(t => t.done).reduce((s, t) => s + t.importance, 0);
    const totalSum = todosData.reduce((s, t) => s + t.importance, 0);
    const newCompletion = totalSum ? Math.round((doneSum / totalSum) * 100) : 0;

    const payload = {
      ...task,
      todos: todosData,
      assignments: employeeData,
      completion_rate: newCompletion,
      start_date: task.start_date ? new Date(task.start_date).toISOString() : null,
      due_date: task.due_date ? new Date(task.due_date).toISOString() : null
    };

    const res = await fetch(`${process.env.REACT_APP_API_URL}/api/Tasks/${task.taskID}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const updatedTask = await res.json();
      onUpdate(updatedTask);
    } else {
      alert("Güncelleme hatası: " + await res.text());
    }
  };

  const handleAddTodo = () => {
    if (!newDesc || !newRate || newCount < 1) {
      return alert("Tüm alanlar dolu olmalı");
    }

    const newTodo = {
      desc: newDesc,
      importance: Number(newRate),
      done: false
    };

    setTodos(prev => [...prev, newTodo]);
    setEmployeeSelections(prev => [...prev, Array(newCount).fill("")]);

    setNewDesc("");
    setNewRate("");
    setNewCount(1);
  };

  return (
    <div style={{ border: "1px solid #ccc", padding: "1rem", margin: "1rem 0" }}>
      <h4>{task.taskName} (ID: {task.taskID})</h4>
      <p>Başlangıç: {task.start_date?.slice(0, 10)} | Bitiş: {task.due_date?.slice(0, 10)}</p>
      <p>Tamamlanma: %{task.completion_rate}</p>

      <h5>To‑Do Listesi</h5>
      <ul>
        {todos.map((td, i) => (
          <li key={i}>
            <input
              type="checkbox"
              checked={td.done}
              disabled={!isAdmin}
              onChange={() => handleCheck(i)}
            />{" "}
            {td.desc} (%{td.importance})
            {isAdmin && Array.isArray(employeeSelections[i]) && (
              <>
                <div style={{ marginTop: "0.5rem" }}>
                  {employeeSelections[i].map((empId, j) => (
                    <select
                      key={j}
                      value={empId}
                      onChange={e => handleAssignmentChange(i, j, e.target.value)}
                    >
                      <option value="">— Çalışan Seç —</option>
                      {employees.map(emp => (
                        <option key={emp.userid} value={emp.userid}>
                          {emp.username} ({emp.role})
                        </option>
                      ))}
                    </select>
                  ))}
                </div>
              </>
            )}
          </li>
        ))}
      </ul>

      {isAdmin && (
        <div style={{ marginTop: "1rem", borderTop: "1px solid #ddd", paddingTop: "1rem" }}>
          <h5>Yeni To‑Do Ekle</h5>
          <label>Açıklama: <input value={newDesc} onChange={e => setNewDesc(e.target.value)} /></label><br />
          <label>Önem (%): <input type="number" value={newRate} onChange={e => setNewRate(e.target.value)} /></label><br />
          <label>Kaç adet: <input type="number" value={newCount} onChange={e => setNewCount(Number(e.target.value))} /></label><br />
          <button onClick={handleAddTodo}>➕ Ekle</button>
        </div>
      )}
    </div>
  );
}

export default TaskDetails;
