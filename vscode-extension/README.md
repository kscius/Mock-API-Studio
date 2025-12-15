# Mock API Studio - VS Code Extension

Manage your Mock API Studio instance directly from VS Code!

## Features

- **Create Endpoints**: Create mock API endpoints with IntelliSense support
- **Test Endpoints**: Test endpoints directly from the editor with inline results
- **View Logs**: Monitor recent API requests in real-time
- **Faker IntelliSense**: Auto-completion for Faker.js templates
- **Syntax Highlighting**: Highlight Faker template expressions
- **Code Lens**: Quick actions directly in your JSON files
- **API Explorer**: Browse all your APIs in the sidebar

## Installation

1. Open VS Code
2. Press `Ctrl+P` / `Cmd+P`
3. Type `ext install mock-api-studio`
4. Press Enter

## Configuration

1. Open Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. Type `Mock API Studio: Configure Connection`
3. Enter your Mock API Studio URL (default: `http://localhost:3000`)
4. Enter your API token

Or manually configure in settings:

```json
{
  "mockApiStudio.apiUrl": "http://localhost:3000",
  "mockApiStudio.apiToken": "your-token-here",
  "mockApiStudio.defaultWorkspace": "workspace-id"
}
```

## Commands

- `Mock API Studio: Create Endpoint` - Create a new mock endpoint
- `Mock API Studio: Test Endpoint` - Test the selected endpoint
- `Mock API Studio: List APIs` - Browse all APIs
- `Mock API Studio: View Logs` - View recent request logs
- `Mock API Studio: Configure Connection` - Set up connection to your instance

## Usage

### Create Endpoint

1. Open Command Palette
2. Run `Mock API Studio: Create Endpoint`
3. Select API
4. Choose HTTP method
5. Enter path and description

### Test Endpoint

1. Select an endpoint JSON in your editor
2. Run `Mock API Studio: Test Endpoint` or click the CodeLens button
3. View response in a new editor

### Faker Templates

Type `{{faker.` in any JSON file to get auto-completion for Faker.js functions:

```json
{
  "name": "{{faker.name.firstName}}",
  "email": "{{faker.internet.email}}",
  "id": "{{faker.datatype.uuid}}"
}
```

### Snippets

- `faker-name` - Insert name generator
- `faker-email` - Insert email generator
- `faker-uuid` - Insert UUID generator
- `mock-endpoint` - Create full endpoint template

## Requirements

- VS Code 1.75.0 or higher
- Mock API Studio instance running

## Release Notes

### 1.0.0

- Initial release
- Create and test endpoints
- Faker IntelliSense
- API and log explorers
- Syntax highlighting

## Support

- [Documentation](https://github.com/your-org/mock-api-studio)
- [Issues](https://github.com/your-org/mock-api-studio/issues)

## License

MIT

