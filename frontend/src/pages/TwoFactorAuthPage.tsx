import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import toast from 'react-hot-toast';

interface TwoFactorStatus {
  enabled: boolean;
}

export function TwoFactorAuthPage() {
  const [status, setStatus] = useState<TwoFactorStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [verificationToken, setVerificationToken] = useState('');
  const [disableToken, setDisableToken] = useState('');

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/auth/2fa/status');
      setStatus(response.data);
    } catch (err) {
      toast.error('Failed to load 2FA status');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSetupStart = async () => {
    try {
      const response = await apiClient.post('/auth/2fa/setup');
      setQrCodeUrl(response.data.qrCodeUrl);
      setSecret(response.data.secret);
      setShowSetupModal(true);
    } catch (err: any) {
      toast.error(`Failed to setup 2FA: ${err.response?.data?.message || err.message}`);
      console.error(err);
    }
  };

  const handleEnable = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/auth/2fa/enable', {
        token: verificationToken,
        secret,
      });
      toast.success('Two-factor authentication enabled successfully!');
      setShowSetupModal(false);
      setQrCodeUrl(null);
      setSecret(null);
      setVerificationToken('');
      loadStatus();
    } catch (err: any) {
      toast.error(`Failed to enable 2FA: ${err.response?.data?.message || err.message}`);
      console.error(err);
    }
  };

  const handleDisable = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.delete('/auth/2fa/disable', {
        data: { token: disableToken },
      });
      toast.success('Two-factor authentication disabled successfully!');
      setShowDisableModal(false);
      setDisableToken('');
      loadStatus();
    } catch (err: any) {
      toast.error(`Failed to disable 2FA: ${err.response?.data?.message || err.message}`);
      console.error(err);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px' }}>
        Two-Factor Authentication
      </h1>

      <div className="card" style={{ maxWidth: '600px' }}>
        <div style={{ display: 'flex', alignItems: 'start', gap: '16px' }}>
          <div
            style={{
              padding: '12px',
              borderRadius: '8px',
              backgroundColor: status?.enabled ? '#d4edda' : '#fff3cd',
            }}
          >
            <span style={{ fontSize: '32px' }}>{status?.enabled ? '🔒' : '🔓'}</span>
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
              {status?.enabled ? 'Two-Factor Authentication is Enabled' : 'Two-Factor Authentication is Disabled'}
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              {status?.enabled
                ? 'Your account is protected with two-factor authentication. You will need to enter a code from your authenticator app when logging in.'
                : 'Add an extra layer of security to your account by enabling two-factor authentication. You will need an authenticator app like Google Authenticator or Authy.'}
            </p>
            {status?.enabled ? (
              <button className="btn btn-danger" onClick={() => setShowDisableModal(true)}>
                Disable 2FA
              </button>
            ) : (
              <button className="btn btn-primary" onClick={handleSetupStart}>
                Enable 2FA
              </button>
            )}
          </div>
        </div>

        {status?.enabled && (
          <div
            style={{
              marginTop: '20px',
              padding: '16px',
              backgroundColor: 'var(--bg-tertiary)',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
            }}
          >
            <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
              ℹ️ Recovery Information
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              If you lose access to your authenticator app, you will need to contact support to regain access to your account.
              Make sure to keep a backup of your recovery codes in a safe place.
            </p>
          </div>
        )}
      </div>

      {/* Setup Modal */}
      {showSetupModal && (
        <div
          style={{
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
          }}
        >
          <div className="card" style={{ maxWidth: '500px', width: '100%', margin: '20px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px' }}>
              Setup Two-Factor Authentication
            </h2>

            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '14px', marginBottom: '12px' }}>
                1. Scan this QR code with your authenticator app:
              </p>
              {qrCodeUrl && (
                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                  <img
                    src={qrCodeUrl}
                    alt="QR Code"
                    style={{
                      border: '2px solid var(--border-color)',
                      borderRadius: '8px',
                      padding: '8px',
                      backgroundColor: 'white',
                    }}
                  />
                </div>
              )}
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                Can't scan? Enter this code manually: <code style={{ padding: '2px 6px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '4px', fontSize: '14px', fontFamily: 'monospace' }}>{secret}</code>
              </p>
            </div>

            <form onSubmit={handleEnable}>
              <div className="form-group">
                <label className="label">2. Enter the 6-digit code from your app:</label>
                <input
                  className="input"
                  type="text"
                  value={verificationToken}
                  onChange={(e) => setVerificationToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  required
                  style={{ fontSize: '24px', textAlign: 'center', letterSpacing: '8px' }}
                  maxLength={6}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Verify & Enable
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowSetupModal(false);
                    setQrCodeUrl(null);
                    setSecret(null);
                    setVerificationToken('');
                  }}
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Disable Modal */}
      {showDisableModal && (
        <div
          style={{
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
          }}
        >
          <div className="card" style={{ maxWidth: '500px', width: '100%', margin: '20px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px' }}>
              Disable Two-Factor Authentication
            </h2>

            <div
              style={{
                padding: '16px',
                backgroundColor: '#fff3cd',
                border: '1px solid #ffc107',
                borderRadius: '6px',
                marginBottom: '20px',
              }}
            >
              <p style={{ fontWeight: '600', marginBottom: '8px', color: '#856404' }}>
                ⚠️ Warning
              </p>
              <p style={{ fontSize: '14px', color: '#856404' }}>
                Disabling two-factor authentication will make your account less secure.
              </p>
            </div>

            <form onSubmit={handleDisable}>
              <div className="form-group">
                <label className="label">Enter the 6-digit code from your authenticator app:</label>
                <input
                  className="input"
                  type="text"
                  value={disableToken}
                  onChange={(e) => setDisableToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  required
                  style={{ fontSize: '24px', textAlign: 'center', letterSpacing: '8px' }}
                  maxLength={6}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="submit" className="btn btn-danger" style={{ flex: 1 }}>
                  Disable 2FA
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowDisableModal(false);
                    setDisableToken('');
                  }}
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

