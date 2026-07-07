import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Workspace } from '../api/types';
import { workspacesApi } from '../api/workspaces';
import { useAuth } from './AuthContext';

interface WorkspaceContextType {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  setCurrentWorkspace: (workspace: Workspace) => void;
  loading: boolean;
  refreshWorkspaces: () => Promise<void>;
}

export const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspaceState] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshWorkspaces = async () => {
    try {
      const data = await workspacesApi.getAll();
      setWorkspaces(data);
      
      // If no current workspace, set the first one
      if (!currentWorkspace && data.length > 0) {
        const savedWorkspaceId = localStorage.getItem('currentWorkspaceId');
        const workspace = data.find(w => w.id === savedWorkspaceId) || data[0];
        setCurrentWorkspaceState(workspace);
      }
    } catch (error) {
      console.error('Failed to load workspaces:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (isAuthenticated) {
      void refreshWorkspaces();
      return;
    }

    setLoading(false);
  }, [authLoading, isAuthenticated]);

  const setCurrentWorkspace = (workspace: Workspace) => {
    setCurrentWorkspaceState(workspace);
    localStorage.setItem('currentWorkspaceId', workspace.id);
  };

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        currentWorkspace,
        setCurrentWorkspace,
        loading,
        refreshWorkspaces,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within WorkspaceProvider');
  }
  return context;
};

