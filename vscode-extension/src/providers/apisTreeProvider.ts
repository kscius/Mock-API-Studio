import * as vscode from 'vscode';
import { MockApiClient } from '../client';

export class ApisTreeProvider implements vscode.TreeDataProvider<ApiTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<ApiTreeItem | undefined | null> = new vscode.EventEmitter<ApiTreeItem | undefined | null>();
    readonly onDidChangeTreeData: vscode.Event<ApiTreeItem | undefined | null> = this._onDidChangeTreeData.event;

    constructor(private client: MockApiClient) {}

    refresh(): void {
        this._onDidChangeTreeData.fire(undefined);
    }

    getTreeItem(element: ApiTreeItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: ApiTreeItem): Promise<ApiTreeItem[]> {
        if (!element) {
            try {
                const apis = await this.client.listApis();
                return apis.map(api => new ApiTreeItem(
                    api.name,
                    api.version,
                    vscode.TreeItemCollapsibleState.None
                ));
            } catch (error) {
                return [];
            }
        }
        return [];
    }
}

class ApiTreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        private version: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(label, collapsibleState);
        this.tooltip = `${this.label} (${this.version})`;
        this.description = this.version;
    }
}

