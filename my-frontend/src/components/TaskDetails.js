import React, { useEffect, useMemo, useState } from "react";

function TaskDetails({ task, isAdmin, token, onUpdate }) {
  // ---- helpers: task alanlarını normalize et (API farklı casing ile gelebilir) ----
  const norm = {
    id: task.TaskID ?? task.taskID,
    name: task.TaskName ?? task.taskName,
    start: task.Start_date ?? task.start_date ?? null,
    due: task.Due_date ?? task.due_date ?? null,
    completion: task.Completion_rate ?? task.completion_rate ?? 0,
    taskNumber: task.Task_number ?? task.task_number ?? null,
    pnumber: task.Pnumber ?? task.pnumber ?? null,
    incomingTodos:
      task.Todos ??
      task.todos ??
      [], // server’dan PascalCase ya da camel gelebilir
    incomingAssignments: task.Assignments ?? task.assignments ?? [],
  };

  // ---- state ----
  // Todos’u DTO isimleriyle saklıyoruz: Description / Importance / IsCompleted / TodoIndex
  const [todos, setTodos] = useState(() =>
    (norm.incomingTodos || []).map((t, i) => ({
      TodoIndex: t.TodoIndex ?? i,
      Description: t.Description ?? t.description ?? "",
      Importance:
        t.Importance ?? t.importance ?? 0, // önem yüzdesi
      IsCompleted: !!(t.IsCompleted ?? t.isCompleted ?? t.done),
    }))
  );

  const [employees, setEmployees] = useState([]);
  const [employeeSelections, setEmployeeSelections] = useState(
    () => norm.incomingAssignments || []
  );

  const [newDesc, setNewDesc] = useState("");
  const [newRate, setNewRate] = useState("");
  const [newCount, setNewCount] = useState(1);

  // task prop’u değişirse state’i güncelle
  useEffect(() => {
    const incoming = (task.Todos ?? task.todos ?? []).map((t, i) => ({
      TodoIndex: t.TodoIndex ?? i,
      Description: t.Description ?? t.description ?? "",
      Importance: t.Importance ?? t.importance ?? 0,
      IsCompleted: !!(t.IsCompleted ?? t.isCompleted ?? t.done),
    }));
    setTodos(incoming);
    setEmployeeSelections(task.Assignments ?? task.assignments ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task.TaskID, task.taskID]);

  // çalışanları yükle
  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/api/Employees`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setEmployees)
      .catch(console.error);
  }, [token]);

  // yerel tamamlanma
  const localCompletion = useMemo(() => {
    const doneSum = (todos || [])
      .filter((t) => t.IsCompleted)
      .reduce((s, t) => s + (Number(t.Importance) || 0), 0);
    const totalSum = (todos || []).reduce(
      (s, t) => s + (Number(t.Importance) || 0),
      0
    );
    return totalSum ? Math.round((doneSum / totalSum) * 100) : 0;
  }, [todos]);

  // checkbox
  const handleCheck = (idx) => {
    const clone = todos.map((td, i) =>
      i === idx ? { ...td, IsCompleted: !td.IsCompleted } : td
    );
    setTodos(clone);
    // otomatik kaydetmek istemezsen bu satırı kaldırabilirsin:
    recalculateAndSave(clone, employeeSelections);
  };

  // çalışan seçimi
  const handleAssignmentChange = (todoIndex, j, ssn) => {
    setEmployeeSelections((prev) => {
      const copy = prev.map((x) => (x ? [...x] : []));
      if (!copy[todoIndex]) copy[todoIndex] = [];
      copy[todoIndex][j] = ssn; // backend SSN bekliyor
      return copy;
    });
  };

  // yeni To-Do
  const handleAddTodo = () => {
    if (!newDesc || !newRate || newCount < 1) {
      return alert("Tüm alanlar dolu olmalı");
    }
    const nextIdx = todos.length;
    const newTodo = {
      TodoIndex: nextIdx,
      Description: newDesc,
      Importance: Number(newRate),
      IsCompleted: false,
    };

    setTodos((prev) => [...prev, newTodo]);
    setEmployeeSelections((prev) => [...prev, Array(newCount).fill("")]);

    setNewDesc("");
    setNewRate("");
    setNewCount(1);
  };

  // ortak: DTO oluştur
  const buildDto = (todosData, employeeData, completion) => ({
    TaskID: norm.id,
    TaskName: norm.name,
    Start_date: norm.start ?? null,
    Due_date: norm.due ?? null,
    Completion_rate: completion ?? localCompletion,
    Task_number: norm.taskNumber,
    Pnumber: norm.pnumber,
    Todos: (todosData ?? todos).map((t, i) => ({
      TodoIndex: t.TodoIndex ?? i,
      Description: t.Description ?? "",
      Importance: t.Importance ?? 0,
      IsCompleted: !!t.IsCompleted,
    })),
    Assignments: (employeeData ?? employeeSelections).map((arr) =>
      (arr ?? []).filter(Boolean)
    ),
  });

  // kaydet (auto)
  const recalculateAndSave = async (todosData, employeeData) => {
    const doneSum = (todosData || [])
      .filter((t) => t.IsCompleted)
      .reduce((s, t) => s + (Number(t.Importance) || 0), 0);
    const totalSum = (todosData || []).reduce(
      (s, t) => s + (Number(t.Importance) || 0),
      0
    );
    const newCompletion = totalSum ? Math.round((doneSum / totalSum) * 100) : 0;

    const payload = buildDto(todosData, employeeData, newCompletion);

    const res = await fetch(
      `${process.env.REACT_APP_API_URL}/api/Tasks/${norm.id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      }
    );

    if (res.ok) {
      const updated = await res.json();
      onUpdate && onUpdate(updated);
    } else {
      alert("Güncelleme hatası: " + (await res.text()));
    }
  };

  // manuel Kaydet butonu
  const handleSave = async () => {
    try {
      const dto = buildDto();
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/Tasks/${norm.id}`,
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

  // çalışan label/value
  const employeeValue = (emp) => emp.SSN ?? emp.ssn ?? emp.userid ?? "";
  const employeeLabel = (emp) =>
    emp.Fname || emp.Lname
      ? `${emp.Fname ?? ""} ${emp.Lname ?? ""} (${employeeValue(emp)})`
      : `${emp.Username ?? emp.username ?? "Çalışan"} (${employeeValue(emp)})`;

  return (
    <div style={{ border: "1px solid #ccc", padding: "1rem", margin: "1rem 0" }}>
      <h4>
        {norm.name} (ID: {norm.id})
      </h4>
      <p>
        Başlangıç: {norm.start?.toString()?.slice(0, 10)} | Bitiş:{" "}
        {norm.due?.toString()?.slice(0, 10)}
      </p>
      <p>
        Tamamlanma (yerel): %{localCompletion}{" "}
        {typeof norm.completion === "number" && `(sunucu: %${norm.completion})`}
      </p>

      <h5>To-Do Listesi</h5>
      <ul>
        {todos.map((td, i) => (
          <li key={i} style={{ marginBottom: ".5rem" }}>
            <input
              type="checkbox"
              checked={!!td.IsCompleted}
              disabled={!isAdmin}
              onChange={() => handleCheck(i)}
            />{" "}
            {td.Description} (%{td.Importance ?? 0})
            {isAdmin && Array.isArray(employeeSelections[i]) && (
              <div style={{ marginTop: ".5rem", display: "grid", gap: ".25rem" }}>
                {employeeSelections[i].map((ssn, j) => (
                  <select
                    key={j}
                    value={ssn}
                    onChange={(e) => handleAssignmentChange(i, j, e.target.value)}
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
            style={{
              marginTop: "1rem",
              borderTop: "1px solid #ddd",
              paddingTop: "1rem",
            }}
          >
            <h5>Yeni To-Do Ekle</h5>
            <label>
              Açıklama:{" "}
              <input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
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
