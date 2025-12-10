// frontend/src/pages/DashboardPage.tsx
import { useState, useEffect } from 'react';
import { apiDefinitionsApi } from '../api/api-definitions';
import { ApiDefinition } from '../api/types';
import { ApiCard } from '../components/ApiCard';
import { useWorkspace } from '../contexts/WorkspaceContext';

export function DashboardPage() {
  const { currentWorkspace } = useWorkspace();
  const [apis, setApis] = useState<ApiDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  useEffect(() => {
    if (currentWorkspace) {
      loadApis();
    }
  }, [currentWorkspace]);

  const loadApis = async () => {
    if (!currentWorkspace) return;
    
    try {
      setLoading(true);
      const response = await apiDefinitionsApi.getAll(currentWorkspace.id);
      setApis(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load APIs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiDefinitionsApi.delete(id);
      await loadApis();
    } catch (err) {
      alert('Failed to delete API');
      console.error(err);
    }
  };

  const handleExport = async (id: string) => {
    try {
      const response = await apiDefinitionsApi.exportApi(id);
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `api-${response.data.api.slug}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to export API');
      console.error(err);
    }
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentWorkspace) return;
    
    const formData = new FormData(e.currentTarget);
    
    try {
      await apiDefinitionsApi.create({
        workspaceId: currentWorkspace.id,
        name: formData.get('name') as string,
        slug: formData.get('slug') as string,
        version: formData.get('version') as string || '1.0.0',
        basePath: formData.get('basePath') as string || '/',
        description: formData.get('description') as string,
        isActive: true,
        tags: [],
      });
      setShowCreateModal(false);
      await loadApis();
    } catch (err) {
      alert('Failed to create API');
      console.error(err);
    }
  };

  const handleImport = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentWorkspace) return;
    
    const formData = new FormData(e.currentTarget);
    const file = formData.get('file') as File;
    const overwrite = formData.get('overwrite') === 'on';

    if (!file) {
      alert('Please select a file');
      return;
    }

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await apiDefinitionsApi.importApi(data, currentWorkspace.id, overwrite);
      setShowImportModal(false);
      await loadApis();
    } catch (err) {
      alert('Failed to import API');
      console.error(err);
    }
  };

  if (loading) {
    return <div className="loading">Loading APIs...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Mock APIs</h1>
        <p className="page-description">Manage your mock API definitions</p>
      </div>

      <div className="page-actions">
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          + Create API
        </button>
        <button className="btn btn-secondary" onClick={() => setShowImportModal(true)}>
          Import JSON
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {apis.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ color: '#6b7280' }}>No APIs found. Create your first API to get started!</p>
        </div>
      ) : (
        apis.map((api) => (
          <ApiCard
            key={api.id}
            api={api}
            onDelete={handleDelete}
            onExport={handleExport}
          />
        ))
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            width: '500px',
            maxWidth: '90%',
          }}>
            <h2 style={{ marginBottom: '20px' }}>Create New API</h2>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="label">Name *</label>
                <input className="input" name="name" required />
              </div>
              <div className="form-group">
                <label className="label">Slug *</label>
                <input className="input" name="slug" required pattern="[a-z0-9-]+" />
              </div>
              <div className="form-group">
                <label className="label">Version</label>
                <input className="input" name="version" defaultValue="1.0.0" />
              </div>
              <div className="form-group">
                <label className="label">Base Path</label>
                <input className="input" name="basePath" defaultValue="/" />
              </div>
              <div className="form-group">
                <label className="label">Description</label>
                <textarea className="textarea" name="description" />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            width: '500px',
            maxWidth: '90%',
          }}>
            <h2 style={{ marginBottom: '20px' }}>Import API</h2>
            <form onSubmit={handleImport}>
              <div className="form-group">
                <label className="label">JSON File *</label>
                <input type="file" accept=".json" name="file" required />
              </div>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="checkbox" name="overwrite" />
                  Overwrite if exists
                </label>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowImportModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Import
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

