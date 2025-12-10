import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { apiDefinitionsApi } from '../api/api-definitions';

export const OpenApiImportPage: React.FC = () => {
  const { currentWorkspace } = useWorkspace();
  const navigate = useNavigate();
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [dryRunResult, setDryRunResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  };

  const validateAndSetFile = (f: File) => {
    const validTypes = ['.json', '.yaml', '.yml'];
    const isValid = validTypes.some(ext => f.name.toLowerCase().endsWith(ext));
    
    if (!isValid) {
      setError('Please upload a .json, .yaml, or .yml file');
      return;
    }

    setFile(f);
    setError(null);
    setDryRunResult(null);
  };

  const handleDryRun = async () => {
    if (!file || !currentWorkspace) return;

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(
        `/api/api-definitions/import/openapi/upload?workspaceId=${currentWorkspace.id}&dryRun=true`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const result = await response.json();
      setDryRunResult(result);
    } catch (err: any) {
      setError(err.message || 'Failed to preview OpenAPI spec');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!file || !currentWorkspace) return;

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(
        `/api/api-definitions/import/openapi/upload?workspaceId=${currentWorkspace.id}`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const result = await response.json();
      alert(`Success! Imported ${result.summary.endpointsCount} endpoints for ${result.summary.apiName}`);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to import OpenAPI spec');
    } finally {
      setLoading(false);
    }
  };

  if (!currentWorkspace) {
    return <div>Please select a workspace first.</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Import OpenAPI Specification</h1>
      <p style={{ color: '#666', marginBottom: '30px' }}>
        Upload a Swagger/OpenAPI spec file (.json, .yaml, .yml) to automatically create mock endpoints.
      </p>

      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          border: dragging ? '3px dashed #4CAF50' : '2px dashed #ccc',
          borderRadius: '8px',
          padding: '60px 20px',
          textAlign: 'center',
          backgroundColor: dragging ? '#f0f8f0' : '#fafafa',
          cursor: 'pointer',
          marginBottom: '20px',
        }}
      >
        <input
          type="file"
          id="file-input"
          accept=".json,.yaml,.yml"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        <label htmlFor="file-input" style={{ cursor: 'pointer' }}>
          <div style={{ fontSize: '48px', marginBottom: '10px' }}>📄</div>
          <p style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '5px' }}>
            {file ? file.name : 'Drag & drop your OpenAPI file here'}
          </p>
          <p style={{ fontSize: '14px', color: '#999' }}>
            or click to browse (.json, .yaml, .yml)
          </p>
        </label>
      </div>

      {error && (
        <div style={{ 
          padding: '15px', 
          backgroundColor: '#ffebee', 
          color: '#c62828',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          {error}
        </div>
      )}

      {/* Actions */}
      {file && !dryRunResult && (
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '20px' }}>
          <button
            onClick={handleDryRun}
            disabled={loading}
            style={{
              padding: '12px 24px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
            }}
          >
            {loading ? 'Loading...' : 'Preview'}
          </button>
          <button
            onClick={() => setFile(null)}
            style={{
              padding: '12px 24px',
              backgroundColor: '#666',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Clear
          </button>
        </div>
      )}

      {/* Dry Run Result */}
      {dryRunResult && (
        <div style={{ 
          backgroundColor: '#e3f2fd', 
          padding: '20px', 
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h3>Preview Summary</h3>
          <p><strong>API Name:</strong> {dryRunResult.summary.apiName}</p>
          <p><strong>API Slug:</strong> {dryRunResult.summary.apiSlug}</p>
          <p><strong>Endpoints:</strong> {dryRunResult.summary.endpointsCount}</p>

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button
              onClick={handleImport}
              disabled={loading}
              style={{
                padding: '12px 24px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
              }}
            >
              {loading ? 'Importing...' : 'Import Now'}
            </button>
            <button
              onClick={() => setDryRunResult(null)}
              style={{
                padding: '12px 24px',
                backgroundColor: '#666',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

