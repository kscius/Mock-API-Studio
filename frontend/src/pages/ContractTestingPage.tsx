import React, { useState, useEffect } from 'react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { apiClient } from '../api/client';
import { apiDefinitionsApi } from '../api/api-definitions';
import { ApiDefinition } from '../api/types';

interface Contract {
  contractId: string;
  consumer: string;
  provider: string;
  interactions: number;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  missingEndpoints: string[];
  mismatchedResponses: Array<{
    endpoint: string;
    expected: unknown;
    actual: unknown;
    differences: string[];
  }>;
}

interface BrokerPact {
  consumer: string;
  provider: string;
  version: string;
  createdAt?: string;
}

interface BrokerStatus {
  configured: boolean;
  baseUrl: string | null;
}

export const ContractTestingPage: React.FC = () => {
  const { currentWorkspace } = useWorkspace();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [apis, setApis] = useState<ApiDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApiId, setSelectedApiId] = useState('');
  const [selectedContractId, setSelectedContractId] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [uploading, setUploading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [brokerStatus, setBrokerStatus] = useState<BrokerStatus | null>(null);
  const [brokerProvider, setBrokerProvider] = useState('');
  const [brokerPacts, setBrokerPacts] = useState<BrokerPact[]>([]);
  const [brokerConsumer, setBrokerConsumer] = useState('');
  const [brokerVersion, setBrokerVersion] = useState('');
  const [publishVersion, setPublishVersion] = useState('');
  const [brokerLoading, setBrokerLoading] = useState(false);

  useEffect(() => {
    loadContracts();
    loadBrokerStatus();
    if (currentWorkspace) {
      loadApis();
    }
  }, [currentWorkspace]);

  const loadBrokerStatus = async () => {
    try {
      const response = await apiClient.get<BrokerStatus>('/admin/contract-testing/broker/status');
      setBrokerStatus(response.data);
    } catch (error) {
      console.error('Failed to load broker status:', error);
    }
  };

  const loadBrokerPacts = async () => {
    if (!brokerProvider.trim()) {
      alert('Enter a provider name to list broker pacts');
      return;
    }
    try {
      setBrokerLoading(true);
      const response = await apiClient.get<{ pacts: BrokerPact[] }>(
        '/admin/contract-testing/broker/pacts',
        { params: { provider: brokerProvider.trim() } },
      );
      setBrokerPacts(response.data.pacts);
    } catch (error: any) {
      alert(`Error: ${error.response?.data?.message || error.message}`);
    } finally {
      setBrokerLoading(false);
    }
  };

  const handleBrokerImport = async () => {
    if (!selectedApiId || !brokerConsumer.trim() || !brokerProvider.trim()) {
      alert('Select an API and enter consumer/provider names');
      return;
    }
    try {
      setBrokerLoading(true);
      await apiClient.post('/admin/contract-testing/broker/import', {
        apiId: selectedApiId,
        consumer: brokerConsumer.trim(),
        provider: brokerProvider.trim(),
        version: brokerVersion.trim() || undefined,
      });
      alert('Contract imported from Pact Broker');
      await loadContracts();
    } catch (error: any) {
      alert(`Error: ${error.response?.data?.message || error.message}`);
    } finally {
      setBrokerLoading(false);
    }
  };

  const handleBrokerPublish = async () => {
    if (!selectedContractId || !publishVersion.trim()) {
      alert('Select a contract and enter a version to publish');
      return;
    }
    try {
      setBrokerLoading(true);
      await apiClient.post('/admin/contract-testing/broker/publish', {
        contractId: selectedContractId,
        version: publishVersion.trim(),
      });
      alert('Contract published to Pact Broker');
    } catch (error: any) {
      alert(`Error: ${error.response?.data?.message || error.message}`);
    } finally {
      setBrokerLoading(false);
    }
  };

  const loadContracts = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<{ contracts: Contract[]; total: number }>(
        '/admin/contract-testing/contracts',
      );
      setContracts(response.data.contracts);
    } catch (error) {
      console.error('Failed to load contracts:', error);
      alert('Error loading contracts');
    } finally {
      setLoading(false);
    }
  };

  const loadApis = async () => {
    if (!currentWorkspace) return;
    try {
      const response = await apiDefinitionsApi.getAll(currentWorkspace.id);
      setApis(response.data);
      if (response.data.length > 0 && !selectedApiId) {
        setSelectedApiId(response.data[0].id);
      }
    } catch (error) {
      console.error('Failed to load APIs:', error);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !selectedApiId) {
      alert('Please select an API and a Pact contract file');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('apiId', selectedApiId);

      await apiClient.post('/admin/contract-testing/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setUploadFile(null);
      await loadContracts();
      alert('Contract uploaded successfully!');
    } catch (error: any) {
      alert(`Error: ${error.response?.data?.message || error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleValidate = async () => {
    if (!selectedApiId || !selectedContractId) {
      alert('Please select an API and a contract to validate');
      return;
    }

    try {
      setValidating(true);
      setValidationResult(null);
      const response = await apiClient.post<ValidationResult>(
        '/admin/contract-testing/validate',
        { apiId: selectedApiId, contractId: selectedContractId },
      );
      setValidationResult(response.data);
    } catch (error: any) {
      alert(`Error: ${error.response?.data?.message || error.message}`);
    } finally {
      setValidating(false);
    }
  };

  if (!currentWorkspace) {
    return <div style={{ padding: '20px' }}>Please select a workspace first.</div>;
  }

  if (loading) {
    return <div style={{ padding: '20px' }}>Loading contract testing...</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <h1>Contract Testing</h1>
        <p style={{ color: '#666', margin: '5px 0' }}>
          Upload Pact contracts and validate APIs against them
        </p>
      </div>

      <div style={{
        backgroundColor: '#f9f9f9',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px',
        border: '1px solid #e0e0e0',
      }}>
        <h2>Upload Pact Contract</h2>
        <form onSubmit={handleUpload}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              API *
            </label>
            <select
              value={selectedApiId}
              onChange={(e) => setSelectedApiId(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                fontSize: '14px',
                borderRadius: '4px',
                border: '1px solid #ccc',
              }}
            >
              <option value="">Select an API</option>
              {apis.map((api) => (
                <option key={api.id} value={api.id}>{api.name}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Pact Contract File (.json) *
            </label>
            <input
              type="file"
              accept=".json"
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              style={{ fontSize: '14px' }}
            />
          </div>

          <button
            type="submit"
            disabled={uploading}
            style={{
              padding: '10px 20px',
              backgroundColor: uploading ? '#ccc' : '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: uploading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
            }}
          >
            {uploading ? 'Uploading...' : 'Upload Contract'}
          </button>
        </form>
      </div>

      <div style={{
        backgroundColor: '#f9f9f9',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px',
        border: '1px solid #e0e0e0',
      }}>
        <h2>Validate Contract</h2>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginBottom: '15px' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              API
            </label>
            <select
              value={selectedApiId}
              onChange={(e) => setSelectedApiId(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                fontSize: '14px',
                borderRadius: '4px',
                border: '1px solid #ccc',
              }}
            >
              <option value="">Select an API</option>
              {apis.map((api) => (
                <option key={api.id} value={api.id}>{api.name}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Contract
            </label>
            <select
              value={selectedContractId}
              onChange={(e) => setSelectedContractId(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                fontSize: '14px',
                borderRadius: '4px',
                border: '1px solid #ccc',
              }}
            >
              <option value="">Select a contract</option>
              {contracts.map((c) => (
                <option key={c.contractId} value={c.contractId}>
                  {c.consumer} → {c.provider}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button
          onClick={handleValidate}
          disabled={validating}
          style={{
            padding: '10px 20px',
            backgroundColor: validating ? '#ccc' : '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: validating ? 'not-allowed' : 'pointer',
            fontSize: '14px',
          }}
        >
          {validating ? 'Validating...' : 'Validate'}
        </button>

        {validationResult && (
          <div style={{
            marginTop: '20px',
            padding: '15px',
            borderRadius: '8px',
            backgroundColor: validationResult.valid ? '#e8f5e9' : '#ffebee',
            border: `1px solid ${validationResult.valid ? '#a5d6a7' : '#ef9a9a'}`,
          }}>
            <h3 style={{ margin: '0 0 10px 0', color: validationResult.valid ? '#2e7d32' : '#c62828' }}>
              {validationResult.valid ? 'Validation Passed' : 'Validation Failed'}
            </h3>
            {validationResult.errors.length > 0 && (
              <div style={{ marginBottom: '10px' }}>
                <strong>Errors:</strong>
                <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                  {validationResult.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
            {validationResult.warnings.length > 0 && (
              <div style={{ marginBottom: '10px' }}>
                <strong>Warnings:</strong>
                <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                  {validationResult.warnings.map((warn, i) => (
                    <li key={i}>{warn}</li>
                  ))}
                </ul>
              </div>
            )}
            {validationResult.missingEndpoints.length > 0 && (
              <div>
                <strong>Missing Endpoints:</strong>
                <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                  {validationResult.missingEndpoints.map((ep, i) => (
                    <li key={i}>{ep}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{
        backgroundColor: '#f9f9f9',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px',
        border: '1px solid #e0e0e0',
      }}>
        <h2>Pact Broker</h2>
        {brokerStatus && (
          <p style={{ color: '#666', fontSize: '14px' }}>
            {brokerStatus.configured
              ? `Connected to ${brokerStatus.baseUrl}`
              : 'Broker not configured. Set PACT_BROKER_BASE_URL on the server.'}
          </p>
        )}
        <div style={{ display: 'grid', gap: '12px', maxWidth: '600px' }}>
          <input
            type="text"
            placeholder="Provider name"
            value={brokerProvider}
            onChange={(e) => setBrokerProvider(e.target.value)}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          <input
            type="text"
            placeholder="Consumer name (for import)"
            value={brokerConsumer}
            onChange={(e) => setBrokerConsumer(e.target.value)}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          <input
            type="text"
            placeholder="Version (optional — uses latest if empty)"
            value={brokerVersion}
            onChange={(e) => setBrokerVersion(e.target.value)}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={loadBrokerPacts}
              disabled={brokerLoading || !brokerStatus?.configured}
              style={{
                padding: '8px 16px',
                backgroundColor: '#607D8B',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: brokerLoading ? 'not-allowed' : 'pointer',
              }}
            >
              List Broker Pacts
            </button>
            <button
              type="button"
              onClick={handleBrokerImport}
              disabled={brokerLoading || !brokerStatus?.configured}
              style={{
                padding: '8px 16px',
                backgroundColor: '#00897B',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: brokerLoading ? 'not-allowed' : 'pointer',
              }}
            >
              Import from Broker
            </button>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Publish version (e.g. 1.0.0)"
              value={publishVersion}
              onChange={(e) => setPublishVersion(e.target.value)}
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', flex: 1 }}
            />
            <button
              type="button"
              onClick={handleBrokerPublish}
              disabled={brokerLoading || !brokerStatus?.configured}
              style={{
                padding: '8px 16px',
                backgroundColor: '#3949AB',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: brokerLoading ? 'not-allowed' : 'pointer',
              }}
            >
              Publish Selected Contract
            </button>
          </div>
        </div>
        {brokerPacts.length > 0 && (
          <ul style={{ marginTop: '16px', paddingLeft: '20px' }}>
            {brokerPacts.map((pact) => (
              <li key={`${pact.consumer}-${pact.version}`}>
                {pact.consumer} → {pact.provider} @ {pact.version}
              </li>
            ))}
          </ul>
        )}
      </div>

      <h2>Contracts ({contracts.length})</h2>
      {contracts.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          backgroundColor: '#f9f9f9',
          borderRadius: '8px',
          color: '#999',
        }}>
          <p>No contracts uploaded yet.</p>
        </div>
      ) : (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          overflow: 'hidden',
          border: '1px solid #e0e0e0',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #e0e0e0' }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>Contract ID</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Consumer</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Provider</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Interactions</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((contract) => (
                <tr key={contract.contractId} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: '13px' }}>
                    {contract.contractId}
                  </td>
                  <td style={{ padding: '12px' }}>{contract.consumer}</td>
                  <td style={{ padding: '12px' }}>{contract.provider}</td>
                  <td style={{ padding: '12px' }}>{contract.interactions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
