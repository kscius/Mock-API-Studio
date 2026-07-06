import React, { useState, useEffect } from 'react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { apiClient } from '../api/client';
import { apiDefinitionsApi } from '../api/api-definitions';
import { ApiDefinition } from '../api/types';

interface GeneratedEndpoint {
  id: string;
  method: string;
  path: string;
  summary?: string;
}

interface GenerateResult {
  created: number;
  endpoints: GeneratedEndpoint[];
}

export const SmartMockPage: React.FC = () => {
  const { currentWorkspace } = useWorkspace();
  const [apis, setApis] = useState<ApiDefinition[]>([]);
  const [selectedApiId, setSelectedApiId] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerateResult | null>(null);

  useEffect(() => {
    if (currentWorkspace) {
      loadApis();
    }
  }, [currentWorkspace]);

  const loadApis = async () => {
    if (!currentWorkspace) return;
    try {
      const response = await apiDefinitionsApi.getAll(currentWorkspace.id);
      setApis(response.data);
      if (response.data.length > 0 && !selectedApiId) {
        setSelectedApiId(response.data[0].id);
      }
    } catch (error) {
      console.error('Failed to load APIs:', error);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApiId || !description.trim()) {
      alert('Please select an API and provide a description');
      return;
    }

    try {
      setLoading(true);
      setResult(null);
      const response = await apiClient.post<GenerateResult>(
        '/admin/ai/generate-mocks',
        { apiId: selectedApiId, description: description.trim() },
      );
      setResult(response.data);
      alert(`Successfully generated ${response.data.created} endpoint(s)!`);
    } catch (error: any) {
      alert(`Error: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!currentWorkspace) {
    return <div style={{ padding: '20px' }}>Please select a workspace first.</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <h1>AI Mock Generation</h1>
        <p style={{ color: '#666', margin: '5px 0' }}>
          Describe the API behavior you need and let AI generate mock endpoints
        </p>
      </div>

      <div style={{
        backgroundColor: '#f9f9f9',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px',
        border: '1px solid #e0e0e0',
      }}>
        <form onSubmit={handleGenerate}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              API *
            </label>
            <select
              value={selectedApiId}
              onChange={(e) => setSelectedApiId(e.target.value)}
              style={{
                width: '100%',
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

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Description *
            </label>
            <textarea
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., A user management API with CRUD endpoints for users, including pagination and search filters"
              style={{
                width: '100%',
                padding: '8px',
                fontSize: '14px',
                borderRadius: '4px',
                border: '1px solid #ccc',
                minHeight: '120px',
              }}
            />
            <small style={{ color: '#666' }}>
              Be specific about endpoints, methods, and response shapes you need.
            </small>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '10px 20px',
              backgroundColor: loading ? '#ccc' : '#9C27B0',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
            }}
          >
            {loading ? 'Generating...' : 'Generate Mocks'}
          </button>
        </form>
      </div>

      {result && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          overflow: 'hidden',
          border: '1px solid #e0e0e0',
        }}>
          <div style={{
            padding: '15px 20px',
            backgroundColor: '#f3e5f5',
            borderBottom: '1px solid #e0e0e0',
          }}>
            <h2 style={{ margin: 0, fontSize: '16px' }}>
              Generated {result.created} endpoint(s)
            </h2>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #e0e0e0' }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>Method</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Path</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Summary</th>
              </tr>
            </thead>
            <tbody>
              {result.endpoints.map((endpoint) => (
                <tr key={endpoint.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      backgroundColor: '#e3f2fd',
                      color: '#1565c0',
                    }}>
                      {endpoint.method}
                    </span>
                  </td>
                  <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: '13px' }}>
                    {endpoint.path}
                  </td>
                  <td style={{ padding: '12px', fontSize: '13px', color: '#666' }}>
                    {endpoint.summary || '—'}
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
