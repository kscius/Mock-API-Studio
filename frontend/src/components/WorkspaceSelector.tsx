import React from 'react';
import { useWorkspace } from '../contexts/WorkspaceContext';

export const WorkspaceSelector: React.FC = () => {
  const { workspaces, currentWorkspace, setCurrentWorkspace, loading } = useWorkspace();

  if (loading) {
    return <div style={{ padding: '10px' }}>Loading workspaces...</div>;
  }

  return (
    <div style={{ 
      padding: '10px 20px', 
      borderBottom: '1px solid #e0e0e0',
      backgroundColor: '#f5f5f5',
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    }}>
      <label htmlFor="workspace-select" style={{ fontWeight: 'bold' }}>
        Workspace:
      </label>
      <select
        id="workspace-select"
        value={currentWorkspace?.id || ''}
        onChange={(e) => {
          const workspace = workspaces.find(w => w.id === e.target.value);
          if (workspace) {
            setCurrentWorkspace(workspace);
          }
        }}
        style={{
          padding: '8px 12px',
          fontSize: '14px',
          borderRadius: '4px',
          border: '1px solid #ccc',
          backgroundColor: 'white',
          cursor: 'pointer',
        }}
      >
        {workspaces.map(workspace => (
          <option key={workspace.id} value={workspace.id}>
            {workspace.name} ({workspace.slug})
          </option>
        ))}
      </select>
      <span style={{ fontSize: '12px', color: '#666' }}>
        {currentWorkspace && `${currentWorkspace._count?.apiDefinitions || 0} APIs`}
      </span>
    </div>
  );
};

