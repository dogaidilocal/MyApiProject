import React, { useEffect, useMemo, useState } from "react";

function TaskDetails({ task, isAdmin, isProjectLeader, token, onUpdate }) {
  // ---- API URL (env + fallback) ----
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  // ---- helpers: task alanlarını normalize et ----
  const norm = {
    id: task.TaskID ?? task.taskID,
    name: task.TaskName ?? task.taskName,
    start: task.Start_date ?? task.start_date ?? null,
    due: task.Due_date ?? task.due_date ?? null,
    completion: task.Completion_rate ?? task.completion_rate ?? 0,
    taskNumber: task.Task_number ?? task.task_number ?? null,
    pnumber: task.Pnumber ?? task.pnumber ?? null,
    incomingTodos: task.Todos ?? task.todos ?? [],
    incomingAssignments: task.AssignedEmployees ?? task.Assignees ?? task.Assignments ?? [],
  };

  // ---- state ----
  // Todos’u DTO isimleriyle saklıyoruz: Description / Importance / IsCompleted / TodoIndex
  const [todos, setTodos] = useState(() =>
    (norm.incomingTodos || []).map((t, i) => ({
      TodoIndex: t.TodoIndex ?? i,
      Description: t.Description ?? t.description ?? "",
      Importance: Number(t.Importance ?? t.importance ?? 0),
      IsCompleted: !!(t.IsCompleted ?? t.isCompleted ?? t.done),
    }))
  );

  // Atamalar: her TodoIndex için SSN dizisi (nested)
  const [employeeSelections, setEmployeeSelections] = useState(() => {
    // Eğer backend’den düz (flat) AssignedEmployees {SSN,TaskID,TodoIndex} geldiyse nested’e çevir
    if (Array.isArray(norm.incomingAssignments) && norm.incomingAssignments.length) {
      const looksFlat = norm.incomingAssignments.every(
        a => a && (a.SSN || a.ssn) && (a.TodoIndex ?? a.todoIndex ?? a.todoindex) !== undefined
      );
      if (looksFlat) {
        const byTodo = [];
        norm.incomingAssignments.forEach(a => {
          const idx = a.TodoIndex ?? a.todoIndex ?? a.todoindex ?? 0;
          if (!byTodo[idx]) byTodo[idx] = [];
          byTodo[idx].push(a.SSN ?? a.ssn);
        });
        return byTodo;
      }
      // Zaten nested ise
      if (Array.isArray(norm.incomingAssignments[0])) return norm.incomingAssignments;
    }
    return [];
  });

  const [employees, setEmployees] = useState([]);

  // Yeni todo formu
  const [newDesc, setNewDesc] = useState("");
  const [newRate, setNewRate] = useState("");
  const [newCount, setNewCount] = useState(1);

  // Rol: admin veya proje lideri to-do/görev yönetebilir
  const roleName = (localStorage.getItem("role") || "").toLowerCase();
  const canManage = isAdmin || (roleName === "leader" && isProjectLeader);

  // task prop’u değişirse state’i güncelle
  useEffect(() => {
    const incomingTodos = (task.Todos ?? task.todos ?? []).map((t, i) => ({
      TodoIndex: t.TodoIndex ?? i,
      Description: t.Description ?? t.description ?? "",
      Importance: Number(t.Importance ?? t.importance ?? 0),
      IsCompleted: !!(t.IsCompleted ?? t.isCompleted ?? t.done),
    }));
    setTodos(incomingTodos);

    const incAssign = task.AssignedEmployees ?? task.Assignees ?? task.Assignments ?? [];
    const looksFlat = Array.isArray(incAssign) && incAssign.length
      && incAssign.every(a => a && (a.SSN || a.ssn) && (a.TodoIndex ?? a.todoIndex ?? a.todoindex) !== undefined);

    if (looksFlat) {
      const byTodo = [];
      incAssign.forEach(a => {
        const idx = a.TodoIndex ?? a.todoIndex ?? a.todoindex ?? 0;
        if (!byTodo[idx]) byTodo[idx] = [];
        byTodo[idx].push(a.SSN ?? a.ssn);
      });
      setEmployeeSelections(byTodo);
    } else {
      setEmployeeSelections(Array.isArray(incAssign[0]) ? incAssign : []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task.TaskID, task.taskID]);

  // çalışanları yükle
  useEffect(() => {
    fetch(`${API_URL}/api/Employees`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error("Employees fetch failed");
        return r.json();
      })
      .then(setEmployees)
      .catch((e) => console.error("Employees error:", e));
  }, [API_URL, token]);

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

  // Çalışan atamaları değiştiğinde otomatik kaydet
  useEffect(() => {
    if (employeeSelections.length > 0 && canManage) {
      const hasAssignments = employeeSelections.some(arr => arr && arr.some(ssn => ssn && ssn.trim() !== ""));
      if (hasAssignments) {
        // Debounce to avoid too many saves
        const timeoutId = setTimeout(() => {
          recalculateAndSave(todos, employeeSelections);
        }, 500);
        return () => clearTimeout(timeoutId);
      }
    }
  }, [employeeSelections, canManage]);

  // checkbox
  const handleCheck = (idx) => {
    if (!canManage) return;
    const clone = todos.map((td, i) =>
      i === idx ? { ...td, IsCompleted: !td.IsCompleted } : td
    );
    setTodos(clone);
    // İstersen otomatik kaydı kapatabilirsin:
    recalculateAndSave(clone, employeeSelections);
  };

  // çalışan seçimi
  const handleAssignmentChange = (todoIndex, j, ssn) => {
    if (!canManage) return;
    setEmployeeSelections((prev) => {
      const copy = prev.map((x) => (x ? [...x] : []));
      if (!copy[todoIndex]) copy[todoIndex] = [];
      copy[todoIndex][j] = ssn; // backend SSN bekliyor
      return copy;
    });
  };

  // yeni To-Do
  const handleAddTodo = () => {
    if (!canManage) return;
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

  // To-Do düzenle/sil
  const editTodo = (index) => {
    if (!canManage) return;
    const current = todos[index];
    const desc = window.prompt("Açıklama", current.Description);
    if (desc == null) return;
    const rateInput = window.prompt("Önem (%)", String(current.Importance ?? 0));
    if (rateInput == null) return;
    const rate = Number(rateInput);
    const next = todos.map((t, i) => (i === index ? { ...t, Description: desc, Importance: Number.isFinite(rate) ? rate : 0 } : t));
    setTodos(next);
    recalculateAndSave(next, employeeSelections);
  };

  const deleteTodo = (index) => {
    if (!canManage) return;
    if (!window.confirm("Bu to-do silinsin mi?")) return;
    const nextTodos = todos.filter((_, i) => i !== index).map((t, i2) => ({ ...t, TodoIndex: i2 }));
    const nextAssign = employeeSelections.filter((_, i) => i !== index);
    setTodos(nextTodos);
    setEmployeeSelections(nextAssign);
    recalculateAndSave(nextTodos, nextAssign);
  };

  // --- DTO üretimi ---
  // Backend’in Assigned_To (SSN, TaskID, TodoIndex) mantığına uyum için flat liste de gönderiyoruz.
  const buildDto = (todosData, employeeData, completion) => {
    const tds = (todosData ?? todos).map((t, i) => ({
      TodoIndex: t.TodoIndex ?? i,
      Description: t.Description ?? "",
      Importance: Number(t.Importance ?? 0),
      IsCompleted: !!t.IsCompleted,
    }));

    const nested = (employeeData ?? employeeSelections);
    const assignedFlat = (nested || []).flatMap((arr, idx) =>
      (arr ?? []).filter(Boolean).map((ssn) => ({
        SSN: ssn,
        TaskID: norm.id,
        TodoIndex: idx,
      }))
    );

    return {
      TaskID: norm.id,
      TaskName: norm.name,
      Start_date: norm.start ?? null,
      Due_date: norm.due ?? null,
      Completion_rate: completion ?? localCompletion,
      Task_number: norm.taskNumber,
      Pnumber: norm.pnumber,
      Todos: tds,
      // iki format birden gönderiyoruz; backend hangisini bekliyorsa onu kullanabilir
      AssignedEmployees: assignedFlat,    // flat {SSN,TaskID,TodoIndex}
      Assignments: nested                 // nested [[SSN,SSN], ...] (varsa)
    };
  };

  // kaydet (auto)
  const recalculateAndSave = async (todosData, employeeData) => {
    if (!canManage) return;

    const doneSum = (todosData || [])
      .filter((t) => t.IsCompleted)
      .reduce((s, t) => s + (Number(t.Importance) || 0), 0);
    const totalSum = (todosData || []).reduce(
      (s, t) => s + (Number(t.Importance) || 0),
      0
    );
    const newCompletion = totalSum ? Math.round((doneSum / totalSum) * 100) : 0;

    const payload = buildDto(todosData, employeeData, newCompletion);

    try {
      const res = await fetch(`${API_URL}/api/Tasks/${norm.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const updated = await res.json();
        onUpdate && onUpdate(updated);
      } else {
        const txt = await res.text();
        console.error("PUT /Tasks failed:", txt);
        alert("Güncelleme hatası: " + txt);
      }
    } catch (e) {
      console.error(e);
      alert("Ağ hatası (Tasks PUT).");
    }
  };

  // manuel Kaydet butonu
  const handleSave = async () => {
    if (!canManage) return;
    try {
      const dto = buildDto();
      const res = await fetch(`${API_URL}/api/Tasks/${norm.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(dto),
      });

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
  const employeeValue = (emp) => emp.SSN ?? emp.ssn ?? "";
  const employeeLabel = (emp) =>
    (emp.Fname || emp.Lname)
      ? `${emp.Fname ?? ""} ${emp.Lname ?? ""} (${employeeValue(emp)})`
      : `${employeeValue(emp)}`;

  return (
    <div style={{ border: "1px solid #ccc", padding: "1rem", margin: "1rem 0" }}>
      <h4>
        {norm.name} (ID: {norm.id})
      </h4>
      <p>
        Başlangıç: {norm.start ? String(norm.start).slice(0, 10) : "-"} | Bitiş:{" "}
        {norm.due ? String(norm.due).slice(0, 10) : "-"}
      </p>
      <p>
        Tamamlanma (yerel): %{localCompletion}{" "}
        {typeof norm.completion === "number" && `(sunucu: %${norm.completion})`}
      </p>

      <h5>To-Do Listesi</h5>
      <ul>
        {todos.map((td, i) => (
          <li key={i} style={{ marginBottom: ".5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <input
                type="checkbox"
                checked={!!td.IsCompleted}
                disabled={!canManage}
                onChange={() => handleCheck(i)}
              />
              <span>{td.Description} (%{td.Importance ?? 0})</span>
              {canManage && (
                <>
                  <button onClick={() => editTodo(i)}>Düzenle</button>
                  <button onClick={() => deleteTodo(i)} style={{ color: "red" }}>Sil</button>
                </>
              )}
            </div>
            {canManage && Array.isArray(employeeSelections[i]) && (
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

      {canManage && (
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
              Kaç adet atama alanı:{" "}
              <input
                type="number"
                value={newCount}
                onChange={(e) => setNewCount(Number(e.target.value))}
                min={1}
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
