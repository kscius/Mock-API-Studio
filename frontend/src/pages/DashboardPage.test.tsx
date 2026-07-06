import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { DashboardPage } from './DashboardPage';
import { WorkspaceContext } from '../contexts/WorkspaceContext';
import { apiDefinitionsApi } from '../api/api-definitions';
import '@testing-library/jest-dom';

vi.mock('../api/api-definitions', () => ({
  apiDefinitionsApi: {
    getAll: vi.fn(),
  },
}));

const mockWorkspace = {
  id: 'ws-1',
  name: 'Test Workspace',
  slug: 'test-ws',
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
};

const mockApis = [
  {
    id: '1',
    workspaceId: 'ws-1',
    name: 'Test API',
    slug: 'test-api',
    version: '1.0.0',
    basePath: '/',
    isActive: true,
    tags: ['test'],
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
];

const renderWithContext = (component: React.ReactNode) => {
  return render(
    <BrowserRouter>
      <WorkspaceContext.Provider
        value={{
          currentWorkspace: mockWorkspace,
          workspaces: [mockWorkspace],
          setCurrentWorkspace: vi.fn(),
          refreshWorkspaces: vi.fn().mockResolvedValue(undefined),
          loading: false,
        }}
      >
        {component}
      </WorkspaceContext.Provider>
    </BrowserRouter>
  );
};

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.mocked(apiDefinitionsApi.getAll).mockResolvedValue({
      data: mockApis,
    } as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders dashboard title', async () => {
    renderWithContext(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Mock APIs')).toBeInTheDocument();
    });
  });

  it('loads and displays APIs', async () => {
    renderWithContext(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Test API')).toBeInTheDocument();
    });
  });

  it('shows create and import buttons', async () => {
    renderWithContext(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('+ Create API')).toBeInTheDocument();
      expect(screen.getByText('Import JSON')).toBeInTheDocument();
    });
  });

  it('shows empty state when no APIs', async () => {
    vi.mocked(apiDefinitionsApi.getAll).mockResolvedValue({
      data: [],
    } as any);

    renderWithContext(<DashboardPage />);

    await waitFor(() => {
      expect(
        screen.getByText(
          'No APIs found. Create your first API to get started!'
        )
      ).toBeInTheDocument();
    });
  });

  it('handles API fetch error', async () => {
    vi.mocked(apiDefinitionsApi.getAll).mockRejectedValue(
      new Error('Network error')
    );

    renderWithContext(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load APIs')).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    renderWithContext(<DashboardPage />);

    expect(screen.getByText('Loading APIs...')).toBeInTheDocument();
  });
});
