// frontend/src/components/EndpointCard.tsx
import { ApiEndpoint } from '../api/types';
import { useNavigate } from 'react-router-dom';

interface EndpointCardProps {
  apiId: string;
  endpoint: ApiEndpoint;
  onDelete: (id: string) => void;
}

export function EndpointCard({ apiId, endpoint, onDelete }: EndpointCardProps) {
  const navigate = useNavigate();

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this endpoint?')) {
      onDelete(endpoint.id);
    }
  };

  const defaultResponse = endpoint.responses.find(r => r.isDefault);
  const statusCode = defaultResponse?.status || endpoint.responses[0]?.status || 200;

  return (
    <div 
      className="card" 
      style={{ cursor: 'pointer' }}
      onClick={() => navigate(`/apis/${apiId}/endpoints/${endpoint.id}`)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <span className={`method-badge method-${endpoint.method}`}>
              {endpoint.method}
            </span>
            <code style={{ fontSize: '14px', fontWeight: '500' }}>{endpoint.path}</code>
            <span className={`badge ${endpoint.enabled ? 'badge-success' : 'badge-danger'}`}>
              {endpoint.enabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>

          {endpoint.summary && (
            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>
              {endpoint.summary}
            </p>
          )}

          <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#6b7280' }}>
            <div>
              <strong>Status:</strong> {statusCode}
            </div>
            <div>
              <strong>Delay:</strong> {endpoint.delayMs}ms
            </div>
            <div>
              <strong>Responses:</strong> {endpoint.responses.length}
            </div>
          </div>
        </div>

        <button 
          className="btn btn-danger"
          onClick={handleDelete}
          style={{ fontSize: '12px', padding: '6px 12px' }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

