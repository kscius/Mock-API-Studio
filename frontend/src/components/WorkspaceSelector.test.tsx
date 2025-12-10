import { render, screen } from '@testing-library/react';
import { WorkspaceSelector } from './WorkspaceSelector';
import { WorkspaceContext } from '../contexts/WorkspaceContext';
import '@testing-library/jest-dom';

const mockWorkspaces = [
  {
    id: 'ws-1',
    name: 'Workspace 1',
    slug: 'ws-1',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: 'ws-2',
    name: 'Workspace 2',
    slug: 'ws-2',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
];

describe('WorkspaceSelector', () => {
  it('renders current workspace name', () => {
    render(
      <WorkspaceContext.Provider
        value={{
          currentWorkspace: mockWorkspaces[0],
          workspaces: mockWorkspaces,
          setCurrentWorkspace: jest.fn(),
          loadWorkspaces: jest.fn(),
        }}
      >
        <WorkspaceSelector />
      </WorkspaceContext.Provider>
    );

    expect(screen.getByText(/Workspace 1/)).toBeInTheDocument();
  });

  it('renders default text when no workspace selected', () => {
    render(
      <WorkspaceContext.Provider
        value={{
          currentWorkspace: null,
          workspaces: mockWorkspaces,
          setCurrentWorkspace: jest.fn(),
          loadWorkspaces: jest.fn(),
        }}
      >
        <WorkspaceSelector />
      </WorkspaceContext.Provider>
    );

    expect(screen.getByText(/Select Workspace/)).toBeInTheDocument();
  });
});

