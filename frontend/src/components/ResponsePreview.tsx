import { useState } from 'react';
import { fakerDocsApi } from '../api/faker-docs';
import toast from 'react-hot-toast';
import './ResponsePreview.css';

interface ResponsePreviewProps {
  responseBody: any;
  onClose: () => void;
}

export function ResponsePreview({ responseBody, onClose }: ResponsePreviewProps) {
  const [preview, setPreview] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generatePreview = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if there are Faker placeholders
      const bodyString = JSON.stringify(responseBody);
      const hasFaker = /\{\{faker\.[a-zA-Z0-9\._-]+\}\}/i.test(bodyString);

      if (!hasFaker) {
        setError('No Faker.js placeholders found in response body');
        setLoading(false);
        return;
      }

      // Call backend to render the template
      const response = await fakerDocsApi.renderTemplate(responseBody);
      setPreview(response.data);
    } catch (err: any) {
      console.error('Failed to generate preview:', err);
      setError(err.response?.data?.message || 'Failed to generate preview');
      toast.error('Failed to generate preview');
    } finally {
      setLoading(false);
    }
  };

  const regenerate = () => {
    setPreview(null);
    generatePreview();
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(preview, null, 2));
    toast.success('Copied to clipboard!');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content preview-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Response Preview with Faker.js</h2>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        <div className="preview-body">
          {!preview && !loading && !error && (
            <div className="preview-empty">
              <p>Click "Generate Preview" to see your response with Faker.js data</p>
              <button className="btn btn-primary" onClick={generatePreview}>
                Generate Preview
              </button>
            </div>
          )}

          {loading && (
            <div className="preview-loading">
              <div className="spinner"></div>
              <p>Generating preview...</p>
            </div>
          )}

          {error && (
            <div className="preview-error">
              <p className="error-message">⚠️ {error}</p>
              <button className="btn btn-secondary" onClick={generatePreview}>
                Try Again
              </button>
            </div>
          )}

          {preview && (
            <div className="preview-content">
              <div className="preview-header">
                <h3>Generated Data</h3>
                <div className="preview-actions">
                  <button className="btn btn-secondary btn-sm" onClick={copyToClipboard}>
                    📋 Copy
                  </button>
                  <button className="btn btn-primary btn-sm" onClick={regenerate}>
                    🔄 Regenerate
                  </button>
                </div>
              </div>

              <div className="preview-comparison">
                <div className="preview-section">
                  <h4>Original Template</h4>
                  <pre className="preview-code">
                    {JSON.stringify(responseBody, null, 2)}
                  </pre>
                </div>

                <div className="preview-divider">→</div>

                <div className="preview-section">
                  <h4>Generated Output</h4>
                  <pre className="preview-code preview-output">
                    {JSON.stringify(preview, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

