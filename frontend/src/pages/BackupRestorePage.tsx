import React, { useState } from 'react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { apiClient } from '../api/client';

export const BackupRestorePage: React.FC = () => {
  const { currentWorkspace } = useWorkspace();
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [overwrite, setOverwrite] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const handleBackup = async () => {
    if (!currentWorkspace) return;

    try {
      setBackingUp(true);
      const response = await apiClient.get(
        `/workspaces/${currentWorkspace.id}/backup`,
        { responseType: 'blob' },
      );

      const blob = new Blob([response.data], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const date = new Date().toISOString().split('T')[0];
      link.href = url;
      link.download = `workspace-${currentWorkspace.slug}-${date}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      alert('Backup downloaded successfully!');
    } catch (error: any) {
      alert(`Error: ${error.response?.data?.message || error.message}`);
    } finally {
      setBackingUp(false);
    }
  };

  const handleRestore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkspace || !restoreFile) {
      alert('Please select a backup file to restore');
      return;
    }

    if (!confirm(
      `Are you sure you want to restore backup to workspace "${currentWorkspace.name}"?${
        overwrite ? ' This will overwrite existing data.' : ''
      }`,
    )) {
      return;
    }

    try {
      setRestoring(true);
      const formData = new FormData();
      formData.append('file', restoreFile);
      formData.append('overwrite', String(overwrite));

      await apiClient.post(
        `/workspaces/${currentWorkspace.id}/backup/restore`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );

      setRestoreFile(null);
      alert('Backup restored successfully!');
    } catch (error: any) {
      alert(`Error: ${error.response?.data?.message || error.message}`);
    } finally {
      setRestoring(false);
    }
  };

  if (!currentWorkspace) {
    return <div style={{ padding: '20px' }}>Please select a workspace first.</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <h1>Backup & Restore</h1>
        <p style={{ color: '#666', margin: '5px 0' }}>
          Export or restore workspace data for <strong>{currentWorkspace.name}</strong>
        </p>
      </div>

      <div style={{
        backgroundColor: '#f9f9f9',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px',
        border: '1px solid #e0e0e0',
      }}>
        <h2>Backup Workspace</h2>
        <p style={{ color: '#666', fontSize: '14px', marginBottom: '15px' }}>
          Download a JSON backup of all APIs, endpoints, and configuration in this workspace.
        </p>
        <button
          onClick={handleBackup}
          disabled={backingUp}
          style={{
            padding: '10px 20px',
            backgroundColor: backingUp ? '#ccc' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: backingUp ? 'not-allowed' : 'pointer',
            fontSize: '14px',
          }}
        >
          {backingUp ? 'Creating Backup...' : 'Download Backup'}
        </button>
      </div>

      <div style={{
        backgroundColor: '#f9f9f9',
        padding: '20px',
        borderRadius: '8px',
        border: '1px solid #e0e0e0',
      }}>
        <h2>Restore Workspace</h2>
        <p style={{ color: '#666', fontSize: '14px', marginBottom: '15px' }}>
          Upload a previously exported backup JSON file to restore workspace data.
        </p>
        <form onSubmit={handleRestore}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Backup File (.json) *
            </label>
            <input
              type="file"
              accept=".json"
              onChange={(e) => setRestoreFile(e.target.files?.[0] || null)}
              style={{ fontSize: '14px' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                checked={overwrite}
                onChange={(e) => setOverwrite(e.target.checked)}
              />
              <span>Overwrite existing data</span>
            </label>
            <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
              When enabled, existing APIs and endpoints may be replaced by backup data.
            </small>
          </div>

          <button
            type="submit"
            disabled={restoring || !restoreFile}
            style={{
              padding: '10px 20px',
              backgroundColor: restoring || !restoreFile ? '#ccc' : '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: restoring || !restoreFile ? 'not-allowed' : 'pointer',
              fontSize: '14px',
            }}
          >
            {restoring ? 'Restoring...' : 'Restore Backup'}
          </button>
        </form>
      </div>
    </div>
  );
};
