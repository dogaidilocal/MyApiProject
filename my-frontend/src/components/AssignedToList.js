import React, { useEffect, useState } from "react";

function AssignedToList() {
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
  const [assignedToList, setAssignedToList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // küçük yardımcılar (field isimleri PascalCase/camelCase gelebilir)
  const getSSN = (x) => x?.SSN ?? x?.ssn ?? x?.Ssn ?? "";
  const getFname = (x) => x?.Fname ?? x?.fname ?? x?.firstName ?? "";
  const getLname = (x) => x?.Lname ?? x?.lname ?? x?.lastName ?? "";
  const getDept =  (x) => x?.Department?.Dname ?? x?.department?.dname ?? "";
  const getTask   = (x) => x?.Task ?? x?.task ?? null;
  const getTaskName = (t) => t?.TaskName ?? t?.taskName ?? t?.name ?? "";
  const getDateStr = (d) => (d ? String(d).slice(0, 10) : "—");

  useEffect(() => {
    const controller = new AbortController();
    const token = localStorage.getItem("token");

    const fetchData = async () => {
      try {
        setLoading(true);
        setErr("");

        const res = await fetch(`${API_URL}/api/AssignedTo/all`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          signal: controller.signal,
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`API ${res.status}: ${text || "İstek başarısız"}`);
        }

        const data = await res.json();
        if (!Array.isArray(data)) {
          throw new Error("API beklenen formatta bir liste döndürmedi.");
        }
        setAssignedToList(data);
      } catch (e) {
        if (e.name !== "AbortError") {
          console.error("AssignedTo fetch error:", e);
          setErr(e.message || "Veri alınamadı.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    return () => controller.abort();
  }, [API_URL]);

  return (
    <div className="section">
      <h2>Task Assignments</h2>

      {loading && <p>Loading...</p>}
      {err && <p style={{ color: "red" }}>Hata: {err}</p>}

      {!loading && !err && (
        <ul style={{ padding: 0, listStyle: "none" }}>
          {assignedToList.map((item, idx) => {
            // farklı isimlendirme olasılıklarına göre alanları toparla
            const employee =
              item.Employee ?? item.employee ?? item.emp ?? {};
            const taskObj = getTask(item);

            const ssn = getSSN(item) || getSSN(employee);
            const fname = getFname(employee);
            const lname = getLname(employee);
            const deptName = getDept(employee);

            const taskName = getTaskName(taskObj);
            const start = getDateStr(taskObj?.Start_date ?? taskObj?.start_date);
            const due = getDateStr(taskObj?.Due_date ?? taskObj?.due_date);

            const todoIndex =
              item?.TodoIndex ?? item?.todoIndex ?? item?.todoindex ?? "—";

            return (
              <li
                key={idx}
                style={{
                  border: "1px solid #e0e0e0",
                  borderRadius: 8,
                  padding: "12px 14px",
                  marginBottom: 10,
                  background: "#fafafa",
                }}
              >
                <p style={{ margin: 0 }}>
                  <strong>Employee:</strong>{" "}
                  {fname || lname ? `${fname} ${lname}`.trim() : "Unknown"}{" "}
                  {ssn ? `(${ssn})` : ""}
                  {" — "}
                  <strong>Department:</strong> {deptName || "Unknown"}
                </p>

                <p style={{ margin: "6px 0 0" }}>
                  <strong>Task:</strong> {taskName || "Unnamed Task"}{" "}
                  <span style={{ opacity: 0.8 }}>
                    {`(Start: ${start}, End: ${due})`}
                  </span>
                </p>

                <p style={{ margin: "6px 0 0" }}>
                  <strong>TodoIndex:</strong> {todoIndex}
                </p>
              </li>
            );
          })}
          {assignedToList.length === 0 && (
            <li>Listelenecek atama bulunamadı.</li>
          )}
        </ul>
      )}
    </div>
  );
}

export default AssignedToList;
