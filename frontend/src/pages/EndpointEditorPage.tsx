// frontend/src/pages/EndpointEditorPage.tsx
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiDefinitionsApi } from '../api/api-definitions';
import { ApiDefinition, ApiEndpoint, MockResponse } from '../api/types';
import { FakerMethodBrowser } from '../components/FakerMethodBrowser';
import { ResponsePreview } from '../components/ResponsePreview';
import { JSONEditor } from '../components/JSONEditor';
import { TemplateVariablesPanel } from '../components/TemplateVariablesPanel';
import toast from 'react-hot-toast';

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

  const [showFakerBrowser, setShowFakerBrowser] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [currentResponseIndex, setCurrentResponseIndex] = useState<number | null>(null);
  const [previewBody, setPreviewBody] = useState<any>(null);
  const [insertTexts, setInsertTexts] = useState<{ [key: number]: string }>({});

  const [method, setMethod] = useState('GET');
  const [path, setPath] = useState('');
  const [summary, setSummary] = useState('');
  const [delayMs, setDelayMs] = useState(0);
  const [enabled, setEnabled] = useState(true);
  const [responses, setResponses] = useState<MockResponse[]>([
    { status: 200, headers: {}, body: {}, isDefault: true },
  ]);
  
  // Phase 19 fields
  const [proxyMode, setProxyMode] = useState(false);
  const [proxyTarget, setProxyTarget] = useState('');
  const [proxyTimeout, setProxyTimeout] = useState(5000);
  const [deduplication, setDeduplication] = useState(false);
  const [cacheEnabled, setCacheEnabled] = useState(false);
  const [cacheTTL, setCacheTTL] = useState(3600);
  const [cacheControl, setCacheControl] = useState('public');

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
          
          // Phase 19 fields
          setProxyMode(ep.proxyMode || false);
          setProxyTarget(ep.proxyTarget || '');
          setProxyTimeout(ep.proxyTimeout || 5000);
          setDeduplication(ep.deduplication || false);
          setCacheEnabled(ep.cacheEnabled || false);
          setCacheTTL(ep.cacheTTL || 3600);
          setCacheControl(ep.cacheControl || 'public');
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
      // Phase 19 fields
      proxyMode,
      proxyTarget: proxyMode ? proxyTarget : null,
      proxyTimeout,
      deduplication,
      cacheEnabled,
      cacheTTL,
      cacheControl,
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

  const openFakerBrowser = (responseIndex: number) => {
    setCurrentResponseIndex(responseIndex);
    setShowFakerBrowser(true);
  };

  const openPreview = (responseIndex: number) => {
    setPreviewBody(responses[responseIndex].body);
    setShowPreview(true);
  };

  const handleFakerSelect = (method: string) => {
    if (currentResponseIndex === null) return;
    
    // Trigger insertion in the JSONEditor
    setInsertTexts((prev) => ({
      ...prev,
      [currentResponseIndex]: method,
    }));
  };

  const handleTextInserted = (index: number) => {
    // Clear the insertText after it's been inserted
    setInsertTexts((prev) => {
      const newTexts = { ...prev };
      delete newTexts[index];
      return newTexts;
    });
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

          {/* Phase 19: Performance & Caching */}
          <div style={{ marginTop: '32px', padding: '20px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
              ⚡ Performance & Caching
            </h3>

            {/* Proxy Mode */}
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={proxyMode}
                  onChange={(e) => setProxyMode(e.target.checked)}
                />
                <span style={{ fontWeight: '600' }}>Proxy Mode</span>
              </label>
              <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                Forward requests to a real API instead of returning mocked responses
              </p>
            </div>

            {proxyMode && (
              <div style={{ marginLeft: '24px', marginTop: '12px' }}>
                <div className="form-group">
                  <label className="label">Proxy Target URL</label>
                  <input
                    className="input"
                    value={proxyTarget}
                    onChange={(e) => setProxyTarget(e.target.value)}
                    placeholder="https://api.example.com"
                    type="url"
                    required={proxyMode}
                  />
                </div>
                <div className="form-group">
                  <label className="label">Timeout (ms)</label>
                  <input
                    className="input"
                    type="number"
                    value={proxyTimeout}
                    onChange={(e) => setProxyTimeout(parseInt(e.target.value) || 5000)}
                    min="100"
                    max="30000"
                  />
                </div>
              </div>
            )}

            {/* Request Deduplication */}
            <div className="form-group" style={{ marginTop: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={deduplication}
                  onChange={(e) => setDeduplication(e.target.checked)}
                />
                <span style={{ fontWeight: '600' }}>Request Deduplication</span>
              </label>
              <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                Cache identical requests for 60 seconds to reduce processing
              </p>
            </div>

            {/* Response Caching */}
            <div className="form-group" style={{ marginTop: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={cacheEnabled}
                  onChange={(e) => setCacheEnabled(e.target.checked)}
                />
                <span style={{ fontWeight: '600' }}>CDN/Browser Caching</span>
              </label>
              <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                Add Cache-Control and ETag headers for CDN and browser caching
              </p>
            </div>

            {cacheEnabled && (
              <div style={{ marginLeft: '24px', marginTop: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="label">Cache TTL (seconds)</label>
                  <input
                    className="input"
                    type="number"
                    value={cacheTTL}
                    onChange={(e) => setCacheTTL(parseInt(e.target.value) || 3600)}
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label className="label">Cache Control</label>
                  <select
                    className="select"
                    value={cacheControl}
                    onChange={(e) => setCacheControl(e.target.value)}
                  >
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Template Variables Panel */}
          <div style={{ marginTop: '24px' }}>
            <TemplateVariablesPanel
              path={path}
              onInsert={(variable) => {
                // Insert into the first response body for now
                // In production, you might want to track which editor is focused
                setInsertTexts((prev) => ({
                  ...prev,
                  [0]: variable,
                }));
                toast.success(`Inserted: ${variable}`);
              }}
            />
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
                  <JSONEditor
                    value={response.body || {}}
                    onChange={(value) => updateResponse(index, 'body', value)}
                    height="250px"
                    onInsertFaker={() => openFakerBrowser(index)}
                    onPreview={() => openPreview(index)}
                    insertText={insertTexts[index]}
                    onTextInserted={() => handleTextInserted(index)}
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

      {/* Faker Method Browser */}
      {showFakerBrowser && (
        <FakerMethodBrowser
          onSelect={handleFakerSelect}
          onClose={() => setShowFakerBrowser(false)}
        />
      )}

      {/* Response Preview */}
      {showPreview && previewBody && (
        <ResponsePreview
          responseBody={previewBody}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}

