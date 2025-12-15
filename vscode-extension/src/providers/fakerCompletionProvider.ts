import * as vscode from 'vscode';

export class FakerCompletionProvider implements vscode.CompletionItemProvider {
    provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position
    ): vscode.CompletionItem[] {
        const linePrefix = document.lineAt(position).text.substr(0, position.character);

        if (!linePrefix.endsWith('{{faker.')) {
            return [];
        }

        const completions: vscode.CompletionItem[] = [
            this.createCompletion('name.firstName', 'Generate random first name', 'John'),
            this.createCompletion('name.lastName', 'Generate random last name', 'Doe'),
            this.createCompletion('internet.email', 'Generate random email', 'john.doe@example.com'),
            this.createCompletion('internet.url', 'Generate random URL', 'https://example.com'),
            this.createCompletion('datatype.uuid', 'Generate UUID', '550e8400-e29b-41d4-a716-446655440000'),
            this.createCompletion('datatype.number', 'Generate random number', '42'),
            this.createCompletion('datatype.boolean', 'Generate random boolean', 'true'),
            this.createCompletion('datatype.json', 'Generate random JSON', '{"key": "value"}'),
            this.createCompletion('lorem.paragraph', 'Generate lorem ipsum paragraph', 'Lorem ipsum...'),
            this.createCompletion('date.past', 'Generate past date', '2023-01-15'),
            this.createCompletion('date.future', 'Generate future date', '2025-12-31'),
            this.createCompletion('address.city', 'Generate city name', 'New York'),
            this.createCompletion('company.name', 'Generate company name', 'Acme Corp'),
            this.createCompletion('phone.number', 'Generate phone number', '+1-555-123-4567'),
        ];

        return completions;
    }

    private createCompletion(label: string, documentation: string, example: string): vscode.CompletionItem {
        const item = new vscode.CompletionItem(label, vscode.CompletionItemKind.Function);
        item.documentation = new vscode.MarkdownString(`${documentation}\n\n**Example:** \`${example}\``);
        item.insertText = `${label}}}`;
        return item;
    }
}

