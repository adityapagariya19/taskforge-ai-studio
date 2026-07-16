import { createContext, useContext, useState, ReactNode } from 'react';

interface ProjectContextValue {
  activeProjectId: string | null;
  setActiveProjectId: (id: string | null) => void;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [activeProjectId, setActiveProjectId] = useState<string | null>(
    () => localStorage.getItem('tf_active_project_id')
  );

  function set(id: string | null) {
    if (id) localStorage.setItem('tf_active_project_id', id);
    else localStorage.removeItem('tf_active_project_id');
    setActiveProjectId(id);
  }

  return (
    <ProjectContext.Provider value={{ activeProjectId, setActiveProjectId: set }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProject must be used within ProjectProvider');
  return ctx;
}
