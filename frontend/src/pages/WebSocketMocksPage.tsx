import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { apiClient } from '../api/client';
import { apiDefinitionsApi } from '../api/api-definitions';
import { ApiDefinition } from '../api/types';

interface WebSocketEndpoint {
  id: string;
  apiId: string;
  path: string;
  events: unknown[];
  createdAt: string;
}

export const WebSocketMocksPage: React.FC = () => {
  const { currentWorkspace } = useWorkspace();
  const [searchParams, setSearchParams] = useSearchParams();
  const [apis, setApis] = useState<ApiDefinition[]>([]);
  const [endpoints, setEndpoints] = useState<WebSocketEndpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ path: '', events: '[]' });

  const apiId = searchParams.get('apiId') || '';

  useEffect(() => {
    if (currentWorkspace) {
      loadApis();
    }
  }, [currentWorkspace]);

  useEffect(() => {
    if (apiId) {
      loadEndpoints(apiId);
    } else {
      setEndpoints([]);
      setLoading(false);
    }
  }, [apiId]);

  const loadApis = async () => {
    if (!currentWorkspace) return;
    try {
      const response = await apiDefinitionsApi.getAll(currentWorkspace.id);
      setApis(response.data);
      if (!apiId && response.data.length > 0) {
        setSearchParams({ apiId: response.data[0].id });
      }
    } catch (error) {
      console.error('Failed to load APIs:', error);
    }
  };

  const loadEndpoints = async (id: string) => {
    try {
      setLoading(true);
      const response = await apiClient.get<WebSocketEndpoint[]>(
        `/websocket-endpoints/api/${id}`,
      );
      setEndpoints(response.data);
    } catch (error) {
      console.error('Failed to load WebSocket endpoints:', error);
      alert('Error loading WebSocket endpoints');
    } finally {
      setLoading(false);
    }
  };

  const handleApiChange = (id: string) => {
    setSearchParams({ apiId: id });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiId) return;

    try {
      let events: unknown[];
      try {
        events = JSON.parse(formData.events);
        if (!Array.isArray(events)) {
          throw new Error('Events must be an array');
        }
      } catch {
        alert('Invalid JSON for events. Please provide a valid JSON array.');
        return;
      }

      await apiClient.post(`/websocket-endpoints/api/${apiId}`, {
        path: formData.path,
        events,
      });

      await loadEndpoints(apiId);
      setFormData({ path: '', events: '[]' });
      setShowForm(false);
      alert('WebSocket endpoint created!');
    } catch (error: any) {
      alert(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this WebSocket endpoint?')) return;

    try {
      await apiClient.delete(`/websocket-endpoints/${id}`);
      if (apiId) await loadEndpoints(apiId);
      alert('WebSocket endpoint deleted!');
    } catch (error: any) {
      alert(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  if (!currentWorkspace) {
    return <div style={{ padding: '20px' }}>Please select a workspace first.</div>;
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
          <h1>WebSocket Mocks</h1>
          <p style={{ color: '#666', margin: '5px 0' }}>
            Manage WebSocket mock endpoints for your APIs
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          disabled={!apiId}
          style={{
            padding: '10px 20px',
            backgroundColor: apiId ? '#4CAF50' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: apiId ? 'pointer' : 'not-allowed',
            fontSize: '14px',
          }}
        >
          {showForm ? 'Cancel' : '+ New Endpoint'}
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          API
        </label>
        <select
          value={apiId}
          onChange={(e) => handleApiChange(e.target.value)}
          style={{
            width: '100%',
            maxWidth: '400px',
            padding: '8px',
            fontSize: '14px',
            borderRadius: '4px',
            border: '1px solid #ccc',
          }}
        >
          <option value="">Select an API</option>
          {apis.map((api) => (
            <option key={api.id} value={api.id}>{api.name}</option>
          ))}
        </select>
      </div>

      {showForm && apiId && (
        <div style={{
          backgroundColor: '#f9f9f9',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #e0e0e0',
        }}>
          <h2>Create WebSocket Endpoint</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Path *
              </label>
              <input
                type="text"
                required
                value={formData.path}
                onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                placeholder="/ws/events"
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
                Events (JSON array) *
              </label>
              <textarea
                required
                value={formData.events}
                onChange={(e) => setFormData({ ...formData, events: e.target.value })}
                placeholder='[{"type": "message", "payload": {"text": "hello"}}]'
                style={{
                  width: '100%',
                  padding: '8px',
                  fontSize: '14px',
                  borderRadius: '4px',
                  border: '1px solid #ccc',
                  minHeight: '120px',
                  fontFamily: 'monospace',
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
              Create Endpoint
            </button>
          </form>
        </div>
      )}

      {!apiId ? (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          backgroundColor: '#f9f9f9',
          borderRadius: '8px',
          color: '#999',
        }}>
          <p>Select an API to manage WebSocket endpoints.</p>
        </div>
      ) : loading ? (
        <div style={{ padding: '20px' }}>Loading WebSocket endpoints...</div>
      ) : endpoints.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          backgroundColor: '#f9f9f9',
          borderRadius: '8px',
          color: '#999',
        }}>
          <p>No WebSocket endpoints configured for this API.</p>
        </div>
      ) : (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          overflow: 'hidden',
          border: '1px solid #e0e0e0',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #e0e0e0' }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>Path</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Events</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Created</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {endpoints.map((endpoint) => (
                <tr key={endpoint.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: '13px' }}>
                    {endpoint.path}
                  </td>
                  <td style={{ padding: '12px', fontSize: '13px' }}>
                    {Array.isArray(endpoint.events) ? endpoint.events.length : 0} event(s)
                  </td>
                  <td style={{ padding: '12px', fontSize: '13px', color: '#666' }}>
                    {new Date(endpoint.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    <button
                      onClick={() => handleDelete(endpoint.id)}
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
