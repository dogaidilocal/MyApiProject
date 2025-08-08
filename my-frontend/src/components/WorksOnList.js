import React, { useEffect, useState } from "react";

function WorksOnList() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchWorksOn = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/WorksOn`);
      if (!response.ok) {
        throw new Error("API request failed.");
      }
      const data = await response.json();
      setRecords(data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchWorksOn();
  }, []);

  return (
    <div className="section">

      <h2>Work Assignments</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul>
          {records.map((item, index) => (
            <li key={index}>
              <p>
                <strong>Employee:</strong> {item.employee?.fname ?? ""} {item.employee?.lname ?? ""} —{" "}
                <strong>Department:</strong> {item.employee?.department?.dname ?? "Unknown"}
              </p>
              <p>
                <strong>Project:</strong> {item.project?.pname ?? "Unknown"} (Start:{" "}
                {item.project?.start_date ? new Date(item.project.start_date).toLocaleDateString() : "?"}, End:{" "}
                {item.project?.due_date ? new Date(item.project.due_date).toLocaleDateString() : "?"})
              </p>
              <p>
                <strong>Completion:</strong> %{item.project?.completion_status ?? "-"}
              </p>
              <hr />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default WorksOnList;
