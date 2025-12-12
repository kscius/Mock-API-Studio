// frontend/src/pages/EndpointEditorPage.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiDefinitionsApi } from '../api/api-definitions';
import { ApiDefinition, ApiEndpoint, MockResponse } from '../api/types';

export function EndpointEditorPage() {
  const { apiId, endpointId } = useParams<{ apiId: string; endpointId: string }>();
  const navigate = useNavigate();
  const [api, setApi] = useState<ApiDefinition | null>(null);
  const [endpoint, setEndpoint] = useState<ApiEndpoint | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicatePath, setDuplicatePath] = useState('');
  const [duplicateMethod, setDuplicateMethod] = useState('');
  const [duplicateSummary, setDuplicateSummary] = useState('');

  const [method, setMethod] = useState('GET');
  const [path, setPath] = useState('');
  const [summary, setSummary] = useState('');
  const [delayMs, setDelayMs] = useState(0);
  const [enabled, setEnabled] = useState(true);
  const [responses, setResponses] = useState<MockResponse[]>([
    { status: 200, headers: {}, body: {}, isDefault: true },
  ]);

  useEffect(() => {
    loadData();
  }, [apiId, endpointId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const apiResponse = await apiDefinitionsApi.getById(apiId!);
      setApi(apiResponse.data);

      if (endpointId && endpointId !== 'new') {
        const ep = apiResponse.data.endpoints?.find((e) => e.id === endpointId);
        if (ep) {
          setEndpoint(ep);
          setMethod(ep.method);
          setPath(ep.path);
          setSummary(ep.summary || '');
          setDelayMs(ep.delayMs);
          setEnabled(ep.enabled);
          setResponses(ep.responses);
        }
      }
    } catch (err) {
      alert('Failed to load data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      method,
      path,
      summary,
      delayMs,
      enabled,
      responses,
    };

    try {
      if (endpointId === 'new') {
        await apiDefinitionsApi.createEndpoint(apiId!, data);
      } else {
        await apiDefinitionsApi.updateEndpoint(endpointId!, data);
      }
      navigate(`/apis/${apiId}`);
    } catch (err) {
      alert('Failed to save endpoint');
      console.error(err);
    }
  };

  const addResponse = () => {
    setResponses([...responses, { status: 200, headers: {}, body: {}, isDefault: false }]);
  };

  const removeResponse = (index: number) => {
    setResponses(responses.filter((_, i) => i !== index));
  };

  const updateResponse = (index: number, field: keyof MockResponse, value: any) => {
    const updated = [...responses];
    updated[index] = { ...updated[index], [field]: value };
    setResponses(updated);
  };

  const updateResponseBody = (index: number, value: string) => {
    try {
      const parsed = JSON.parse(value);
      updateResponse(index, 'body', parsed);
    } catch (err) {
      // Keep the string value for editing
    }
  };

  const handleDuplicate = () => {
    if (endpoint) {
      setDuplicatePath(endpoint.path + '-copy');
      setDuplicateMethod(endpoint.method);
      setDuplicateSummary(endpoint.summary ? `${endpoint.summary} (Copy)` : '');
      setShowDuplicateModal(true);
    }
  };

  const confirmDuplicate = async () => {
    try {
      const response = await apiDefinitionsApi.duplicateEndpoint(endpointId!, {
        path: duplicatePath || undefined,
        method: duplicateMethod || undefined,
        summary: duplicateSummary || undefined,
      });
      setShowDuplicateModal(false);
      // Navigate to the new endpoint
      navigate(`/apis/${apiId}/endpoints/${response.data.id}`);
    } catch (err) {
      alert('Failed to duplicate endpoint');
      console.error(err);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button className="btn btn-secondary" onClick={() => navigate(`/apis/${apiId}`)}>
          ← Back to API
        </button>
        {endpointId && endpointId !== 'new' && (
          <button className="btn btn-secondary" onClick={handleDuplicate}>
            📋 Duplicate Endpoint
          </button>
        )}
      </div>

      <div className="card">
        <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px' }}>
          {endpointId === 'new' ? 'Create Endpoint' : 'Edit Endpoint'}
        </h1>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '16px', marginBottom: '16px' }}>
            <div className="form-group">
              <label className="label">Method</label>
              <select className="select" value={method} onChange={(e) => setMethod(e.target.value)}>
                <option>GET</option>
                <option>POST</option>
                <option>PUT</option>
                <option>PATCH</option>
                <option>DELETE</option>
              </select>
            </div>
            <div className="form-group">
              <label className="label">Path</label>
              <input
                className="input"
                value={path}
                onChange={(e) => setPath(e.target.value)}
                placeholder="/users/:id"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="label">Summary</label>
            <input
              className="input"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Description of this endpoint"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="label">Delay (ms)</label>
              <input
                className="input"
                type="number"
                value={delayMs}
                onChange={(e) => setDelayMs(parseInt(e.target.value) || 0)}
                min="0"
              />
            </div>
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '32px' }}>
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                />
                Enabled
              </label>
            </div>
          </div>

          <div style={{ marginTop: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600' }}>Responses</h3>
              <button type="button" className="btn btn-secondary" onClick={addResponse}>
                + Add Response
              </button>
            </div>

            {responses.map((response, index) => (
              <div key={index} style={{ border: '1px solid #e5e7eb', borderRadius: '6px', padding: '16px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: '500' }}>Response {index + 1}</h4>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => removeResponse(index)}
                    disabled={responses.length === 1}
                    style={{ fontSize: '12px', padding: '4px 8px' }}
                  >
                    Remove
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '16px', marginBottom: '12px' }}>
                  <div className="form-group">
                    <label className="label">Status</label>
                    <input
                      className="input"
                      type="number"
                      value={response.status}
                      onChange={(e) => updateResponse(index, 'status', parseInt(e.target.value) || 200)}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '32px' }}>
                      <input
                        type="checkbox"
                        checked={response.isDefault || false}
                        onChange={(e) => {
                          const updated = responses.map((r, i) => ({
                            ...r,
                            isDefault: i === index ? e.target.checked : false,
                          }));
                          setResponses(updated);
                        }}
                      />
                      Default Response
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label className="label">Headers (JSON)</label>
                  <textarea
                    className="textarea"
                    value={JSON.stringify(response.headers || {}, null, 2)}
                    onChange={(e) => {
                      try {
                        updateResponse(index, 'headers', JSON.parse(e.target.value));
                      } catch (err) {
                        // Invalid JSON, keep editing
                      }
                    }}
                    style={{ minHeight: '80px', fontFamily: 'monospace', fontSize: '13px' }}
                  />
                </div>

                <div className="form-group">
                  <label className="label">Body (JSON)</label>
                  <textarea
                    className="textarea"
                    value={JSON.stringify(response.body || {}, null, 2)}
                    onChange={(e) => updateResponseBody(index, e.target.value)}
                    style={{ minHeight: '150px', fontFamily: 'monospace', fontSize: '13px' }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button type="submit" className="btn btn-primary">
              {endpointId === 'new' ? 'Create Endpoint' : 'Save Changes'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate(`/apis/${apiId}`)}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      {/* Duplicate Modal */}
      {showDuplicateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div className="card" style={{ maxWidth: '500px', width: '100%', margin: '20px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px' }}>
              Duplicate Endpoint
            </h2>

            <div className="form-group">
              <label className="label">New Path</label>
              <input
                className="input"
                value={duplicatePath}
                onChange={(e) => setDuplicatePath(e.target.value)}
                placeholder="/users/:id-copy"
              />
            </div>

            <div className="form-group">
              <label className="label">Method</label>
              <select className="select" value={duplicateMethod} onChange={(e) => setDuplicateMethod(e.target.value)}>
                <option>GET</option>
                <option>POST</option>
                <option>PUT</option>
                <option>PATCH</option>
                <option>DELETE</option>
              </select>
            </div>

            <div className="form-group">
              <label className="label">Summary</label>
              <input
                className="input"
                value={duplicateSummary}
                onChange={(e) => setDuplicateSummary(e.target.value)}
                placeholder="Description"
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button className="btn btn-primary" onClick={confirmDuplicate} style={{ flex: 1 }}>
                Duplicate
              </button>
              <button className="btn btn-secondary" onClick={() => setShowDuplicateModal(false)} style={{ flex: 1 }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

