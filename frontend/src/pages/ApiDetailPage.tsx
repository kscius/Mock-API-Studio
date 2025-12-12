// frontend/src/pages/ApiDetailPage.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiDefinitionsApi } from '../api/api-definitions';
import { ApiDefinition } from '../api/types';
import { EndpointCard } from '../components/EndpointCard';
import { SwaggerUIViewer } from '../components/SwaggerUIViewer';

type TabType = 'endpoints' | 'docs';

export function ApiDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [api, setApi] = useState<ApiDefinition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('endpoints');

  useEffect(() => {
    if (id) {
      loadApi();
    }
  }, [id]);

  const loadApi = async () => {
    try {
      setLoading(true);
      const response = await apiDefinitionsApi.getById(id!);
      setApi(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load API');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      await apiDefinitionsApi.update(id!, {
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        basePath: formData.get('basePath') as string,
        version: formData.get('version') as string,
        isActive: formData.get('isActive') === 'on',
      });
      setEditMode(false);
      await loadApi();
    } catch (err) {
      alert('Failed to update API');
      console.error(err);
    }
  };

  const handleDeleteEndpoint = async (endpointId: string) => {
    try {
      await apiDefinitionsApi.deleteEndpoint(endpointId);
      await loadApi();
    } catch (err) {
      alert('Failed to delete endpoint');
      console.error(err);
    }
  };

  if (loading) {
    return <div className="loading">Loading API...</div>;
  }

  if (error || !api) {
    return <div className="error">{error || 'API not found'}</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <button className="btn btn-secondary" onClick={() => navigate('/')}>
          ← Back to Dashboard
        </button>
      </div>

      <div className="card">
        {editMode ? (
          <form onSubmit={handleUpdate}>
            <h2 style={{ marginBottom: '20px' }}>Edit API</h2>
            <div className="form-group">
              <label className="label">Name</label>
              <input className="input" name="name" defaultValue={api.name} required />
            </div>
            <div className="form-group">
              <label className="label">Description</label>
              <textarea className="textarea" name="description" defaultValue={api.description} />
            </div>
            <div className="form-group">
              <label className="label">Base Path</label>
              <input className="input" name="basePath" defaultValue={api.basePath} />
            </div>
            <div className="form-group">
              <label className="label">Version</label>
              <input className="input" name="version" defaultValue={api.version} />
            </div>
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" name="isActive" defaultChecked={api.isActive} />
                Active
              </label>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="submit" className="btn btn-primary">Save</button>
              <button type="button" className="btn btn-secondary" onClick={() => setEditMode(false)}>
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
              <div>
                <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>{api.name}</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <code>{api.slug}</code>
                  <span className={`badge ${api.isActive ? 'badge-success' : 'badge-danger'}`}>
                    {api.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <button className="btn btn-secondary" onClick={() => setEditMode(true)}>
                Edit
              </button>
            </div>

            {api.description && (
              <p style={{ color: '#6b7280', marginBottom: '16px' }}>{api.description}</p>
            )}

            <div style={{ display: 'flex', gap: '24px', fontSize: '14px' }}>
              <div>
                <strong>Base Path:</strong> {api.basePath}
              </div>
              <div>
                <strong>Version:</strong> {api.version}
              </div>
              <div>
                <strong>Endpoints:</strong> {api.endpoints?.length || 0}
              </div>
            </div>

            {api.tags && api.tags.length > 0 && (
              <div style={{ marginTop: '12px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {api.tags.map((tag) => (
                  <span key={tag} className="badge badge-info">{tag}</span>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <div style={{ marginTop: '32px' }}>
        {/* Tabs */}
        <div style={{ borderBottom: '2px solid #e5e7eb', marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '16px' }}>
            <button
              onClick={() => setActiveTab('endpoints')}
              style={{
                padding: '12px 16px',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'endpoints' ? '2px solid #3b82f6' : '2px solid transparent',
                color: activeTab === 'endpoints' ? '#3b82f6' : '#6b7280',
                fontWeight: activeTab === 'endpoints' ? '600' : '400',
                cursor: 'pointer',
                fontSize: '16px',
                marginBottom: '-2px',
              }}
            >
              Endpoints ({api.endpoints?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('docs')}
              style={{
                padding: '12px 16px',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'docs' ? '2px solid #3b82f6' : '2px solid transparent',
                color: activeTab === 'docs' ? '#3b82f6' : '#6b7280',
                fontWeight: activeTab === 'docs' ? '600' : '400',
                cursor: 'pointer',
                fontSize: '16px',
                marginBottom: '-2px',
              }}
            >
              📚 API Docs (Swagger UI)
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'endpoints' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600' }}>Endpoints</h2>
              <button 
                className="btn btn-primary"
                onClick={() => navigate(`/apis/${id}/endpoints/new`)}
              >
                + New Endpoint
              </button>
            </div>

            {api.endpoints && api.endpoints.length > 0 ? (
              api.endpoints.map((endpoint) => (
                <EndpointCard
                  key={endpoint.id}
                  apiId={api.id}
                  endpoint={endpoint}
                  onDelete={handleDeleteEndpoint}
                />
              ))
            ) : (
              <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
                <p style={{ color: '#6b7280' }}>No endpoints found. Create your first endpoint!</p>
              </div>
            )}
          </>
        )}

        {activeTab === 'docs' && (
          <SwaggerUIViewer apiId={api.id} />
        )}
      </div>
    </div>
  );
}

