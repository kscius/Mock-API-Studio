import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface RecordingSession {
  sessionId: string;
  targetUrl: string;
  isActive: boolean;
  recordedCount: number;
  createdAt: string;
}

interface RecordedRequest {
  method: string;
  path: string;
  status: number;
  timestamp: string;
}

export const MockRecordingPage: React.FC = () => {
  const { apiId } = useParams<{ apiId: string }>();
  const navigate = useNavigate();

  const [sessions, setSessions] = useState<RecordingSession[]>([]);
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [targetUrl, setTargetUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchSessions = async () => {
    if (!apiId) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/admin/mock-recording/api/${apiId}/sessions`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const startRecording = async () => {
    if (!apiId || !targetUrl) {
      toast.error('Please enter a target URL');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/admin/mock-recording/start`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            apiId,
            targetUrl,
          }),
        },
      );

      if (response.ok) {
        const data = await response.json();
        toast.success('Recording session started!');
        setCurrentSession(data);
        fetchSessions();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to start recording');
      }
    } catch (error) {
      toast.error('Error starting recording session');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const stopRecording = async (sessionId: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/admin/mock-recording/${sessionId}/stop`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        toast.success('Recording session stopped');
        setCurrentSession(null);
        fetchSessions();
      } else {
        toast.error('Failed to stop recording');
      }
    } catch (error) {
      toast.error('Error stopping recording session');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const generateMocks = async (sessionId: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/admin/mock-recording/${sessionId}/generate`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        toast.success(`Generated ${data.created} mock endpoint(s)!`);
        fetchSessions();
        // Navigate back to API detail page
        navigate(`/apis/${apiId}`);
      } else {
        toast.error('Failed to generate mocks');
      }
    } catch (error) {
      toast.error('Error generating mocks');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const viewSession = async (sessionId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/admin/mock-recording/${sessionId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setCurrentSession(data);
      }
    } catch (error) {
      toast.error('Error loading session details');
      console.error(error);
    }
  };

  const deleteSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this recording session?')) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/admin/mock-recording/${sessionId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        toast.success('Recording session deleted');
        fetchSessions();
        if (currentSession?.sessionId === sessionId) {
          setCurrentSession(null);
        }
      } else {
        toast.error('Failed to delete session');
      }
    } catch (error) {
      toast.error('Error deleting session');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [apiId]);

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '30px' }}>
        <h1>🎙️ Mock Recording</h1>
        <p style={{ color: '#666', marginTop: '10px' }}>
          Record real API requests and automatically generate mock endpoints
        </p>
      </div>

      {/* Start New Recording */}
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginBottom: '20px',
      }}>
        <h2 style={{ marginTop: 0 }}>Start New Recording</h2>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500 }}>
              Target API URL
            </label>
            <input
              type="text"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="https://api.example.com"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
              }}
            />
            <small style={{ color: '#666', fontSize: '12px' }}>
              Enter the base URL of the API you want to record
            </small>
          </div>
          <button
            onClick={startRecording}
            disabled={loading || !targetUrl}
            style={{
              padding: '10px 20px',
              backgroundColor: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading || !targetUrl ? 'not-allowed' : 'pointer',
              opacity: loading || !targetUrl ? 0.6 : 1,
              fontWeight: 500,
            }}
          >
            {loading ? 'Starting...' : '🔴 Start Recording'}
          </button>
        </div>
      </div>

      {/* Recording Sessions */}
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}>
        <h2 style={{ marginTop: 0 }}>Recording Sessions</h2>

        {sessions.length === 0 ? (
          <p style={{ color: '#666', textAlign: 'center', padding: '40px 20px' }}>
            No recording sessions yet. Start a new recording to get started.
          </p>
        ) : (
          <div style={{ display: 'grid', gap: '15px' }}>
            {sessions.map((session) => (
              <div
                key={session.sessionId}
                style={{
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  padding: '15px',
                  backgroundColor: session.isActive ? '#f0f7ff' : '#fafafa',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 500,
                        backgroundColor: session.isActive ? '#4caf50' : '#9e9e9e',
                        color: 'white',
                      }}>
                        {session.isActive ? '🔴 Active' : '⏸️ Stopped'}
                      </span>
                      <span style={{ fontSize: '14px', color: '#666' }}>
                        {session.recordedCount} request(s) recorded
                      </span>
                    </div>
                    <div style={{ fontSize: '14px', color: '#333', marginTop: '8px' }}>
                      <strong>Target:</strong> {session.targetUrl}
                    </div>
                    <div style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>
                      Session ID: {session.sessionId}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {session.isActive && (
                      <button
                        onClick={() => stopRecording(session.sessionId)}
                        disabled={loading}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#ff9800',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: loading ? 'not-allowed' : 'pointer',
                          fontSize: '13px',
                          fontWeight: 500,
                        }}
                      >
                        ⏸️ Stop
                      </button>
                    )}
                    {!session.isActive && session.recordedCount > 0 && (
                      <button
                        onClick={() => generateMocks(session.sessionId)}
                        disabled={loading}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#4caf50',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: loading ? 'not-allowed' : 'pointer',
                          fontSize: '13px',
                          fontWeight: 500,
                        }}
                      >
                        ✨ Generate Mocks
                      </button>
                    )}
                    <button
                      onClick={() => viewSession(session.sessionId)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#2196f3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 500,
                      }}
                    >
                      👁️ View
                    </button>
                    <button
                      onClick={() => deleteSession(session.sessionId)}
                      disabled={loading}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '13px',
                        fontWeight: 500,
                      }}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Session Details */}
      {currentSession && currentSession.requests && (
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          marginTop: '20px',
        }}>
          <h2 style={{ marginTop: 0 }}>Recorded Requests ({currentSession.recordedCount})</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Method</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Path</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Status</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {currentSession.requests.map((req: RecordedRequest, index: number) => (
                  <tr key={index} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '10px' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 500,
                        backgroundColor: req.method === 'GET' ? '#e3f2fd' : '#fff3e0',
                        color: req.method === 'GET' ? '#1976d2' : '#f57c00',
                      }}>
                        {req.method}
                      </span>
                    </td>
                    <td style={{ padding: '10px', fontFamily: 'monospace', fontSize: '13px' }}>
                      {req.path}
                    </td>
                    <td style={{ padding: '10px' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 500,
                        backgroundColor: req.status < 400 ? '#e8f5e9' : '#ffebee',
                        color: req.status < 400 ? '#388e3c' : '#d32f2f',
                      }}>
                        {req.status}
                      </span>
                    </td>
                    <td style={{ padding: '10px', fontSize: '13px', color: '#666' }}>
                      {new Date(req.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Help Section */}
      <div style={{
        backgroundColor: '#f5f5f5',
        padding: '15px',
        borderRadius: '8px',
        marginTop: '20px',
        fontSize: '14px',
      }}>
        <h3 style={{ marginTop: 0, fontSize: '16px' }}>📖 How to Use Mock Recording</h3>
        <ol style={{ marginLeft: '20px', lineHeight: '1.8' }}>
          <li>Enter the base URL of the API you want to record (e.g., https://api.github.com)</li>
          <li>Click "Start Recording" to create a new recording session</li>
          <li>Make requests to your target API - they will be automatically captured</li>
          <li>Click "Stop" when you're done recording</li>
          <li>Review the recorded requests and click "Generate Mocks" to create endpoints</li>
          <li>The system will automatically create mock endpoints with real responses</li>
        </ol>
        <p style={{ margin: '10px 0 0 0', color: '#666' }}>
          <strong>💡 Tip:</strong> Sensitive headers (Authorization, Cookie, etc.) are automatically removed for security.
        </p>
      </div>
    </div>
  );
};

