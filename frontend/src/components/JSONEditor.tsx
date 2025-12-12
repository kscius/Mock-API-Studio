import { useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { useTheme } from '../contexts/ThemeContext';
import './JSONEditor.css';

interface JSONEditorProps {
  value: any;
  onChange: (value: any) => void;
  height?: string;
  readOnly?: boolean;
  onInsertFaker?: () => void;
  onPreview?: () => void;
  insertText?: string; // Text to insert at cursor
  onTextInserted?: () => void; // Callback after insertion
}

export function JSONEditor({
  value,
  onChange,
  height = '200px',
  readOnly = false,
  onInsertFaker,
  onPreview,
  insertText,
  onTextInserted,
}: JSONEditorProps) {
  const { theme } = useTheme();
  const editorRef = useRef<any>(null);

  // Handle text insertion
  useEffect(() => {
    if (insertText && editorRef.current) {
      const editor = editorRef.current;
      const selection = editor.getSelection();
      const id = { major: 1, minor: 1 };
      const text = insertText;
      const op = {
        identifier: id,
        range: selection,
        text,
        forceMoveMarkers: true,
      };
      editor.executeEdits('insert-faker', [op]);
      editor.focus();
      
      // Trigger onChange with new value
      const newValue = editor.getValue();
      handleEditorChange(newValue);
      
      if (onTextInserted) {
        onTextInserted();
      }
    }
  }, [insertText]);

  const stringValue = typeof value === 'string' 
    ? value 
    : JSON.stringify(value, null, 2);

  const handleEditorChange = (newValue: string | undefined) => {
    if (!newValue) {
      onChange({});
      return;
    }

    try {
      const parsed = JSON.parse(newValue);
      onChange(parsed);
    } catch (err) {
      // Keep the string for continued editing
      // Don't update if invalid JSON
    }
  };

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;

    // Configure Faker.js autocomplete
    monaco.languages.registerCompletionItemProvider('json', {
      triggerCharacters: ['.'],
      provideCompletionItems: (model: any, position: any) => {
        const textUntilPosition = model.getValueInRange({
          startLineNumber: position.lineNumber,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column,
        });

        // Check if we're inside {{faker.
        const fakerMatch = textUntilPosition.match(/\{\{faker\.([a-zA-Z]*)$/);
        if (!fakerMatch) {
          return { suggestions: [] };
        }

        // Common Faker.js modules
        const modules = [
          'person', 'internet', 'location', 'phone', 'company', 
          'commerce', 'finance', 'date', 'lorem', 'string',
          'number', 'color', 'image', 'datatype', 'vehicle',
          'animal', 'music', 'science', 'system'
        ];

        const suggestions = modules.map((moduleName) => ({
          label: moduleName,
          kind: monaco.languages.CompletionItemKind.Module,
          insertText: `${moduleName}.`,
          documentation: `Faker.js ${moduleName} module`,
        }));

        return { suggestions };
      },
    });

    // Add Faker.js syntax highlighting
    monaco.editor.defineTheme('faker-theme-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'faker-placeholder', foreground: '0066CC', fontStyle: 'bold' },
      ],
      colors: {},
    });

    monaco.editor.defineTheme('faker-theme-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'faker-placeholder', foreground: '4FC3F7', fontStyle: 'bold' },
      ],
      colors: {},
    });
  };

  return (
    <div className="json-editor-container">
      {(onInsertFaker || onPreview) && (
        <div className="json-editor-toolbar">
          {onPreview && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onPreview}
              title="Preview with Faker.js data"
            >
              👁️ Preview
            </button>
          )}
          {onInsertFaker && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onInsertFaker}
              title="Insert Faker.js template"
            >
              ✨ Insert Faker
            </button>
          )}
        </div>
      )}
      <Editor
        height={height}
        language="json"
        value={stringValue}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        theme={theme === 'dark' ? 'vs-dark' : 'vs'}
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 13,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          wrappingIndent: 'indent',
          automaticLayout: true,
          formatOnPaste: true,
          formatOnType: true,
          tabSize: 2,
          insertSpaces: true,
          bracketPairColorization: {
            enabled: true,
          },
          suggest: {
            showWords: true,
            showMethods: true,
            showFunctions: true,
          },
        }}
      />
    </div>
  );
}

