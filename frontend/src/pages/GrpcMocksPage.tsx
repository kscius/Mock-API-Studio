import React, { useState, useEffect } from 'react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { apiClient } from '../api/client';
import { apiDefinitionsApi } from '../api/api-definitions';
import { ApiDefinition } from '../api/types';

interface GrpcMethod {
  id?: string;
  service: string;
  method: string;
  summary?: string;
  streaming?: string;
}

export const GrpcMocksPage: React.FC = () => {
  const { currentWorkspace } = useWorkspace();
  const [apis, setApis] = useState<ApiDefinition[]>([]);
  const [selectedApiId, setSelectedApiId] = useState('');
  const [apiSlug, setApiSlug] = useState('');
  const [methods, setMethods] = useState<GrpcMethod[]>([]);
  const [service, setService] = useState('users.UserService');
  const [method, setMethod] = useState('GetUser');
  const [inputJson, setInputJson] = useState('{\n  "id": "1"\n}');
  const [response, setResponse] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newMethodService, setNewMethodService] = useState('users.UserService');
  const [newMethodName, setNewMethodName] = useState('GetUser');
  const [newMethodBody, setNewMethodBody] = useState('{\n  "id": "1",\n  "name": "Ada Lovelace"\n}');

  useEffect(() => {
    if (currentWorkspace) {
      loadApis();
    }
  }, [currentWorkspace]);

  useEffect(() => {
    const api = apis.find((item) => item.id === selectedApiId);
    if (api) {
      setApiSlug(api.slug);
      loadMethods(api.id);
    }
  }, [selectedApiId, apis]);

  const loadApis = async () => {
    if (!currentWorkspace) return;
    try {
      const response = await apiDefinitionsApi.getAll(currentWorkspace.id);
      setApis(response.data);
      if (response.data.length > 0 && !selectedApiId) {
        setSelectedApiId(response.data[0].id);
      }
    } catch (err) {
      console.error('Failed to load APIs:', err);
    }
  };

  const loadMethods = async (apiId: string) => {
    try {
      const response = await apiClient.get<GrpcMethod[]>(`/admin/grpc/apis/${apiId}/methods`);
      setMethods(response.data);
    } catch (err) {
      console.error('Failed to load gRPC methods:', err);
      setMethods([]);
    }
  };

  const handleInvoke = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiSlug) {
      alert('Select an API first');
      return;
    }

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const input = inputJson.trim() ? JSON.parse(inputJson) : {};
      const url = currentWorkspace
        ? `/mock-grpc/${apiSlug}?workspaceId=${currentWorkspace.id}`
        : `/mock-grpc/${apiSlug}`;

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service, method, input }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'gRPC invoke failed');
      }

      setResponse(data);
    } catch (err: any) {
      setError(err.message || 'Failed to invoke gRPC mock');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApiId) return;

    try {
      setLoading(true);
      const body = JSON.parse(newMethodBody);
      await apiDefinitionsApi.createEndpoint(selectedApiId, {
        type: 'GRPC',
        path: newMethodService.trim(),
        method: newMethodName.trim(),
        operationType: 'unary',
        summary: `Mock ${newMethodName.trim()}`,
        responses: [{ status: 0, body, isDefault: true }],
        enabled: true,
      });
      await loadMethods(selectedApiId);
      alert('gRPC mock method created');
    } catch (err: any) {
      alert(`Error: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!currentWorkspace) {
    return <div style={{ padding: '20px' }}>Please select a workspace first.</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>gRPC Mocks</h1>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        Define and test gRPC mocks via the JSON gateway (service + method + message).
      </p>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>API</label>
        <select
          value={selectedApiId}
          onChange={(e) => setSelectedApiId(e.target.value)}
          style={{ width: '100%', maxWidth: '480px', padding: '8px' }}
        >
          {apis.map((api) => (
            <option key={api.id} value={api.id}>{api.name} ({api.slug})</option>
          ))}
        </select>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px',
        marginBottom: '24px',
      }}>
        <form onSubmit={handleCreateMethod} style={{
          backgroundColor: '#f9f9f9',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid #e0e0e0',
        }}>
          <h2 style={{ marginTop: 0 }}>Add gRPC Method</h2>
          <input
            type="text"
            value={newMethodService}
            onChange={(e) => setNewMethodService(e.target.value)}
            placeholder="Service (e.g. users.UserService)"
            style={{ width: '100%', marginBottom: '10px', padding: '8px' }}
            required
          />
          <input
            type="text"
            value={newMethodName}
            onChange={(e) => setNewMethodName(e.target.value)}
            placeholder="Method (e.g. GetUser)"
            style={{ width: '100%', marginBottom: '10px', padding: '8px' }}
            required
          />
          <textarea
            value={newMethodBody}
            onChange={(e) => setNewMethodBody(e.target.value)}
            style={{
              width: '100%',
              minHeight: '120px',
              fontFamily: 'monospace',
              fontSize: '13px',
              padding: '8px',
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '12px',
              padding: '10px 16px',
              backgroundColor: '#00897B',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            Create Mock Method
          </button>
        </form>

        <form onSubmit={handleInvoke} style={{
          backgroundColor: '#f9f9f9',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid #e0e0e0',
        }}>
          <h2 style={{ marginTop: 0 }}>Invoke Mock</h2>
          <input
            type="text"
            value={service}
            onChange={(e) => setService(e.target.value)}
            placeholder="Service"
            style={{ width: '100%', marginBottom: '10px', padding: '8px' }}
            required
          />
          <input
            type="text"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            placeholder="Method"
            style={{ width: '100%', marginBottom: '10px', padding: '8px' }}
            required
          />
          <textarea
            value={inputJson}
            onChange={(e) => setInputJson(e.target.value)}
            style={{
              width: '100%',
              minHeight: '120px',
              fontFamily: 'monospace',
              fontSize: '13px',
              padding: '8px',
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '12px',
              padding: '10px 16px',
              backgroundColor: '#3949AB',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Invoking...' : 'Invoke'}
          </button>
        </form>
      </div>

      {error && (
        <div style={{
          padding: '15px',
          backgroundColor: '#ffebee',
          color: '#c62828',
          borderRadius: '4px',
          marginBottom: '20px',
        }}>
          {error}
        </div>
      )}

      {response !== null ? (
        <div style={{ marginBottom: '24px' }}>
          <h3>Response</h3>
          <pre style={{
            backgroundColor: '#f5f5f5',
            padding: '15px',
            borderRadius: '4px',
            overflow: 'auto',
            fontSize: '13px',
          }}>
            {JSON.stringify(response, null, 2)}
          </pre>
        </div>
      ) : null}

      <h2>Configured Methods ({methods.length})</h2>
      {methods.length === 0 ? (
        <p style={{ color: '#666' }}>No gRPC methods yet. Create one above.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f5f5f5' }}>
              <th style={{ padding: '10px', textAlign: 'left' }}>Service</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>Method</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>Streaming</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>Summary</th>
            </tr>
          </thead>
          <tbody>
            {methods.map((item) => (
              <tr key={`${item.service}-${item.method}`} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '10px', fontFamily: 'monospace' }}>{item.service}</td>
                <td style={{ padding: '10px', fontFamily: 'monospace' }}>{item.method}</td>
                <td style={{ padding: '10px' }}>{item.streaming ?? 'unary'}</td>
                <td style={{ padding: '10px' }}>{item.summary ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};
