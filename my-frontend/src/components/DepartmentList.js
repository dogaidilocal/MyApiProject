import React, { useEffect, useState } from "react";

function DepartmentList() {
  const [departments, setDepartments] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

    fetch(`${API_URL}/api/Departments`, {
      headers: {
        "Authorization": `Bearer ${token}`,  // 🔑 token ekle
        "Content-Type": "application/json"
      }
    })
      .then((res) => {
        if (!res.ok) throw new Error("API hatası");
        return res.json();
      })
      .then((data) => setDepartments(data))
      .catch((err) => {
        console.error("Departman çekme hatası:", err);
        setError("Departman çekme hatası: API JSON formatında cevap vermedi!");
      });
  }, []);

  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <ul>
      {departments.map((d) => (
        <li key={d.dnumber}>{d.dname}</li>
      ))}
    </ul>
  );
}

export default DepartmentList;
