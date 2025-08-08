import React, { useEffect, useState } from "react";

function TaskList() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/Tasks`);
      if (!response.ok) throw new Error("API request failed.");
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  return (
    <div className="section">

      <h2>Task List</h2>
      {loading ? (
        <p>Loading...</p>
      ) : tasks.length === 0 ? (
        <p>No tasks found.</p>
      ) : (
        <ul>
          {tasks.map((task) => (
            <li key={task.taskID}>
              <strong>{task.taskName ?? "No Task Name"}</strong> (ID: {task.taskID})
              <br />
              Dates:{" "}
              {task.start_date
                ? new Date(task.start_date).toLocaleDateString()
                : "?"}{" "}
              –{" "}
              {task.end_date
                ? new Date(task.end_date).toLocaleDateString()
                : "?"}
              <br />
              Completion: %{task.completion_rate ?? 0}, Grade: {task.mark ?? "-"}
              <br />
              Project ID: {task.pnumber}
              <hr />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default TaskList;
