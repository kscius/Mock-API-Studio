import axios, { AxiosInstance } from 'axios';
import * as vscode from 'vscode';

export class MockApiClient {
    private client: AxiosInstance;

    constructor() {
        const config = vscode.workspace.getConfiguration('mockApiStudio');
        const apiUrl = config.get<string>('apiUrl') || 'http://localhost:3000';
        const apiToken = config.get<string>('apiToken') || '';

        this.client = axios.create({
            baseURL: apiUrl,
            headers: {
                'Authorization': apiToken ? `Bearer ${apiToken}` : '',
                'Content-Type': 'application/json'
            }
        });
    }

    getBaseUrl(): string {
        return this.client.defaults.baseURL || 'http://localhost:3000';
    }

    async listApis(): Promise<any[]> {
        const response = await this.client.get('/admin/api-definitions');
        return response.data;
    }

    async createEndpoint(apiId: string, data: any): Promise<any> {
        const response = await this.client.post(`/admin/api-definitions/${apiId}/endpoints`, data);
        return response.data;
    }

    async testEndpoint(url: string, method: string): Promise<any> {
        const response = await this.client.request({ url, method });
        return response.data;
    }

    async getLogs(limit: number = 50): Promise<any[]> {
        const response = await this.client.get(`/admin/analytics/requests?limit=${limit}`);
        return response.data;
    }
}

