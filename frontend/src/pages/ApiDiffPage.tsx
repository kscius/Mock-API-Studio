import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';

interface Version {
  version: string;
  isLatest: boolean;
  createdAt: string;
  endpointCount: number;
}

interface EndpointDiff {
  changeType: 'added' | 'removed' | 'modified' | 'unchanged';
  method: string;
  path: string;
  summary?: string;
  changes: Array<{
    field: string;
    oldValue: any;
    newValue: any;
    changeType: string;
  }>;
  breakingChanges: Array<{
    type: string;
    description: string;
    severity: 'critical' | 'major' | 'minor';
  }>;
}

interface DiffResult {
  fromVersion: string;
  toVersion: string;
  addedEndpoints: EndpointDiff[];
  removedEndpoints: EndpointDiff[];
  modifiedEndpoints: EndpointDiff[];
  unchangedCount: number;
  breakingChangesCount: number;
  summary: {
    totalChanges: number;
    additions: number;
    deletions: number;
    modifications: number;
    breakingChanges: number;
  };
}

export const ApiDiffPage: React.FC = () => {
  const { apiId } = useParams<{ apiId: string }>();

  const [versions, setVersions] = useState<Version[]>([]);
  const [fromVersion, setFromVersion] = useState('');
  const [toVersion, setToVersion] = useState('');
  const [diffResult, setDiffResult] = useState<DiffResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchVersions();
  }, [apiId]);

  const fetchVersions = async () => {
    if (!apiId) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/admin/api-diff/${apiId}/versions`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setVersions(data.versions || []);

        // Auto-select latest as "to" version
        const latest = data.versions.find((v: Version) => v.isLatest);
        if (latest) {
          setToVersion(latest.version);
        }
      }
    } catch (error) {
      console.error('Error fetching versions:', error);
    }
  };

  const comparVersions = async () => {
    if (!apiId || !fromVersion || !toVersion) {
      toast.error('Please select both versions to compare');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/admin/api-diff/${apiId}/compare`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            fromVersion,
            toVersion,
          }),
        },
      );

      if (response.ok) {
        const data = await response.json();
        setDiffResult(data.diff);

        if (data.hasBreakingChanges) {
          toast.error(data.message);
        } else {
          toast.success(data.message);
        }
      } else {
        toast.error('Failed to compare versions');
      }
    } catch (error) {
      toast.error('Error comparing versions');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '#d32f2f';
      case 'major':
        return '#f57c00';
      case 'minor':
        return '#fbc02d';
      default:
        return '#757575';
    }
  };

  const getChangeTypeColor = (changeType: string) => {
    switch (changeType) {
      case 'added':
        return '#4caf50';
      case 'removed':
        return '#f44336';
      case 'modified':
        return '#ff9800';
      default:
        return '#9e9e9e';
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '30px' }}>
        <h1>📊 API Version Comparison</h1>
        <p style={{ color: '#666', marginTop: '10px' }}>
          Compare two versions of your API to identify changes and breaking changes
        </p>
      </div>

      {/* Version Selector */}
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginBottom: '20px',
      }}>
        <h2 style={{ marginTop: 0 }}>Select Versions to Compare</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '15px', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500 }}>
              From Version (Old)
            </label>
            <select
              value={fromVersion}
              onChange={(e) => setFromVersion(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
              }}
            >
              <option value="">Select version...</option>
              {versions.map((v) => (
                <option key={v.version} value={v.version}>
                  {v.version} {v.isLatest && '(Latest)'} - {v.endpointCount} endpoints
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500 }}>
              To Version (New)
            </label>
            <select
              value={toVersion}
              onChange={(e) => setToVersion(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
              }}
            >
              <option value="">Select version...</option>
              {versions.map((v) => (
                <option key={v.version} value={v.version}>
                  {v.version} {v.isLatest && '(Latest)'} - {v.endpointCount} endpoints
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={comparVersions}
            disabled={loading || !fromVersion || !toVersion}
            style={{
              padding: '10px 30px',
              backgroundColor: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading || !fromVersion || !toVersion ? 'not-allowed' : 'pointer',
              opacity: loading || !fromVersion || !toVersion ? 0.6 : 1,
              fontWeight: 500,
            }}
          >
            {loading ? 'Comparing...' : '🔍 Compare'}
          </button>
        </div>
      </div>

      {/* Diff Results */}
      {diffResult && (
        <>
          {/* Summary */}
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            marginBottom: '20px',
          }}>
            <h2 style={{ marginTop: 0 }}>Summary</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '15px' }}>
              <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#333' }}>
                  {diffResult.summary.totalChanges}
                </div>
                <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>Total Changes</div>
              </div>
              <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#e8f5e9', borderRadius: '8px' }}>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#4caf50' }}>
                  {diffResult.summary.additions}
                </div>
                <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>Added</div>
              </div>
              <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#ffebee', borderRadius: '8px' }}>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#f44336' }}>
                  {diffResult.summary.deletions}
                </div>
                <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>Removed</div>
              </div>
              <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#fff3e0', borderRadius: '8px' }}>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ff9800' }}>
                  {diffResult.summary.modifications}
                </div>
                <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>Modified</div>
              </div>
              <div style={{
                textAlign: 'center',
                padding: '15px',
                backgroundColor: diffResult.summary.breakingChanges > 0 ? '#ffebee' : '#e8f5e9',
                borderRadius: '8px'
              }}>
                <div style={{
                  fontSize: '32px',
                  fontWeight: 'bold',
                  color: diffResult.summary.breakingChanges > 0 ? '#d32f2f' : '#4caf50'
                }}>
                  {diffResult.summary.breakingChanges}
                </div>
                <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>Breaking Changes</div>
              </div>
            </div>
          </div>

          {/* Added Endpoints */}
          {diffResult.addedEndpoints.length > 0 && (
            <div style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              marginBottom: '20px',
            }}>
              <h2 style={{ marginTop: 0, color: '#4caf50' }}>
                ➕ Added Endpoints ({diffResult.addedEndpoints.length})
              </h2>
              {diffResult.addedEndpoints.map((endpoint, idx) => (
                <div key={idx} style={{
                  padding: '15px',
                  backgroundColor: '#f1f8f4',
                  borderLeft: '4px solid #4caf50',
                  borderRadius: '4px',
                  marginBottom: '10px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      padding: '4px 8px',
                      backgroundColor: getChangeTypeColor(endpoint.method === 'GET' ? 'added' : 'added'),
                      color: 'white',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                    }}>
                      {endpoint.method}
                    </span>
                    <code style={{ fontFamily: 'monospace', fontSize: '14px' }}>{endpoint.path}</code>
                    {endpoint.summary && (
                      <span style={{ color: '#666', fontSize: '14px' }}>- {endpoint.summary}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Removed Endpoints */}
          {diffResult.removedEndpoints.length > 0 && (
            <div style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              marginBottom: '20px',
            }}>
              <h2 style={{ marginTop: 0, color: '#f44336' }}>
                ➖ Removed Endpoints ({diffResult.removedEndpoints.length})
              </h2>
              {diffResult.removedEndpoints.map((endpoint, idx) => (
                <div key={idx} style={{
                  padding: '15px',
                  backgroundColor: '#ffebee',
                  borderLeft: '4px solid #f44336',
                  borderRadius: '4px',
                  marginBottom: '10px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <span style={{
                      padding: '4px 8px',
                      backgroundColor: '#f44336',
                      color: 'white',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                    }}>
                      {endpoint.method}
                    </span>
                    <code style={{ fontFamily: 'monospace', fontSize: '14px' }}>{endpoint.path}</code>
                    {endpoint.summary && (
                      <span style={{ color: '#666', fontSize: '14px' }}>- {endpoint.summary}</span>
                    )}
                  </div>
                  {endpoint.breakingChanges.map((change, cidx) => (
                    <div key={cidx} style={{
                      padding: '8px',
                      backgroundColor: 'white',
                      borderRadius: '4px',
                      fontSize: '13px',
                      marginTop: '5px',
                    }}>
                      <span style={{
                        padding: '2px 6px',
                        backgroundColor: getSeverityColor(change.severity),
                        color: 'white',
                        borderRadius: '3px',
                        fontSize: '11px',
                        marginRight: '8px',
                      }}>
                        {change.severity.toUpperCase()}
                      </span>
                      {change.description}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Modified Endpoints */}
          {diffResult.modifiedEndpoints.length > 0 && (
            <div style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              marginBottom: '20px',
            }}>
              <h2 style={{ marginTop: 0, color: '#ff9800' }}>
                🔄 Modified Endpoints ({diffResult.modifiedEndpoints.length})
              </h2>
              {diffResult.modifiedEndpoints.map((endpoint, idx) => (
                <div key={idx} style={{
                  padding: '15px',
                  backgroundColor: '#fff8f0',
                  borderLeft: '4px solid #ff9800',
                  borderRadius: '4px',
                  marginBottom: '15px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <span style={{
                      padding: '4px 8px',
                      backgroundColor: '#ff9800',
                      color: 'white',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                    }}>
                      {endpoint.method}
                    </span>
                    <code style={{ fontFamily: 'monospace', fontSize: '14px' }}>{endpoint.path}</code>
                  </div>

                  {/* Breaking Changes */}
                  {endpoint.breakingChanges.length > 0 && (
                    <div style={{ marginBottom: '10px' }}>
                      <strong style={{ fontSize: '13px', color: '#d32f2f' }}>
                        ⚠️ Breaking Changes:
                      </strong>
                      {endpoint.breakingChanges.map((change, cidx) => (
                        <div key={cidx} style={{
                          padding: '8px',
                          backgroundColor: 'white',
                          borderRadius: '4px',
                          fontSize: '13px',
                          marginTop: '5px',
                        }}>
                          <span style={{
                            padding: '2px 6px',
                            backgroundColor: getSeverityColor(change.severity),
                            color: 'white',
                            borderRadius: '3px',
                            fontSize: '11px',
                            marginRight: '8px',
                          }}>
                            {change.severity.toUpperCase()}
                          </span>
                          {change.description}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Field Changes */}
                  {endpoint.changes.length > 0 && (
                    <div>
                      <strong style={{ fontSize: '13px' }}>Changes:</strong>
                      {endpoint.changes.map((change, cidx) => (
                        <div key={cidx} style={{
                          padding: '8px',
                          backgroundColor: 'white',
                          borderRadius: '4px',
                          fontSize: '13px',
                          marginTop: '5px',
                        }}>
                          <strong>{change.field}:</strong> Modified
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Unchanged Count */}
          {diffResult.unchangedCount > 0 && (
            <div style={{
              backgroundColor: 'white',
              padding: '15px 20px',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              textAlign: 'center',
              color: '#666',
            }}>
              ✅ {diffResult.unchangedCount} endpoint(s) unchanged
            </div>
          )}
        </>
      )}
    </div>
  );
};

