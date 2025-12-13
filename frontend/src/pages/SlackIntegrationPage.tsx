import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '../contexts/WorkspaceContext';
import toast from 'react-hot-toast';
import { apiClient } from '../api/client';

const AVAILABLE_EVENTS = [
  { id: 'api.created', label: 'API Created', description: 'Notify when a new API is created' },
  { id: 'api.deleted', label: 'API Deleted', description: 'Notify when an API is deleted' },
  { id: 'rate_limit.exceeded', label: 'Rate Limit Exceeded', description: 'Notify when rate limits are hit' },
  { id: 'high_traffic', label: 'High Traffic', description: 'Notify when traffic spikes are detected' },
  { id: 'webhook.failed', label: 'Webhook Failed', description: 'Notify when webhook delivery fails' },
  { id: 'endpoint.errors', label: 'Endpoint Errors', description: 'Notify when endpoints have errors' },
];

export function SlackIntegrationPage() {
  const navigate = useNavigate();
  const { currentWorkspace } = useWorkspace();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [integration, setIntegration] = useState<any>(null);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (currentWorkspace) {
      loadIntegration();
    }
  }, [currentWorkspace]);

  const loadIntegration = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/integrations/slack/workspace/${currentWorkspace!.id}`);
      const data = response.data;
      
      if (data) {
        setIntegration(data);
        setWebhookUrl(data.webhookUrl || '');
        setSelectedEvents(data.events || []);
        setIsActive(data.isActive);
      }
    } catch (err: any) {
      if (err.response?.status !== 404) {
        console.error('Failed to load integration:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!webhookUrl.startsWith('https://hooks.slack.com/')) {
      toast.error('Please enter a valid Slack webhook URL');
      return;
    }

    if (selectedEvents.length === 0) {
      toast.error('Please select at least one event to monitor');
      return;
    }

    try {
      setSaving(true);
      await apiClient.post(`/integrations/slack/workspace/${currentWorkspace!.id}`, {
        webhookUrl,
        events: selectedEvents,
        isActive,
      });
      
      toast.success('Slack integration saved successfully!');
      await loadIntegration();
    } catch (err: any) {
      toast.error(`Failed to save integration: ${err.response?.data?.message || err.message}`);
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this Slack integration?')) {
      return;
    }

    try {
      await apiClient.delete(`/integrations/slack/workspace/${currentWorkspace!.id}`);
      toast.success('Slack integration deleted');
      setIntegration(null);
      setWebhookUrl('');
      setSelectedEvents([]);
      setIsActive(true);
    } catch (err: any) {
      toast.error(`Failed to delete integration: ${err.response?.data?.message || err.message}`);
      console.error(err);
    }
  };

  const toggleEvent = (eventId: string) => {
    if (selectedEvents.includes(eventId)) {
      setSelectedEvents(selectedEvents.filter(e => e !== eventId));
    } else {
      setSelectedEvents([...selectedEvents, eventId]);
    }
  };

  if (loading) {
    return <div className="loading">Loading integration...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <button className="btn btn-secondary" onClick={() => navigate('/')}>
          ← Back to Dashboard
        </button>
      </div>

      <div className="card">
        <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>
          🔔 Slack Integration
        </h1>
        <p style={{ color: '#6b7280', marginBottom: '24px' }}>
          Receive real-time notifications in your Slack workspace for important events.
        </p>

        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="label">
              Slack Webhook URL
              <span style={{ color: '#dc2626', marginLeft: '4px' }}>*</span>
            </label>
            <input
              type="url"
              className="input"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
              required
            />
            <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '8px' }}>
              Get your webhook URL from{' '}
              <a
                href="https://api.slack.com/messaging/webhooks"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#3b82f6', textDecoration: 'underline' }}
              >
                Slack's Incoming Webhooks
              </a>
            </p>
          </div>

          <div className="form-group">
            <label className="label">Events to Monitor</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {AVAILABLE_EVENTS.map((event) => (
                <label
                  key={event.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '12px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    background: selectedEvents.includes(event.id) ? 'var(--bg-secondary)' : 'transparent',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedEvents.includes(event.id)}
                    onChange={() => toggleEvent(event.id)}
                    style={{ marginTop: '4px' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                      {event.label}
                    </div>
                    <div style={{ fontSize: '14px', color: '#6b7280' }}>
                      {event.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              <span style={{ fontWeight: 600 }}>Active</span>
            </label>
            <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '8px' }}>
              Disable temporarily to stop receiving notifications without deleting the configuration
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : integration ? 'Update Integration' : 'Create Integration'}
            </button>
            {integration && (
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDelete}
              >
                Delete Integration
              </button>
            )}
          </div>
        </form>

        {integration && (
          <div
            style={{
              marginTop: '24px',
              padding: '16px',
              background: 'var(--bg-secondary)',
              borderRadius: '6px',
            }}
          >
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
              Integration Status
            </h3>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>
              <div>
                <strong>Created:</strong>{' '}
                {new Date(integration.createdAt).toLocaleString()}
              </div>
              <div>
                <strong>Last Updated:</strong>{' '}
                {new Date(integration.updatedAt).toLocaleString()}
              </div>
              <div>
                <strong>Active Events:</strong> {integration.events.length}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

