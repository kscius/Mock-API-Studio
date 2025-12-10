import React, { useState, useEffect } from 'react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { workspacesApi } from '../api/workspaces';
import { CreateWorkspaceDto } from '../api/types';

export const WorkspacesPage: React.FC = () => {
  const { workspaces, refreshWorkspaces, currentWorkspace, setCurrentWorkspace } = useWorkspace();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<CreateWorkspaceDto>({
    name: '',
    slug: '',
    description: '',
    isActive: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await workspacesApi.create(formData);
      await refreshWorkspaces();
      setFormData({ name: '', slug: '', description: '', isActive: true });
      setShowForm(false);
      alert('Workspace created successfully!');
    } catch (error: any) {
      alert(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure? This will delete all APIs in this workspace.')) {
      return;
    }
    try {
      await workspacesApi.delete(id);
      await refreshWorkspaces();
      alert('Workspace deleted successfully!');
    } catch (error: any) {
      alert(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px' 
      }}>
        <h1>Workspaces</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          {showForm ? 'Cancel' : '+ New Workspace'}
        </button>
      </div>

      {showForm && (
        <div style={{ 
          backgroundColor: '#f9f9f9', 
          padding: '20px', 
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #e0e0e0'
        }}>
          <h2>Create New Workspace</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  fontSize: '14px',
                  borderRadius: '4px',
                  border: '1px solid #ccc'
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Slug *
              </label>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase() })}
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  fontSize: '14px',
                  borderRadius: '4px',
                  border: '1px solid #ccc'
                }}
              />
              <small style={{ color: '#666' }}>Lowercase, no spaces (e.g., my-workspace)</small>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  fontSize: '14px',
                  borderRadius: '4px',
                  border: '1px solid #ccc',
                  minHeight: '80px'
                }}
              />
            </div>

            <button
              type="submit"
              style={{
                padding: '10px 20px',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Create Workspace
            </button>
          </form>
        </div>
      )}

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '20px'
      }}>
        {workspaces.map(workspace => (
          <div
            key={workspace.id}
            style={{
              border: currentWorkspace?.id === workspace.id ? '2px solid #4CAF50' : '1px solid #e0e0e0',
              borderRadius: '8px',
              padding: '20px',
              backgroundColor: 'white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '10px'
            }}>
              <h3 style={{ margin: 0 }}>{workspace.name}</h3>
              {currentWorkspace?.id === workspace.id && (
                <span style={{ 
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}>
                  Current
                </span>
              )}
            </div>

            <p style={{ 
              color: '#666', 
              fontSize: '14px',
              margin: '5px 0',
              fontFamily: 'monospace'
            }}>
              slug: {workspace.slug}
            </p>

            {workspace.description && (
              <p style={{ color: '#888', fontSize: '13px', margin: '10px 0' }}>
                {workspace.description}
              </p>
            )}

            <p style={{ fontSize: '13px', color: '#666', margin: '10px 0' }}>
              <strong>{workspace._count?.apiDefinitions || 0}</strong> APIs
            </p>

            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
              {currentWorkspace?.id !== workspace.id && (
                <button
                  onClick={() => setCurrentWorkspace(workspace)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                >
                  Switch to this
                </button>
              )}
              <button
                onClick={() => handleDelete(workspace.id)}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#f44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {workspaces.length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px',
          color: '#999'
        }}>
          <p>No workspaces found. Create one to get started!</p>
        </div>
      )}
    </div>
  );
};

