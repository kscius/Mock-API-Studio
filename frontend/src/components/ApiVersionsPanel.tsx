import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import toast from 'react-hot-toast';

interface ApiVersion {
  id: string;
  version: string;
  isLatest: boolean;
  isActive: boolean;
  createdAt: string;
  _count?: {
    endpoints: number;
  };
}

interface Props {
  apiId: string;
  currentVersion: string;
  onVersionChange: (versionId: string) => void;
}

export function ApiVersionsPanel({ apiId, currentVersion, onVersionChange }: Props) {
  const [versions, setVersions] = useState<ApiVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newVersion, setNewVersion] = useState('');

  useEffect(() => {
    loadVersions();
  }, [apiId]);

  const loadVersions = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/admin/api-definitions/${apiId}/versions`);
      setVersions(response.data);
    } catch (err) {
      toast.error('Failed to load versions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await apiClient.post(`/admin/api-definitions/${apiId}/versions`, {
        version: newVersion,
      });
      toast.success(`Version ${newVersion} created successfully!`);
      setShowCreateModal(false);
      setNewVersion('');
      loadVersions();
      // Navigate to the new version
      onVersionChange(response.data.id);
    } catch (err: any) {
      toast.error(`Failed to create version: ${err.response?.data?.message || err.message}`);
      console.error(err);
    }
  };

  if (loading) {
    return <div>Loading versions...</div>;
  }

  return (
    <div className="card" style={{ marginTop: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600' }}>Versions</h3>
        <button className="btn btn-secondary btn-sm" onClick={() => setShowCreateModal(true)}>
          + Create Version
        </button>
      </div>

      {versions.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>No versions available</p>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {versions.map((version) => (
            <div
              key={version.id}
              style={{
                padding: '12px',
                border: version.version === currentVersion ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: version.version === currentVersion ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
              }}
              onClick={() => onVersionChange(version.id)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong style={{ fontSize: '16px' }}>v{version.version}</strong>
                    {version.isLatest && (
                      <span
                        style={{
                          padding: '2px 8px',
                          backgroundColor: '#27ae60',
                          color: 'white',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500',
                        }}
                      >
                        Latest
                      </span>
                    )}
                    {!version.isActive && (
                      <span
                        style={{
                          padding: '2px 8px',
                          backgroundColor: '#e74c3c',
                          color: 'white',
                          borderRadius: '4px',
                          fontSize: '12px',
                        }}
                      >
                        Inactive
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {version._count?.endpoints || 0} endpoints • Created{' '}
                    {new Date(version.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {version.version === currentVersion && (
                  <span style={{ color: 'var(--primary-color)', fontSize: '20px' }}>✓</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Version Modal */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div className="card" style={{ maxWidth: '500px', width: '100%', margin: '20px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px' }}>
              Create New Version
            </h2>

            <form onSubmit={handleCreateVersion}>
              <div className="form-group">
                <label className="label">Version Number</label>
                <input
                  className="input"
                  value={newVersion}
                  onChange={(e) => setNewVersion(e.target.value)}
                  placeholder="2.0.0"
                  required
                />
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
                  This will create a copy of all endpoints from the current version
                </p>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Create
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

