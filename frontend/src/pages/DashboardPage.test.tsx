import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { DashboardPage } from './DashboardPage';
import { WorkspaceContext } from '../contexts/WorkspaceContext';
import { apiDefinitionsApi } from '../api/api-definitions';
import '@testing-library/jest-dom';

// Mock the API
jest.mock('../api/api-definitions');

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
          setCurrentWorkspace: jest.fn(),
          loadWorkspaces: jest.fn(),
        }}
      >
        {component}
      </WorkspaceContext.Provider>
    </BrowserRouter>
  );
};

describe('DashboardPage', () => {
  beforeEach(() => {
    (apiDefinitionsApi.getAll as jest.Mock).mockResolvedValue({
      data: mockApis,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders dashboard title', async () => {
    renderWithContext(<DashboardPage />);

    expect(screen.getByText('Mock APIs')).toBeInTheDocument();
  });

  it('loads and displays APIs', async () => {
    renderWithContext(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Test API')).toBeInTheDocument();
    });
  });

  it('shows create and import buttons', () => {
    renderWithContext(<DashboardPage />);

    expect(screen.getByText('+ Create API')).toBeInTheDocument();
    expect(screen.getByText('Import JSON')).toBeInTheDocument();
  });

  it('shows empty state when no APIs', async () => {
    (apiDefinitionsApi.getAll as jest.Mock).mockResolvedValue({
      data: [],
    });

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
    (apiDefinitionsApi.getAll as jest.Mock).mockRejectedValue(
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

