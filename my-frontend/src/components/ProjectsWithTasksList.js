import React, { useEffect, useState } from "react";

const ProjectsWithTasksList = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);

  const calculateCompletionRate = (tasks) => {
    if (!tasks?.length) return 0;
    const valid = tasks.map(t => parseFloat(t.completion_rate) || 0);
    const sum = valid.reduce((a, b) => a + b, 0);
    return Math.round(sum / valid.length);
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/ProjectsWithTasks`);
      const data = await res.json();
      setProjects(data);
      setLoading(false);
    })();
  }, []);

  return (
    <div style={{ flex: 2 }}>
      <h2>Projeler ve Görevler</h2>
      {loading ? <p>Yükleniyor...</p> :
        <ul>
          {projects.map((proj) => (
            <li key={proj.pnumber} style={{ marginBottom: "2rem" }}>
              <strong>{proj.pname}</strong> — Tamamlanma: %{calculateCompletionRate(proj.tasks)}
              <ul>
                {proj.tasks.map((t) => (
                  <li key={t.taskID}>
                    {t.taskName} — %{t.completion_rate || 0}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      }
    </div>
  );
};

export default ProjectsWithTasksList;
