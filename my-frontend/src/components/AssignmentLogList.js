import React, { useEffect, useState } from "react";

function AssignmentLogList() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAssignmentLogs = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/AssignmentLogs`);
      if (!response.ok) throw new Error("API request failed.");
      const data = await response.json();
      setLogs(data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAssignmentLogs();
  }, []);

  return (
    <div className="section">

      <h2>Assignment Logs</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul>
          {logs.map((log) => (
            <li key={log.logID} style={{ marginBottom: "1rem" }}>
              <p>
                <strong>Employee:</strong> {log.employee?.fname ?? "Unknown"}{" "}
                {log.employee?.lname ?? ""} —{" "}
                <strong>Department:</strong> {log.employee?.department?.dname ?? "Unknown"}
              </p>
              <p>
                <strong>Task:</strong> {log.task?.taskName ?? "Unnamed Task"} (Start:{" "}
                {log.task?.start_date ? new Date(log.task.start_date).toLocaleDateString() : "?"}, End:{" "}
                {log.task?.due_date ? new Date(log.task.due_date).toLocaleDateString() : "?"})
              </p>
              <p>
                <strong>Completion:</strong> %{log.task?.completion_rate ?? "-"},{" "}
                <strong>Note:</strong> -
              </p>
              <hr />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default AssignmentLogList;
