// frontend/src/components/SwaggerUIViewer.tsx
import { useEffect, useState } from 'react';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';
import { apiClient } from '../api/client';

interface SwaggerUIViewerProps {
  apiId: string;
}

export function SwaggerUIViewer({ apiId }: SwaggerUIViewerProps) {
  const [spec, setSpec] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSpec();
  }, [apiId]);

  const loadSpec = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get(`/api-definitions/${apiId}/openapi.json`);
      setSpec(response.data);
    } catch (err: any) {
      console.error('Failed to load OpenAPI spec:', err);
      setError(err.response?.data?.message || 'Failed to load API documentation');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div className="loading">Loading API documentation...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ padding: '24px', marginTop: '20px' }}>
        <div style={{ color: '#ef4444', marginBottom: '16px' }}>
          <strong>Error:</strong> {error}
        </div>
        <button className="btn btn-secondary" onClick={loadSpec}>
          Retry
        </button>
      </div>
    );
  }

  if (!spec) {
    return (
      <div className="card" style={{ padding: '24px', marginTop: '20px' }}>
        <p>No API documentation available.</p>
      </div>
    );
  }

  return (
    <div style={{ marginTop: '20px' }}>
      <SwaggerUI
        spec={spec}
        docExpansion="list"
        defaultModelsExpandDepth={1}
        defaultModelExpandDepth={1}
        displayRequestDuration={true}
        filter={true}
        showExtensions={true}
        showCommonExtensions={true}
        tryItOutEnabled={true}
      />
    </div>
  );
}

