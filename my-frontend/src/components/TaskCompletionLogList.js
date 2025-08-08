import React, { useEffect, useState } from "react";

function TaskCompletionLogList() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/TaskCompletionLogs`);
      if (!response.ok) throw new Error("API request failed.");
      const data = await response.json();
      setLogs(data);
    } catch (error) {
      console.error("Error fetching task completion logs:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="section">

      <h2>Task Completion Records</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul>
          {logs.map((log) => (
            <li key={log.logID} style={{ marginBottom: "1rem" }}>
              <p><strong>Employee:</strong> {log.employee?.ename || "Unknown"} — <strong>Department:</strong> {log.employee?.department?.dname || "Unknown"}</p>
              <p><strong>Task:</strong> {log.task?.tname || "No task name"} (Start: {log.task?.start_date ? new Date(log.task.start_date).toLocaleDateString() : "?"}, End: {log.task?.end_date ? new Date(log.task.end_date).toLocaleDateString() : "?"})</p>
              <p><strong>Completion:</strong> %{log.completionRate ?? "-"}, <strong>Grade:</strong> {log.mark ?? "-"}</p>
              <hr />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default TaskCompletionLogList;
