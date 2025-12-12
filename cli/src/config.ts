// cli/src/config.ts
import Conf from 'conf';
import path from 'path';
import os from 'os';

export interface Config {
  apiUrl?: string;
  token?: string;
  apiKey?: string;
  currentWorkspace?: string;
}

const configDir = path.join(os.homedir(), '.mock-api');

export const config = new Conf<Config>({
  projectName: 'mock-api-studio',
  cwd: configDir,
  defaults: {
    apiUrl: 'http://localhost:3000',
  },
});

export function getApiUrl(): string {
  return config.get('apiUrl') || 'http://localhost:3000';
}

export function getToken(): string | undefined {
  return config.get('token');
}

export function setToken(token: string): void {
  config.set('token', token);
}

export function getApiKey(): string | undefined {
  return config.get('apiKey');
}

export function setApiKey(key: string): void {
  config.set('apiKey', key);
}

export function getCurrentWorkspace(): string | undefined {
  return config.get('currentWorkspace');
}

export function setCurrentWorkspace(workspaceId: string): void {
  config.set('currentWorkspace', workspaceId);
}

export function clearConfig(): void {
  config.clear();
}

export function getAuthHeader(): Record<string, string> {
  const token = getToken();
  const apiKey = getApiKey();

  if (token) {
    return { Authorization: `Bearer ${token}` };
  }

  if (apiKey) {
    return { 'X-API-Key': apiKey };
  }

  return {};
}

