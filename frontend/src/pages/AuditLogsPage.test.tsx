import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuditLogsPage } from './AuditLogsPage';
import { auditLogsApi } from '../api/audit-logs';

vi.mock('../api/audit-logs', () => ({
  auditLogsApi: {
    getAuditLogs: vi.fn(),
  },
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockAuditLogs = {
  data: [
    {
      id: '1',
      workspaceId: 'ws-1',
      userId: 'user-1',
      user: { id: 'user-1', name: 'John Doe', email: 'john@example.com' },
      action: 'create',
      entityType: 'api',
      entityId: 'api-1',
      entityName: 'Test API',
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
      createdAt: '2024-01-15T10:00:00Z',
    },
    {
      id: '2',
      workspaceId: 'ws-1',
      userId: 'user-2',
      user: { id: 'user-2', name: 'Jane Smith', email: 'jane@example.com' },
      action: 'update',
      entityType: 'endpoint',
      entityId: 'endpoint-1',
      entityName: '/users/:id',
      ipAddress: '192.168.1.2',
      userAgent: 'Chrome/90.0',
      createdAt: '2024-01-15T11:00:00Z',
    },
  ],
  total: 2,
  page: 1,
  limit: 20,
};

describe('AuditLogsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (auditLogsApi.getAuditLogs as any).mockResolvedValue({ data: mockAuditLogs });
  });

  const renderPage = () => {
    return render(
      <BrowserRouter>
        <AuditLogsPage />
      </BrowserRouter>
    );
  };

  it('should render the page title', async () => {
    renderPage();
    expect(screen.getByText('Audit Logs')).toBeInTheDocument();
  });

  it('should load and display audit logs', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  it('should display action badges with correct styling', async () => {
    renderPage();

    await waitFor(() => {
      const createBadge = screen.getByText('create');
      const updateBadge = screen.getByText('update');

      expect(createBadge).toHaveClass('badge-success');
      expect(updateBadge).toHaveClass('badge-warning');
    });
  });

  it('should display entity types and names', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('api')).toBeInTheDocument();
      expect(screen.getByText('endpoint')).toBeInTheDocument();
      expect(screen.getByText('Test API')).toBeInTheDocument();
      expect(screen.getByText('/users/:id')).toBeInTheDocument();
    });
  });

  it('should expand row details when clicked', async () => {
    renderPage();

    await waitFor(() => {
      const showButton = screen.getAllByText(/▶ Show/i)[0];
      fireEvent.click(showButton);
    });

    await waitFor(() => {
      expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
      expect(screen.getByText('Mozilla/5.0')).toBeInTheDocument();
    });
  });

  it('should filter by action', async () => {
    renderPage();

    await waitFor(() => {
      const actionFilter = screen.getByLabelText(/action/i);
      fireEvent.change(actionFilter, { target: { value: 'create' } });
    });

    await waitFor(() => {
      expect(auditLogsApi.getAuditLogs).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'create' })
      );
    });
  });

  it('should filter by entity type', async () => {
    renderPage();

    await waitFor(() => {
      const entityTypeFilter = screen.getByLabelText(/entity type/i);
      fireEvent.change(entityTypeFilter, { target: { value: 'api' } });
    });

    await waitFor(() => {
      expect(auditLogsApi.getAuditLogs).toHaveBeenCalledWith(
        expect.objectContaining({ entityType: 'api' })
      );
    });
  });

  it('should reset filters when reset button is clicked', async () => {
    renderPage();

    await waitFor(() => {
      const actionFilter = screen.getByLabelText(/action/i);
      fireEvent.change(actionFilter, { target: { value: 'create' } });
    });

    vi.clearAllMocks();

    const resetButton = screen.getByText('Reset Filters');
    fireEvent.click(resetButton);

    await waitFor(() => {
      expect(auditLogsApi.getAuditLogs).toHaveBeenCalledWith(
        expect.objectContaining({ page: '1', limit: '20' })
      );
    });
  });

  it('should export to CSV when button is clicked', async () => {
    // Mock URL.createObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();

    const mockClick = vi.fn();
    HTMLAnchorElement.prototype.click = mockClick;

    renderPage();

    await waitFor(() => {
      const exportButton = screen.getByText('Export CSV');
      fireEvent.click(exportButton);
    });

    expect(mockClick).toHaveBeenCalled();
  });

  it('should export to JSON when button is clicked', async () => {
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();

    const mockClick = vi.fn();
    HTMLAnchorElement.prototype.click = mockClick;

    renderPage();

    await waitFor(() => {
      const exportButton = screen.getByText('Export JSON');
      fireEvent.click(exportButton);
    });

    expect(mockClick).toHaveBeenCalled();
  });

  it('should display empty state when no logs found', async () => {
    (auditLogsApi.getAuditLogs as any).mockResolvedValue({
      data: { data: [], total: 0, page: 1, limit: 20 },
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('No audit logs found.')).toBeInTheDocument();
    });
  });

  it('should handle pagination', async () => {
    const mockWithPagination = {
      ...mockAuditLogs,
      total: 50,
      page: 1,
    };

    (auditLogsApi.getAuditLogs as any).mockResolvedValue({
      data: mockWithPagination,
    });

    renderPage();

    await waitFor(() => {
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);
    });

    await waitFor(() => {
      expect(auditLogsApi.getAuditLogs).toHaveBeenCalledWith(
        expect.objectContaining({ page: '2' })
      );
    });
  });

  it('should handle API error', async () => {
    (auditLogsApi.getAuditLogs as any).mockRejectedValue(
      new Error('Network error')
    );

    renderPage();

    await waitFor(() => {
      // Should still render without crashing
      expect(screen.getByText('Audit Logs')).toBeInTheDocument();
    });
  });
});

