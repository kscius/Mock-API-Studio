import React, { useState } from 'react';
import { useWorkspace } from '../contexts/WorkspaceContext';

export const GraphQLTesterPage: React.FC = () => {
  const { currentWorkspace } = useWorkspace();
  const [apiSlug, setApiSlug] = useState('');
  const [query, setQuery] = useState(`query GetUser {
  user(id: 1) {
    id
    name
    email
  }
}`);
  const [operationName, setOperationName] = useState('');
  const [variables, setVariables] = useState('{}');
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const parsedVariables = variables ? JSON.parse(variables) : {};
      
      const url = currentWorkspace
        ? `/api/mock-graphql/${apiSlug}?workspaceId=${currentWorkspace.id}`
        : `/api/mock-graphql/${apiSlug}`;

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          operationName: operationName || undefined,
          variables: parsedVariables,
        }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'GraphQL request failed');
      }

      setResponse(data);
    } catch (err: any) {
      setError(err.message || 'Failed to execute GraphQL query');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <h1>GraphQL Tester</h1>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        Test your GraphQL mock endpoints
      </p>

      <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            API Slug *
          </label>
          <input
            type="text"
            required
            value={apiSlug}
            onChange={(e) => setApiSlug(e.target.value)}
            placeholder="my-graphql-api"
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
            Operation Name (Optional)
          </label>
          <input
            type="text"
            value={operationName}
            onChange={(e) => setOperationName(e.target.value)}
            placeholder="GetUser"
            style={{
              width: '100%',
              padding: '8px',
              fontSize: '14px',
              borderRadius: '4px',
              border: '1px solid #ccc',
            }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '15px', marginBottom: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              GraphQL Query *
            </label>
            <textarea
              required
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                width: '100%',
                minHeight: '200px',
                padding: '8px',
                fontSize: '13px',
                fontFamily: 'monospace',
                borderRadius: '4px',
                border: '1px solid #ccc',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Variables (JSON)
            </label>
            <textarea
              value={variables}
              onChange={(e) => setVariables(e.target.value)}
              placeholder='{"id": 1}'
              style={{
                width: '100%',
                minHeight: '200px',
                padding: '8px',
                fontSize: '13px',
                fontFamily: 'monospace',
                borderRadius: '4px',
                border: '1px solid #ccc',
              }}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '12px 24px',
            backgroundColor: '#E535AB',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
          }}
        >
          {loading ? 'Executing...' : '▶ Execute Query'}
        </button>
      </form>

      {error && (
        <div style={{
          padding: '15px',
          backgroundColor: '#ffebee',
          color: '#c62828',
          borderRadius: '4px',
          marginBottom: '20px',
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {response && (
        <div>
          <h3>Response:</h3>
          <pre style={{
            backgroundColor: '#f5f5f5',
            padding: '15px',
            borderRadius: '4px',
            overflow: 'auto',
            fontSize: '13px',
            fontFamily: 'monospace',
          }}>
            {JSON.stringify(response, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

