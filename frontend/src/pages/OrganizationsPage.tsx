import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';

interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  billingEmail?: string;
  createdAt: string;
  _count?: {
    members: number;
    teams: number;
    workspaces: number;
  };
}

interface CreateOrganizationDto {
  name: string;
  slug: string;
  description?: string;
  billingEmail?: string;
}

export const OrganizationsPage: React.FC = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<CreateOrganizationDto>({
    name: '',
    slug: '',
    description: '',
    billingEmail: '',
  });

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<Organization[]>('/admin/organizations');
      setOrganizations(response.data);
    } catch (error) {
      console.error('Failed to load organizations:', error);
      alert('Error loading organizations');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/admin/organizations', formData);
      await loadOrganizations();
      setFormData({ name: '', slug: '', description: '', billingEmail: '' });
      setShowForm(false);
      alert('Organization created successfully!');
    } catch (error: any) {
      alert(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  if (loading) {
    return <div style={{ padding: '20px' }}>Loading organizations...</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
      }}>
        <div>
          <h1>Organizations</h1>
          <p style={{ color: '#666', margin: '5px 0' }}>
            Manage organizations and team structure
          </p>
        </div>
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
          {showForm ? 'Cancel' : '+ New Organization'}
        </button>
      </div>

      {showForm && (
        <div style={{
          backgroundColor: '#f9f9f9',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #e0e0e0',
        }}>
          <h2>Create New Organization</h2>
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
                  border: '1px solid #ccc',
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
                  border: '1px solid #ccc',
                }}
              />
              <small style={{ color: '#666' }}>Lowercase, no spaces (e.g., my-org)</small>
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
                  minHeight: '80px',
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Billing Email
              </label>
              <input
                type="email"
                value={formData.billingEmail}
                onChange={(e) => setFormData({ ...formData, billingEmail: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  fontSize: '14px',
                  borderRadius: '4px',
                  border: '1px solid #ccc',
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
              Create Organization
            </button>
          </form>
        </div>
      )}

      {organizations.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          backgroundColor: '#f9f9f9',
          borderRadius: '8px',
          color: '#999',
        }}>
          <p>No organizations found. Create one to get started!</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '20px',
        }}>
          {organizations.map((org) => (
            <div
              key={org.id}
              style={{
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                padding: '20px',
                backgroundColor: 'white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              }}
            >
              <h3 style={{ margin: '0 0 10px 0' }}>{org.name}</h3>
              <p style={{ color: '#666', fontSize: '14px', fontFamily: 'monospace', margin: '5px 0' }}>
                slug: {org.slug}
              </p>
              {org.description && (
                <p style={{ color: '#888', fontSize: '13px', margin: '10px 0' }}>
                  {org.description}
                </p>
              )}
              <div style={{ fontSize: '13px', color: '#666', marginTop: '10px' }}>
                <p><strong>{org._count?.members ?? 0}</strong> members</p>
                <p><strong>{org._count?.teams ?? 0}</strong> teams</p>
                <p><strong>{org._count?.workspaces ?? 0}</strong> workspaces</p>
              </div>
              <p style={{ fontSize: '12px', color: '#999', marginTop: '10px' }}>
                Created {new Date(org.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
