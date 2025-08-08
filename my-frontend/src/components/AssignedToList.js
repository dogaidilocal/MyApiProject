import React, { useEffect, useState } from "react";

function AssignedToList() {
  const [assignedToList, setAssignedToList] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`${process.env.REACT_APP_API_URL}/api/AssignedTo/all`)
      .then((res) => res.json())
      .then((data) => {
        console.log("AssignedTo data:", data);
        setAssignedToList(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        setLoading(false);
      });
  }, []);

  return (
    <div className="section">
      <h2>Task Assignments</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul>
          {assignedToList.map((item, index) => (
            <li key={index}>
              <p>
                <strong>Employee:</strong> {item.employee?.fname ?? "Unknown"} —{" "}
                <strong>Department:</strong> {item.employee?.department?.dname ?? "Unknown"}
              </p>
              <p>
                <strong>Task:</strong> {item.task?.taskName ?? "Unnamed Task"} (Start:{" "}
                {item.task?.start_date ?? "?"}, End: {item.task?.due_date ?? "?"})
              </p>
              <hr />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default AssignedToList;
