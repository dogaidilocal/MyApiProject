// TaskItem.js
import React from "react";

function TaskItem({ todo, isAdmin, onToggle, onAssign }) {
  return (
    <li>
      <label>
        <input type="checkbox" checked={todo.done} onChange={onToggle} />{" "}
        {todo.description} (Importance: %{todo.importance})
      </label>
      {isAdmin && (
        <select value={todo.responsibleEmployeeId || ""} onChange={onAssign}>
          <option value="">Atama Yok</option>
          {/* çalışan listesi */}
        </select>
      )}
    </li>
  );
}

export default TaskItem;
