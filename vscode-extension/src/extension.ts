import * as vscode from 'vscode';
import { MockApiClient } from './client';
import { ApisTreeProvider } from './providers/apisTreeProvider';
import { LogsTreeProvider } from './providers/logsTreeProvider';
import { FakerCompletionProvider } from './providers/fakerCompletionProvider';

export function activate(context: vscode.ExtensionContext) {
    console.log('Mock API Studio extension is now active');

    const client = new MockApiClient();

    // Register tree views
    const apisProvider = new ApisTreeProvider(client);
    const logsProvider = new LogsTreeProvider(client);

    vscode.window.registerTreeDataProvider('mockApiStudio.apis', apisProvider);
    vscode.window.registerTreeDataProvider('mockApiStudio.logs', logsProvider);

    // Register Faker IntelliSense
    const fakerProvider = new FakerCompletionProvider();
    context.subscriptions.push(
        vscode.languages.registerCompletionItemProvider(
            { scheme: 'file', language: 'json' },
            fakerProvider,
            '{', '.'
        )
    );

    // Command: Configure connection
    context.subscriptions.push(
        vscode.commands.registerCommand('mockApiStudio.configure', async () => {
            const apiUrl = await vscode.window.showInputBox({
                prompt: 'Enter Mock API Studio URL',
                value: vscode.workspace.getConfiguration('mockApiStudio').get('apiUrl') || 'http://localhost:3000'
            });

            if (apiUrl) {
                await vscode.workspace.getConfiguration('mockApiStudio').update('apiUrl', apiUrl, true);
            }

            const apiToken = await vscode.window.showInputBox({
                prompt: 'Enter API Token',
                password: true
            });

            if (apiToken) {
                await vscode.workspace.getConfiguration('mockApiStudio').update('apiToken', apiToken, true);
                vscode.window.showInformationMessage('Mock API Studio configured successfully!');
            }
        })
    );

    // Command: List APIs
    context.subscriptions.push(
        vscode.commands.registerCommand('mockApiStudio.listApis', async () => {
            try {
                const apis = await client.listApis();
                
                const quickPick = vscode.window.createQuickPick();
                quickPick.items = apis.map(api => ({
                    label: api.name,
                    description: api.version,
                    detail: api.description || '',
                    api
                }));
                quickPick.placeholder = 'Select an API';
                
                quickPick.onDidChangeSelection(selection => {
                    if (selection[0]) {
                        const item: any = selection[0];
                        vscode.window.showInformationMessage(`Selected: ${item.api.name}`);
                        quickPick.hide();
                    }
                });
                
                quickPick.show();
            } catch (error: any) {
                vscode.window.showErrorMessage(`Failed to list APIs: ${error.message}`);
            }
        })
    );

    // Command: Create Endpoint
    context.subscriptions.push(
        vscode.commands.registerCommand('mockApiStudio.createEndpoint', async () => {
            try {
                const apis = await client.listApis();
                
                const apiSelection = await vscode.window.showQuickPick(
                    apis.map(api => ({ label: api.name, value: api.id })),
                    { placeHolder: 'Select API' }
                );

                if (!apiSelection) return;

                const method = await vscode.window.showQuickPick(
                    ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
                    { placeHolder: 'Select HTTP Method' }
                );

                if (!method) return;

                const path = await vscode.window.showInputBox({
                    prompt: 'Enter endpoint path (e.g., /users/:id)',
                    value: '/'
                });

                if (!path) return;

                const summary = await vscode.window.showInputBox({
                    prompt: 'Enter endpoint description',
                    value: `${method} ${path}`
                });

                const endpoint = await client.createEndpoint(apiSelection.value, {
                    method,
                    path,
                    summary: summary || `${method} ${path}`,
                    responses: [
                        {
                            status: 200,
                            body: { message: 'Success', data: '{{faker.datatype.json}}' },
                            isDefault: true
                        }
                    ],
                    enabled: true
                });

                vscode.window.showInformationMessage(`Endpoint created: ${method} ${path}`);
                apisProvider.refresh();
            } catch (error: any) {
                vscode.window.showErrorMessage(`Failed to create endpoint: ${error.message}`);
            }
        })
    );

    // Command: Test Endpoint
    context.subscriptions.push(
        vscode.commands.registerCommand('mockApiStudio.testEndpoint', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showErrorMessage('No active editor');
                return;
            }

            const selection = editor.selection;
            const text = editor.document.getText(selection);

            // Parse as JSON to extract endpoint info
            try {
                const endpoint = JSON.parse(text);
                const url = `${client.getBaseUrl()}/mock/${endpoint.apiSlug}${endpoint.path}`;
                
                const response = await client.testEndpoint(url, endpoint.method);
                
                const doc = await vscode.workspace.openTextDocument({
                    content: JSON.stringify(response, null, 2),
                    language: 'json'
                });
                
                await vscode.window.showTextDocument(doc);
            } catch (error: any) {
                vscode.window.showErrorMessage(`Failed to test endpoint: ${error.message}`);
            }
        })
    );

    // Command: View Logs
    context.subscriptions.push(
        vscode.commands.registerCommand('mockApiStudio.viewLogs', async () => {
            logsProvider.refresh();
            vscode.commands.executeCommand('mockApiStudio.logs.focus');
        })
    );

    // CodeLens provider for inline results
    const codeLensProvider = vscode.languages.registerCodeLensProvider(
        { scheme: 'file', language: 'json' },
        {
            provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
                const codeLenses: vscode.CodeLens[] = [];
                const text = document.getText();

                // Find endpoint definitions
                const endpointRegex = /"method":\s*"(GET|POST|PUT|DELETE|PATCH)"/g;
                let match;

                while ((match = endpointRegex.exec(text)) !== null) {
                    const position = document.positionAt(match.index);
                    const range = new vscode.Range(position, position);
                    
                    codeLenses.push(new vscode.CodeLens(range, {
                        title: '▶️ Test Endpoint',
                        command: 'mockApiStudio.testEndpoint'
                    }));
                }

                return codeLenses;
            }
        }
    );

    context.subscriptions.push(codeLensProvider);
}

export function deactivate() {
    console.log('Mock API Studio extension is now deactivated');
}

