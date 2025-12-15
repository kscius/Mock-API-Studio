import * as vscode from 'vscode';
import { MockApiClient } from '../client';

export class LogsTreeProvider implements vscode.TreeDataProvider<LogTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<LogTreeItem | undefined | null> = new vscode.EventEmitter<LogTreeItem | undefined | null>();
    readonly onDidChangeTreeData: vscode.Event<LogTreeItem | undefined | null> = this._onDidChangeTreeData.event;

    constructor(private client: MockApiClient) {}

    refresh(): void {
        this._onDidChangeTreeData.fire(undefined);
    }

    getTreeItem(element: LogTreeItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: LogTreeItem): Promise<LogTreeItem[]> {
        if (!element) {
            try {
                const logs = await this.client.getLogs(20);
                return logs.map(log => new LogTreeItem(
                    `${log.method} ${log.path}`,
                    log.statusCode,
                    vscode.TreeItemCollapsibleState.None
                ));
            } catch (error) {
                return [];
            }
        }
        return [];
    }
}

class LogTreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        private statusCode: number,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(label, collapsibleState);
        this.tooltip = `Status: ${this.statusCode}`;
        this.description = `${this.statusCode}`;
    }
}

