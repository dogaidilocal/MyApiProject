// my-frontend/src/components/TaskItem.js
import React from "react";

/**
 * Props:
 * - todo: { Description/description, Importance/importance, IsCompleted/isCompleted/done }
 * - index: number (todo'nun listedeki sırası)
 * - isAdmin: boolean (checkbox ve atama kontrolleri kilitlenmesin)
 * - employees: çalışan listesi (API'den gelen ham obje)
 * - assignees: string[] (bu todo için seçili SSN listesi)
 * - onToggle(index)
 * - onAssign(index, slot, ssn)
 * - onAddAssignee(index)
 * - onRemoveAssignee(index, slot)
 */
function TaskItem({
  todo,
  index,
  isAdmin,
  employees = [],
  assignees = [],
  onToggle,
  onAssign,
  onAddAssignee,
  onRemoveAssignee,
}) {
  // --- Casing-dostu alanlar ---
  const desc =
    todo.Description ?? todo.description ?? todo.TaskDescription ?? "";
  const importance = Number(
    todo.Importance ?? todo.importance ?? todo.rate ?? 0
  );
  const done = !!(todo.IsCompleted ?? todo.isCompleted ?? todo.done);

  // --- Çalışan gösterim yardımcıları ---
  const empId = (e) => e?.ssn ?? e?.SSN ?? e?.userid ?? "";
  const empLabel = (e) => {
    const f = e?.fname ?? e?.Fname ?? "";
    const l = e?.lname ?? e?.Lname ?? "";
    const u = e?.username ?? e?.Username ?? "";
    const name = (f || l) ? `${f} ${l}`.trim() : (u || "Çalışan");
    const id = empId(e);
    return id ? `${name} (${id})` : name;
  };

  const renderAssignees = () => {
    const rows = assignees?.length ? assignees : [""];
    return rows.map((ssn, slot) => (
      <div key={slot} style={{ display: "flex", gap: 6, marginTop: 4 }}>
        <select
          value={ssn || ""}
          onChange={(e) => onAssign?.(index, slot, e.target.value)}
        >
          <option value="">— Çalışan Seç —</option>
          {employees.map((emp) => (
            <option key={empId(emp)} value={empId(emp)}>
              {empLabel(emp)}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => onRemoveAssignee?.(index, slot)}
          title="Bu kişiyi kaldır"
        >
          Sil
        </button>
      </div>
    ));
  };

  return (
    <li style={{ marginBottom: ".5rem" }}>
      <label>
        <input
          type="checkbox"
          checked={done}
          disabled={!isAdmin}
          onChange={() => onToggle?.(index)}
        />{" "}
        {desc} ( %{importance} )
      </label>

      {isAdmin && (
        <div style={{ marginTop: ".35rem" }}>
          {renderAssignees()}
          <button
            type="button"
            style={{ marginTop: 6 }}
            onClick={() => onAddAssignee?.(index)}
          >
            + Kişi Ekle
          </button>
        </div>
      )}
    </li>
  );
}

export default TaskItem;
