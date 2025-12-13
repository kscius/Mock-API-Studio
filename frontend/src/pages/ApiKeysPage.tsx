import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import toast from 'react-hot-toast';

interface ApiKey {
  id: string;
  name: string;
  scopes: string[];
  isActive: boolean;
  lastUsedAt?: string;
  expiresAt?: string;
  createdAt: string;
}

const AVAILABLE_SCOPES = [
  { value: 'read:apis', label: 'Read APIs', description: 'View API definitions' },
  { value: 'write:apis', label: 'Write APIs', description: 'Create and update APIs' },
  { value: 'delete:apis', label: 'Delete APIs', description: 'Delete API definitions' },
  { value: 'read:endpoints', label: 'Read Endpoints', description: 'View endpoints' },
  { value: 'write:endpoints', label: 'Write Endpoints', description: 'Create and update endpoints' },
  { value: 'delete:endpoints', label: 'Delete Endpoints', description: 'Delete endpoints' },
  { value: 'read:workspaces', label: 'Read Workspaces', description: 'View workspaces' },
  { value: 'write:workspaces', label: 'Write Workspaces', description: 'Create and update workspaces' },
  { value: 'read:analytics', label: 'Read Analytics', description: 'View analytics data' },
  { value: 'read:webhooks', label: 'Read Webhooks', description: 'View webhooks' },
  { value: 'write:webhooks', label: 'Write Webhooks', description: 'Create and update webhooks' },
  { value: '*', label: 'All Permissions', description: 'Full access to all resources' },
];

export function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null);

  useEffect(() => {
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/auth/api-keys');
      setApiKeys(response.data);
    } catch (err) {
      toast.error('Failed to load API keys');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await apiClient.post('/auth/api-keys', {
        name: keyName,
        scopes: selectedScopes.length > 0 ? selectedScopes : ['*'],
      });
      
      setNewKeyValue(response.data.rawKey);
      toast.success('API Key created successfully!');
      setKeyName('');
      setSelectedScopes([]);
      loadApiKeys();
    } catch (err: any) {
      toast.error(`Failed to create API key: ${err.response?.data?.message || err.message}`);
      console.error(err);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
      return;
    }

    try {
      await apiClient.delete(`/auth/api-keys/${id}`);
      toast.success('API Key revoked successfully!');
      loadApiKeys();
    } catch (err: any) {
      toast.error(`Failed to revoke API key: ${err.response?.data?.message || err.message}`);
      console.error(err);
    }
  };

  const toggleScope = (scope: string) => {
    if (scope === '*') {
      setSelectedScopes(['*']);
    } else {
      const newScopes = selectedScopes.includes(scope)
        ? selectedScopes.filter((s) => s !== scope)
        : [...selectedScopes.filter((s) => s !== '*'), scope];
      setSelectedScopes(newScopes);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700' }}>API Keys</h1>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          + Create API Key
        </button>
      </div>

      <div className="card">
        {apiKeys.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: '18px', marginBottom: '16px' }}>No API keys yet</p>
            <p>Create an API key to access the Mock API Studio programmatically.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {apiKeys.map((key) => (
              <div
                key={key.id}
                style={{
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '16px',
                  backgroundColor: key.isActive ? 'var(--bg-secondary)' : 'var(--bg-tertiary)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>
                      {key.name}
                      {!key.isActive && (
                        <span style={{ marginLeft: '8px', fontSize: '12px', color: '#e74c3c' }}>
                          (Revoked)
                        </span>
                      )}
                    </h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Created {new Date(key.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {key.isActive && (
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleRevoke(key.id)}
                      style={{ fontSize: '12px', padding: '4px 12px' }}
                    >
                      Revoke
                    </button>
                  )}
                </div>

                <div style={{ marginBottom: '8px' }}>
                  <strong style={{ fontSize: '14px' }}>Scopes:</strong>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                    {key.scopes.map((scope) => (
                      <span
                        key={scope}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: 'var(--primary-color)',
                          color: 'white',
                          borderRadius: '4px',
                          fontSize: '12px',
                        }}
                      >
                        {scope}
                      </span>
                    ))}
                  </div>
                </div>

                {key.lastUsedAt && (
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Last used: {new Date(key.lastUsedAt).toLocaleString()}
                  </p>
                )}
                {key.expiresAt && (
                  <p style={{ fontSize: '12px', color: '#e74c3c' }}>
                    Expires: {new Date(key.expiresAt).toLocaleString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
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
          <div className="card" style={{ maxWidth: '600px', width: '100%', margin: '20px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px' }}>
              Create API Key
            </h2>

            {newKeyValue ? (
              <div>
                <div
                  style={{
                    padding: '16px',
                    backgroundColor: '#fef3cd',
                    border: '1px solid #ffc107',
                    borderRadius: '6px',
                    marginBottom: '16px',
                  }}
                >
                  <p style={{ fontWeight: '600', marginBottom: '8px', color: '#856404' }}>
                    ⚠️ Save this API key now!
                  </p>
                  <p style={{ fontSize: '14px', color: '#856404', marginBottom: '12px' }}>
                    You won't be able to see it again. Copy it to a safe place.
                  </p>
                  <div
                    style={{
                      padding: '12px',
                      backgroundColor: 'white',
                      border: '1px solid #dee2e6',
                      borderRadius: '4px',
                      fontFamily: 'monospace',
                      fontSize: '14px',
                      wordBreak: 'break-all',
                      marginBottom: '12px',
                    }}
                  >
                    {newKeyValue}
                  </div>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => copyToClipboard(newKeyValue)}
                    style={{ width: '100%' }}
                  >
                    📋 Copy to Clipboard
                  </button>
                </div>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setNewKeyValue(null);
                    setShowCreateModal(false);
                  }}
                  style={{ width: '100%' }}
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreate}>
                <div className="form-group">
                  <label className="label">Key Name</label>
                  <input
                    className="input"
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    placeholder="My Production Key"
                    required
                  />
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    A descriptive name to identify this key
                  </p>
                </div>

                <div className="form-group">
                  <label className="label">Scopes (Permissions)</label>
                  <div style={{ display: 'grid', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                    {AVAILABLE_SCOPES.map((scope) => (
                      <label
                        key={scope.value}
                        style={{
                          display: 'flex',
                          alignItems: 'start',
                          gap: '8px',
                          padding: '8px',
                          border: '1px solid var(--border-color)',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          backgroundColor: selectedScopes.includes(scope.value) ? 'var(--bg-tertiary)' : 'transparent',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedScopes.includes(scope.value)}
                          onChange={() => toggleScope(scope.value)}
                          style={{ marginTop: '3px' }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '500', fontSize: '14px' }}>{scope.label}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            {scope.description}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
                    If no scopes are selected, the key will have all permissions (*)
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                    Create Key
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
            )}
          </div>
        </div>
      )}
    </div>
  );
}

