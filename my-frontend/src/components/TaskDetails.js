import React, { useState, useEffect, useMemo } from "react";

function TaskDetails({ task, isAdmin, token, onUpdate }) {
  // ---- state ----
  const [todos, setTodos] = useState(() => task.todos || []);
  const [employees, setEmployees] = useState([]);
  const [newDesc, setNewDesc] = useState("");
  const [newRate, setNewRate] = useState("");
  const [newCount, setNewCount] = useState(1);
  const [employeeSelections, setEmployeeSelections] = useState(
    () => task.assignments || []
  );

  // ---- employees yükle ----
  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/api/Employees`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setEmployees)
      .catch(console.error);
  }, [token]);

  // ---- tamamlanma oranını yerelde hesapla (gösterim için) ----
  const localCompletion = useMemo(() => {
    const doneSum = (todos ?? [])
      .filter((t) => t.done)
      .reduce((s, t) => s + (Number(t.importance) || 0), 0);
    const totalSum = (todos ?? []).reduce(
      (s, t) => s + (Number(t.importance) || 0),
      0
    );
    return totalSum ? Math.round((doneSum / totalSum) * 100) : 0;
  }, [todos]);

  // ---- checkbox ----
  const handleCheck = (idx) => {
    setTodos((prev) =>
      prev.map((td, i) => (i === idx ? { ...td, done: !td.done } : td))
    );
  };

  // ---- çalışan seçimi ----
  const handleAssignmentChange = (todoIndex, j, ssn) => {
    setEmployeeSelections((prev) => {
      const copy = prev.map((x) => (x ? [...x] : []));
      if (!copy[todoIndex]) copy[todoIndex] = [];
      copy[todoIndex][j] = ssn; // backend SSN bekliyor
      return copy;
    });
  };

  // ---- yeni todo ekle ----
  const handleAddTodo = () => {
    if (!newDesc || !newRate || newCount < 1) {
      return alert("Tüm alanlar dolu olmalı");
    }

    const newTodo = {
      desc: newDesc,
      importance: Number(newRate),
      done: false,
    };

    setTodos((prev) => [...prev, newTodo]);
    setEmployeeSelections((prev) => [...prev, Array(newCount).fill("")]);

    setNewDesc("");
    setNewRate("");
    setNewCount(1);
  };

  // ---- FRONTEND state -> BACKEND TaskDto ----
  const buildTaskDto = () => {
    // assignments: boşları ayıkla
    const cleanedAssignments = (employeeSelections ?? []).map((arr) =>
      (arr ?? []).filter((x) => !!x)
    );

    // dto.todos: {todoIndex, description, isCompleted}
    const dtoTodos = (todos ?? []).map((t, i) => ({
      todoIndex: i,
      description: t.desc || "",
      isCompleted: !!t.done,
    }));

    return {
      taskID: task.taskID,
      taskName: task.taskName,
      start_date: task.start_date || null,
      due_date: task.due_date || null,
      completion_rate: localCompletion,
      task_number: task.task_number ?? task.taskNumber ?? null,
      pnumber: task.pnumber ?? task.Pnumber ?? null,
      todos: dtoTodos,
      assignments: cleanedAssignments,
    };
  };

  // ---- PUT: Kaydet ----
  const handleSave = async () => {
    try {
      const dto = buildTaskDto();

      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/Tasks/${task.taskID}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(dto),
        }
      );

      if (!res.ok) {
        const errText = await res.text();
        alert("Kaydetme hatası: " + errText);
        return;
      }

      const updated = await res.json();
      onUpdate && onUpdate(updated);
      alert("Kaydedildi!");
    } catch (e) {
      console.error(e);
      alert("Kaydetme sırasında bir hata oluştu.");
    }
  };

  // ---- yardımcı: çalışan value & label ----
  const employeeValue = (emp) => emp.ssn ?? emp.SSN ?? emp.userid ?? "";
  const employeeLabel = (emp) =>
    emp.fname || emp.lname
      ? `${emp.fname ?? ""} ${emp.lname ?? ""} (${employeeValue(emp)})`
      : `${emp.username ?? "Çalışan"} (${employeeValue(emp)})`;

  return (
    <div style={{ border: "1px solid #ccc", padding: "1rem", margin: "1rem 0" }}>
      <h4>
        {task.taskName} (ID: {task.taskID})
      </h4>
      <p>
        Başlangıç: {task.start_date?.slice(0, 10)} | Bitiş:{" "}
        {task.due_date?.slice(0, 10)}
      </p>
      <p>
        Tamamlanma (yerel): %{localCompletion}{" "}
        {typeof task.completion_rate === "number" &&
          `(sunucu: %${task.completion_rate})`}
      </p>

      <h5>To-Do Listesi</h5>
      <ul>
        {todos.map((td, i) => (
          <li key={i} style={{ marginBottom: ".5rem" }}>
            <input
              type="checkbox"
              checked={!!td.done}
              disabled={!isAdmin}
              onChange={() => handleCheck(i)}
            />{" "}
            {td.desc} (%{td.importance})
            {isAdmin && Array.isArray(employeeSelections[i]) && (
              <div style={{ marginTop: ".5rem", display: "grid", gap: ".25rem" }}>
                {employeeSelections[i].map((ssn, j) => (
                  <select
                    key={j}
                    value={ssn}
                    onChange={(e) =>
                      handleAssignmentChange(i, j, e.target.value)
                    }
                  >
                    <option value="">— Çalışan Seç —</option>
                    {employees.map((emp) => (
                      <option key={employeeValue(emp)} value={employeeValue(emp)}>
                        {employeeLabel(emp)}
                      </option>
                    ))}
                  </select>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>

      {isAdmin && (
        <>
          <div
            style={{ marginTop: "1rem", borderTop: "1px solid #ddd", paddingTop: "1rem" }}
          >
            <h5>Yeni To-Do Ekle</h5>
            <label>
              Açıklama:{" "}
              <input
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
              />
            </label>
            <br />
            <label>
              Önem (%):{" "}
              <input
                type="number"
                value={newRate}
                onChange={(e) => setNewRate(e.target.value)}
              />
            </label>
            <br />
            <label>
              Kaç adet:{" "}
              <input
                type="number"
                value={newCount}
                onChange={(e) => setNewCount(Number(e.target.value))}
              />
            </label>
            <br />
            <button onClick={handleAddTodo}>Ekle</button>
          </div>

          <div style={{ marginTop: "1rem" }}>
            <button onClick={handleSave}>Kaydet</button>
          </div>
        </>
      )}
    </div>
  );
}

export default TaskDetails;
