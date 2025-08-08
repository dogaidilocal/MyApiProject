import React, { useEffect, useState } from "react";

function ProjectLeaderList() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchLeaders = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/ProjectLeaders`);
      if (!response.ok) throw new Error("API request failed.");
      const data = await response.json();
      setLeaders(data);
    } catch (error) {
      console.error("Error fetching project leaders:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLeaders();
  }, []);

  return (
    <div className="section">

      <h2>Project Leaders</h2>
      {loading ? (
        <p>Loading...</p>
      ) : leaders.length === 0 ? (
        <p>No project leader records found.</p>
      ) : (
        <ul>
          {leaders.map((leader, index) => (
            <li key={index}>
              <strong>
                {leader.employee?.fname ?? "First Name"} {leader.employee?.lname ?? "Last Name"}
              </strong>{" "}
              — Department: {leader.employee?.department?.dname ?? "Unknown"} — Project:{" "}
              {leader.project?.pname ?? `ID: ${leader.pnumber}`} — Start Date:{" "}
              {leader.start_date ? new Date(leader.start_date).toLocaleDateString() : "?"}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ProjectLeaderList;
