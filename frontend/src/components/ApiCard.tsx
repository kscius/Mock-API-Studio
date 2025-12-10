// frontend/src/components/ApiCard.tsx
import { ApiDefinition } from '../api/types';
import { useNavigate } from 'react-router-dom';

interface ApiCardProps {
  api: ApiDefinition;
  onDelete: (id: string) => void;
  onExport: (id: string) => void;
}

export function ApiCard({ api, onDelete, onExport }: ApiCardProps) {
  const navigate = useNavigate();

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${api.name}"?`)) {
      onDelete(api.id);
    }
  };

  const handleExport = (e: React.MouseEvent) => {
    e.stopPropagation();
    onExport(api.id);
  };

  return (
    <div 
      className="card" 
      style={{ cursor: 'pointer' }}
      onClick={() => navigate(`/apis/${api.id}`)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
        <div>
          <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '4px' }}>
            {api.name}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <code style={{ fontSize: '12px' }}>{api.slug}</code>
            <span className={`badge ${api.isActive ? 'badge-success' : 'badge-danger'}`}>
              {api.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            className="btn btn-secondary"
            onClick={handleExport}
            style={{ fontSize: '12px', padding: '6px 12px' }}
          >
            Export
          </button>
          <button 
            className="btn btn-danger"
            onClick={handleDelete}
            style={{ fontSize: '12px', padding: '6px 12px' }}
          >
            Delete
          </button>
        </div>
      </div>

      {api.description && (
        <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '12px' }}>
          {api.description}
        </p>
      )}

      <div style={{ display: 'flex', gap: '16px', fontSize: '14px', color: '#6b7280' }}>
        <div>
          <strong>Base Path:</strong> {api.basePath}
        </div>
        <div>
          <strong>Version:</strong> {api.version}
        </div>
        <div>
          <strong>Endpoints:</strong> {api.endpoints?.length || 0}
        </div>
      </div>

      {api.tags && api.tags.length > 0 && (
        <div style={{ marginTop: '12px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {api.tags.map((tag) => (
            <span key={tag} className="badge badge-info">{tag}</span>
          ))}
        </div>
      )}
    </div>
  );
}

