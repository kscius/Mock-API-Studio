import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auditLogsApi } from '../api/audit-logs';
import { AuditLog } from '../api/types';
import toast from 'react-hot-toast';
import './AuditLogsPage.css';

export function AuditLogsPage() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [loading, setLoading] = useState(false);

  // Filters
  const [workspaceFilter, setWorkspaceFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Expanded row
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  useEffect(() => {
    loadLogs();
  }, [page, workspaceFilter, userFilter, actionFilter, entityTypeFilter, startDate, endDate]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: page.toString(),
        limit: limit.toString(),
      };

      if (workspaceFilter) params.workspaceId = workspaceFilter;
      if (userFilter) params.userId = userFilter;
      if (actionFilter) params.action = actionFilter;
      if (entityTypeFilter) params.entityType = entityTypeFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await auditLogsApi.getAuditLogs(params);
      setLogs(response.data.data);
      setTotal(response.data.total);
    } catch (error: any) {
      console.error('Failed to load audit logs:', error);
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setWorkspaceFilter('');
    setUserFilter('');
    setActionFilter('');
    setEntityTypeFilter('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const exportToCSV = () => {
    const csvHeaders = ['Date', 'User', 'Action', 'Entity Type', 'Entity Name', 'IP Address', 'User Agent'];
    const csvRows = logs.map(log => [
      new Date(log.createdAt).toLocaleString(),
      log.user?.name || log.userId || 'System',
      log.action,
      log.entityType,
      log.entityName || log.entityId,
      log.ipAddress || '',
      log.userAgent || '',
    ]);

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported to CSV');
  };

  const exportToJSON = () => {
    const json = JSON.stringify(logs, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported to JSON');
  };

  const toggleRow = (logId: string) => {
    setExpandedRow(expandedRow === logId ? null : logId);
  };

  const getActionBadgeClass = (action: string) => {
    switch (action) {
      case 'create': return 'badge-success';
      case 'update': return 'badge-warning';
      case 'delete': return 'badge-danger';
      case 'duplicate': return 'badge-info';
      default: return 'badge-secondary';
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="audit-logs-page">
      <header className="page-header">
        <h1>Audit Logs</h1>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={exportToCSV}>
            Export CSV
          </button>
          <button className="btn btn-secondary" onClick={exportToJSON}>
            Export JSON
          </button>
        </div>
      </header>

      {/* Filters */}
      <div className="filters-container">
        <div className="filters-grid">
          <div className="filter-group">
            <label>Action</label>
            <select
              className="input"
              value={actionFilter}
              onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
            >
              <option value="">All</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
              <option value="duplicate">Duplicate</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Entity Type</label>
            <select
              className="input"
              value={entityTypeFilter}
              onChange={(e) => { setEntityTypeFilter(e.target.value); setPage(1); }}
            >
              <option value="">All</option>
              <option value="api">API</option>
              <option value="endpoint">Endpoint</option>
              <option value="workspace">Workspace</option>
              <option value="webhook">Webhook</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Start Date</label>
            <input
              type="date"
              className="input"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
            />
          </div>

          <div className="filter-group">
            <label>End Date</label>
            <input
              type="date"
              className="input"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
            />
          </div>
        </div>

        <button className="btn btn-secondary btn-sm" onClick={resetFilters}>
          Reset Filters
        </button>
      </div>

      {/* Table */}
      <div className="table-container">
        {loading ? (
          <div className="loading">Loading...</div>
        ) : logs.length === 0 ? (
          <div className="empty-state">
            <p>No audit logs found.</p>
          </div>
        ) : (
          <table className="audit-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>User</th>
                <th>Action</th>
                <th>Entity Type</th>
                <th>Entity Name</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <>
                  <tr key={log.id} onClick={() => toggleRow(log.id)} className="clickable-row">
                    <td>{new Date(log.createdAt).toLocaleString()}</td>
                    <td>{log.user?.name || log.userId || 'System'}</td>
                    <td>
                      <span className={`badge ${getActionBadgeClass(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td>{log.entityType}</td>
                    <td>{log.entityName || log.entityId}</td>
                    <td>
                      <button className="btn-link">
                        {expandedRow === log.id ? '▼ Hide' : '▶ Show'}
                      </button>
                    </td>
                  </tr>
                  {expandedRow === log.id && (
                    <tr className="expanded-row">
                      <td colSpan={6}>
                        <div className="expanded-content">
                          <div className="detail-grid">
                            <div className="detail-item">
                              <strong>Entity ID:</strong>
                              <span>{log.entityId}</span>
                            </div>
                            <div className="detail-item">
                              <strong>IP Address:</strong>
                              <span>{log.ipAddress || 'N/A'}</span>
                            </div>
                            <div className="detail-item">
                              <strong>User Agent:</strong>
                              <span className="user-agent">{log.userAgent || 'N/A'}</span>
                            </div>
                            <div className="detail-item">
                              <strong>Timestamp:</strong>
                              <span>{new Date(log.createdAt).toISOString()}</span>
                            </div>
                          </div>

                          {log.changes && (
                            <div className="changes-section">
                              <strong>Changes:</strong>
                              <pre className="changes-json">
                                {JSON.stringify(log.changes, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
          >
            Previous
          </button>
          <span className="pagination-info">
            Page {page} of {totalPages} (Total: {total} logs)
          </span>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

