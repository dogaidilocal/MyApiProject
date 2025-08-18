// src/pages/ProjectsPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import ProjectList from "../components/ProjectList";
import ProjectDetails from "../components/ProjectDetails";
import SidebarWidgets from "../components/SidebarWidgets";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

function normalizeProject(raw) {
  if (!raw) return null;
  const pnumber = raw.pnumber ?? raw.Pnumber;
  const pname = raw.pname ?? raw.Pname;
  const start_date = raw.start_date ?? raw.Start_date ?? null;
  const due_date = raw.due_date ?? raw.Due_date ?? null;
  const completion_status = raw.completion_status ?? raw.Completion_status ?? 0;
  const dnumber = raw.dnumber ?? raw.Dnumber;

  const leaderRaw = raw.leader ?? raw.Leader ?? null;
  const leader = leaderRaw
    ? {
        leaderSSN:
          leaderRaw.leaderSSN ??
          leaderRaw.LeaderSSN ??
          leaderRaw.leaderId ??
          leaderRaw.LeaderID ??
          null,
        fullName: leaderRaw.fullName ?? leaderRaw.FullName ?? null,
      }
    : null;

  const tasksRaw = raw.tasks ?? raw.Tasks ?? [];
  const tasks = (Array.isArray(tasksRaw) ? tasksRaw : []).map((t) => ({
    taskID: t.taskID ?? t.TaskID,
    taskName: t.taskName ?? t.TaskName,
    start_date: t.start_date ?? t.Start_date ?? null,
    due_date: t.due_date ?? t.Due_date ?? null,
    completion_rate: t.completion_rate ?? t.Completion_rate ?? 0,
    task_number: t.task_number ?? t.Task_number ?? 0,
    todos: (t.todos ?? t.Todos ?? []).map((td) => ({
      todoIndex: td.todoIndex ?? td.TodoIndex,
      description: td.description ?? td.Description ?? "",
      importance: td.importance ?? td.Importance ?? 0,
      isCompleted: td.isCompleted ?? td.IsCompleted ?? false,
    })),
  }));

  return {
    pnumber,
    pname,
    start_date,
    due_date,
    completion_status,
    dnumber,
    leader,
    tasks,
  };
}

function normalizeEmployee(e) {
  if (!e) return null;
  return {
    ssn: e.ssn ?? e.SSN ?? "",
    fname: e.fname ?? e.Fname ?? "",
    lname: e.lname ?? e.Lname ?? "",
    dno: e.dno ?? e.Dno ?? null,
    department: e.department ?? e.Department ?? null,
  };
}

function normalizeDepartment(d) {
  if (!d) return null;
  return {
    dnumber: d.dnumber ?? d.Dnumber,
    dname: d.dname ?? d.Dname,
  };
}

const ProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [selectedPNumber, setSelectedPNumber] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState({ projects: false, employees: false, departments: false });
  const [err, setErr] = useState("");

  const token = localStorage.getItem("token") || "";
  const role = (localStorage.getItem("role") || "").toLowerCase();
  const isAdmin = role === "admin";

  // Projeler
  useEffect(() => {
    const fetchProjects = async () => {
      setLoading((s) => ({ ...s, projects: true }));
      setErr("");
      try {
        const res = await fetch(`${API_URL}/api/ProjectsWithTasks`, {
          // ÖNEMLİ: GET’te Content-Type gönderme => preflight’a gerek yok
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!res.ok) throw new Error(`ProjectsWithTasks HTTP ${res.status}`);
        const data = await res.json();
        const norm = (Array.isArray(data) ? data : []).map(normalizeProject);
        setProjects(norm);
        if (norm.length && selectedPNumber == null) {
          setSelectedPNumber(norm[0].pnumber);
        }
      } catch (e) {
        console.error(e);
        setErr(e.message || "Projeler yüklenemedi.");
      } finally {
        setLoading((s) => ({ ...s, projects: false }));
      }
    };
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Çalışanlar
  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading((s) => ({ ...s, employees: true }));
      try {
        const res = await fetch(`${API_URL}/api/Employees`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!res.ok) throw new Error(`Employees HTTP ${res.status}`);
        const data = await res.json();
        setEmployees((Array.isArray(data) ? data : []).map(normalizeEmployee));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading((s) => ({ ...s, employees: false }));
      }
    };
    fetchEmployees();
  }, [token]);

  // Departmanlar
  useEffect(() => {
    const fetchDepartments = async () => {
      setLoading((s) => ({ ...s, departments: true }));
      try {
        const res = await fetch(`${API_URL}/api/Departments`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!res.ok) throw new Error(`Departments HTTP ${res.status}`);
        const data = await res.json();
        setDepartments((Array.isArray(data) ? data : []).map(normalizeDepartment));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading((s) => ({ ...s, departments: false }));
      }
    };
    fetchDepartments();
  }, [token]);

  const selectedProject = useMemo(
    () => projects.find((p) => p.pnumber === selectedPNumber) || null,
    [projects, selectedPNumber]
  );

  const handleAddProject = (createdRaw) => {
    const created = normalizeProject(createdRaw);
    setProjects((prev) => {
      const exists = prev.some((p) => p.pnumber === created.pnumber);
      const next = exists
        ? prev.map((p) => (p.pnumber === created.pnumber ? created : p))
        : [created, ...prev];
      setSelectedPNumber(created.pnumber);
      return next;
    });
  };

  return (
    <div style={{ display: "flex", gap: "2rem", alignItems: "flex-start" }}>
      <ProjectList
        projects={projects}
        onSelect={(p) => setSelectedPNumber(p.pnumber)}
        isAdmin={isAdmin}
        onAdd={handleAddProject}
      />

      <div style={{ flex: 2 }}>
        {loading.projects && <p>Projeler yükleniyor…</p>}
        {err && <p style={{ color: "red" }}>Hata: {err}</p>}

        {!loading.projects && !err && (
          selectedProject ? (
            <ProjectDetails project={selectedProject} token={token} role={role} />
          ) : (
            <p>Bir proje seçiniz.</p>
          )
        )}
      </div>

      <SidebarWidgets
        employees={employees}
        departments={departments}
        loading={{ employees: loading.employees, departments: loading.departments }}
      />
    </div>
  );
};

export default ProjectsPage;
