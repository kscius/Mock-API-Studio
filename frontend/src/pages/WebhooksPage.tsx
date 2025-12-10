import React, { useState, useEffect } from 'react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { webhooksApi, Webhook, CreateWebhookDto } from '../api/webhooks';

const EVENT_TYPES = [
  { value: 'mock.request.received', label: 'Mock Request Received' },
  { value: 'mock.response.sent', label: 'Mock Response Sent' },
];

export const WebhooksPage: React.FC = () => {
  const { currentWorkspace } = useWorkspace();
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateWebhookDto>({
    targetUrl: '',
    eventType: 'mock.request.received',
    isActive: true,
    secret: '',
  });

  useEffect(() => {
    if (currentWorkspace) {
      loadWebhooks();
    }
  }, [currentWorkspace]);

  const loadWebhooks = async () => {
    if (!currentWorkspace) return;
    try {
      setLoading(true);
      const data = await webhooksApi.getAll(currentWorkspace.id);
      setWebhooks(data);
    } catch (error) {
      console.error('Failed to load webhooks:', error);
      alert('Error loading webhooks');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkspace) return;

    try {
      const payload = { ...formData, workspaceId: currentWorkspace.id };
      
      if (editingId) {
        await webhooksApi.update(editingId, formData);
      } else {
        await webhooksApi.create(payload);
      }

      await loadWebhooks();
      resetForm();
      alert(editingId ? 'Webhook updated!' : 'Webhook created!');
    } catch (error: any) {
      alert(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleEdit = (webhook: Webhook) => {
    setEditingId(webhook.id);
    setFormData({
      targetUrl: webhook.targetUrl,
      eventType: webhook.eventType,
      isActive: webhook.isActive,
      secret: webhook.secret || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this webhook?')) return;

    try {
      await webhooksApi.delete(id);
      await loadWebhooks();
      alert('Webhook deleted!');
    } catch (error: any) {
      alert(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleToggleActive = async (webhook: Webhook) => {
    try {
      await webhooksApi.update(webhook.id, { isActive: !webhook.isActive });
      await loadWebhooks();
    } catch (error: any) {
      alert(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  const resetForm = () => {
    setFormData({
      targetUrl: '',
      eventType: 'mock.request.received',
      isActive: true,
      secret: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  if (!currentWorkspace) {
    return <div style={{ padding: '20px' }}>Please select a workspace first.</div>;
  }

  if (loading) {
    return <div style={{ padding: '20px' }}>Loading webhooks...</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px' 
      }}>
        <div>
          <h1>Webhooks</h1>
          <p style={{ color: '#666', margin: '5px 0' }}>
            Receive HTTP notifications when mock events occur
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
          {showForm ? 'Cancel' : '+ New Webhook'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div style={{ 
          backgroundColor: '#f9f9f9', 
          padding: '20px', 
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #e0e0e0'
        }}>
          <h2>{editingId ? 'Edit Webhook' : 'Create New Webhook'}</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Target URL *
              </label>
              <input
                type="url"
                required
                value={formData.targetUrl}
                onChange={(e) => setFormData({ ...formData, targetUrl: e.target.value })}
                placeholder="https://your-server.com/webhook"
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
                Event Type *
              </label>
              <select
                value={formData.eventType}
                onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  fontSize: '14px',
                  borderRadius: '4px',
                  border: '1px solid #ccc'
                }}
              >
                {EVENT_TYPES.map(et => (
                  <option key={et.value} value={et.value}>{et.label}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Secret (Optional)
              </label>
              <input
                type="text"
                value={formData.secret}
                onChange={(e) => setFormData({ ...formData, secret: e.target.value })}
                placeholder="Will be sent as X-Webhook-Secret header"
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
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
                <span>Active</span>
              </label>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
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
                {editingId ? 'Update' : 'Create'} Webhook
              </button>
              <button
                type="button"
                onClick={resetForm}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#666',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Webhooks Table */}
      {webhooks.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px',
          backgroundColor: '#f9f9f9',
          borderRadius: '8px',
          color: '#999'
        }}>
          <p>No webhooks configured. Create one to receive notifications!</p>
        </div>
      ) : (
        <div style={{ 
          backgroundColor: 'white',
          borderRadius: '8px',
          overflow: 'hidden',
          border: '1px solid #e0e0e0'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #e0e0e0' }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Target URL</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Event Type</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Created</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {webhooks.map(webhook => (
                <tr key={webhook.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '12px' }}>
                    <span style={{ 
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      backgroundColor: webhook.isActive ? '#e8f5e9' : '#ffebee',
                      color: webhook.isActive ? '#2e7d32' : '#c62828',
                      fontWeight: 'bold'
                    }}>
                      {webhook.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: '13px' }}>
                    {webhook.targetUrl}
                  </td>
                  <td style={{ padding: '12px' }}>
                    {EVENT_TYPES.find(et => et.value === webhook.eventType)?.label || webhook.eventType}
                  </td>
                  <td style={{ padding: '12px', fontSize: '13px', color: '#666' }}>
                    {new Date(webhook.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => handleToggleActive(webhook)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: webhook.isActive ? '#ff9800' : '#4CAF50',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                        }}
                      >
                        {webhook.isActive ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        onClick={() => handleEdit(webhook)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#2196F3',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(webhook.id)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#f44336',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

