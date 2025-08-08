import React, { useEffect, useState } from "react";

function EmployeeList() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem("token");

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/Employees`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setEmployees(data);
    } catch (error) {
      console.error("Çalışanlar yüklenemedi:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  return (
    <div className="section">
      <h2>Çalışanlar</h2>
      {loading && <p>Yükleniyor...</p>}
      {!loading && (
        <ul>
          {employees.map((emp) => (
            <li key={emp.ssn}>
              <strong>{emp.fname} {emp.lname}</strong> — Departman ID: {emp.dno}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default EmployeeList;
