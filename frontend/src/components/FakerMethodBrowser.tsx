import { useState, useEffect } from 'react';
import { fakerDocsApi } from '../api/faker-docs';
import toast from 'react-hot-toast';
import './FakerMethodBrowser.css';

interface FakerMethodBrowserProps {
  onSelect: (method: string) => void;
  onClose: () => void;
}

export function FakerMethodBrowser({ onSelect, onClose }: FakerMethodBrowserProps) {
  const [methods, setMethods] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState<string | null>(null);

  useEffect(() => {
    loadMethods();
  }, []);

  const loadMethods = async () => {
    try {
      setLoading(true);
      const response = await fakerDocsApi.getAvailableMethods();
      setMethods(response.data);
    } catch (error) {
      console.error('Failed to load Faker methods:', error);
      toast.error('Failed to load Faker methods');
    } finally {
      setLoading(false);
    }
  };

  const filterMethods = () => {
    if (!searchQuery) return methods;

    const filtered: Record<string, string[]> = {};
    const query = searchQuery.toLowerCase();

    Object.entries(methods).forEach(([module, methodList]) => {
      const matchingMethods = methodList.filter(method =>
        module.toLowerCase().includes(query) ||
        method.toLowerCase().includes(query)
      );

      if (matchingMethods.length > 0) {
        filtered[module] = matchingMethods;
      }
    });

    return filtered;
  };

  const filteredMethods = filterMethods();
  const modules = Object.keys(filteredMethods).sort();

  const handleMethodClick = (module: string, method: string) => {
    const syntax = `{{faker.${module}.${method}}}`;
    onSelect(syntax);
    toast.success(`Inserted: ${syntax}`);
    onClose();
  };

  const copyToClipboard = (module: string, method: string) => {
    const syntax = `{{faker.${module}.${method}}}`;
    navigator.clipboard.writeText(syntax);
    toast.success('Copied to clipboard!');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content faker-browser" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Faker.js Method Browser</h2>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        <div className="faker-browser-body">
          {/* Search */}
          <div className="search-bar">
            <input
              type="text"
              className="input"
              placeholder="Search modules or methods..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>

          {loading ? (
            <div className="loading">Loading methods...</div>
          ) : modules.length === 0 ? (
            <div className="empty-state">
              <p>No methods found matching "{searchQuery}"</p>
            </div>
          ) : (
            <div className="methods-container">
              {/* Module List */}
              <div className="module-list">
                {modules.map((module) => (
                  <button
                    key={module}
                    className={`module-item ${selectedModule === module ? 'active' : ''}`}
                    onClick={() => setSelectedModule(module)}
                  >
                    <span className="module-name">{module}</span>
                    <span className="method-count">{filteredMethods[module].length}</span>
                  </button>
                ))}
              </div>

              {/* Method List */}
              <div className="method-list">
                {selectedModule ? (
                  <>
                    <div className="method-list-header">
                      <h3>{selectedModule}</h3>
                      <span className="method-count-text">
                        {filteredMethods[selectedModule].length} methods
                      </span>
                    </div>
                    <div className="method-items">
                      {filteredMethods[selectedModule].map((method) => (
                        <div key={method} className="method-item">
                          <div className="method-info">
                            <span className="method-name">{method}</span>
                            <code className="method-syntax">
                              {`{{faker.${selectedModule}.${method}}}`}
                            </code>
                          </div>
                          <div className="method-actions">
                            <button
                              className="btn btn-sm btn-secondary"
                              onClick={() => copyToClipboard(selectedModule, method)}
                              title="Copy to clipboard"
                            >
                              📋
                            </button>
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={() => handleMethodClick(selectedModule, method)}
                            >
                              Insert
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="no-module-selected">
                    <p>Select a module to view its methods</p>
                  </div>
                )}
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

