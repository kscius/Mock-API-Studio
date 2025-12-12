import { useState } from 'react';
import './TemplateVariablesPanel.css';

interface TemplateVariablesPanelProps {
  path: string;
  onInsert: (variable: string) => void;
}

export function TemplateVariablesPanel({ path, onInsert }: TemplateVariablesPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Extract path parameters from route
  const getPathParams = (): string[] => {
    const params: string[] = [];
    const regex = /:([a-zA-Z0-9_]+)/g;
    let match;
    while ((match = regex.exec(path)) !== null) {
      params.push(match[1]);
    }
    return params;
  };

  const pathParams = getPathParams();

  const variableGroups = [
    {
      title: 'Path Parameters',
      description: 'Dynamic segments from the URL path',
      variables: pathParams.map((param) => ({
        name: `params.${param}`,
        syntax: `{{params.${param}}}`,
        example: path.includes(`:${param}`) ? `Value from /:${param}/` : undefined,
      })),
    },
    {
      title: 'Query Parameters',
      description: 'Parameters from the URL query string',
      variables: [
        { name: 'query.*', syntax: '{{query.paramName}}', example: '?paramName=value' },
        { name: 'query.page', syntax: '{{query.page}}', example: '?page=1' },
        { name: 'query.limit', syntax: '{{query.limit}}', example: '?limit=10' },
        { name: 'query.search', syntax: '{{query.search}}', example: '?search=term' },
      ],
    },
    {
      title: 'Request Body',
      description: 'Data from the request body (POST/PUT/PATCH)',
      variables: [
        { name: 'body.*', syntax: '{{body.fieldName}}', example: 'Any field from request body' },
        { name: 'body.name', syntax: '{{body.name}}', example: 'User name from body' },
        { name: 'body.email', syntax: '{{body.email}}', example: 'Email from body' },
      ],
    },
    {
      title: 'Request Headers',
      description: 'HTTP headers from the request',
      variables: [
        { name: 'headers.*', syntax: '{{headers.headerName}}', example: 'Any request header' },
        { name: 'headers.authorization', syntax: '{{headers.authorization}}', example: 'Authorization header' },
        { name: 'headers.user-agent', syntax: '{{headers.user-agent}}', example: 'User agent string' },
      ],
    },
    {
      title: 'Special Variables',
      description: 'Built-in utility variables',
      variables: [
        { name: 'timestamp', syntax: '{{timestamp}}', example: 'Current Unix timestamp' },
        { name: 'date', syntax: '{{date}}', example: 'Current ISO date' },
        { name: 'randomInt', syntax: '{{randomInt}}', example: 'Random integer' },
        { name: 'uuid', syntax: '{{uuid}}', example: 'Random UUID v4' },
      ],
    },
  ];

  const copyToClipboard = (syntax: string) => {
    navigator.clipboard.writeText(syntax);
  };

  return (
    <div className={`variables-panel ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <button
        className="variables-panel-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
        title={isExpanded ? 'Hide template variables' : 'Show template variables'}
      >
        <span className="toggle-icon">{isExpanded ? '▼' : '▶'}</span>
        <span className="toggle-text">Template Variables</span>
        {!isExpanded && <span className="toggle-hint">(Click to expand)</span>}
      </button>

      {isExpanded && (
        <div className="variables-content">
          <div className="variables-intro">
            <p>Available variables for dynamic response templating:</p>
          </div>

          {variableGroups.map((group) => (
            <div key={group.title} className="variable-group">
              <h4 className="group-title">{group.title}</h4>
              <p className="group-description">{group.description}</p>

              {group.variables.length === 0 ? (
                <p className="no-variables">No {group.title.toLowerCase()} detected in this endpoint</p>
              ) : (
                <div className="variables-list">
                  {group.variables.map((variable) => (
                    <div key={variable.syntax} className="variable-item">
                      <div className="variable-info">
                        <code className="variable-syntax">{variable.syntax}</code>
                        {variable.example && (
                          <span className="variable-example">{variable.example}</span>
                        )}
                      </div>
                      <div className="variable-actions">
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => copyToClipboard(variable.syntax)}
                          title="Copy to clipboard"
                        >
                          📋
                        </button>
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => onInsert(variable.syntax)}
                          title="Insert at cursor"
                        >
                          Insert
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

