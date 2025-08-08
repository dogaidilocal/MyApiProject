import React, { useEffect, useState } from 'react';
import ProjectList from '../components/ProjectList';
import ProjectDetails from '../components/ProjectDetails';
import SidebarWidgets from '../components/SidebarWidgets';

const ProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [selected, setSelected] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5062/api/ProjectsWithTasks')
      .then(res => res.json())
      .then(data => setProjects(data));

    fetch('http://localhost:5062/api/Employees')
      .then(res => res.json())
      .then(data => setEmployees(data));

    fetch('http://localhost:5062/api/Departments')
      .then(res => res.json())
      .then(data => setDepartments(data));
  }, []);

  const selectedProject = projects.find(p => p.pnumber === selected);

  return (
    <div style={{ display: 'flex', gap: '2rem' }}>
      <ProjectList projects={projects} onSelectProject={setSelected} />
      <ProjectDetails project={selectedProject} />
      <SidebarWidgets employees={employees} departments={departments} />
    </div>
  );
};

export default ProjectsPage;
