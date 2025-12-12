// cli/src/config.spec.ts
import { config, getApiUrl, getToken, setToken, getApiKey, setApiKey, getCurrentWorkspace, setCurrentWorkspace, clearConfig } from './config';

describe('Config', () => {
  beforeEach(() => {
    clearConfig();
  });

  afterAll(() => {
    clearConfig();
  });

  it('should have default API URL', () => {
    expect(getApiUrl()).toBe('http://localhost:3000');
  });

  it('should store and retrieve token', () => {
    const testToken = 'test-jwt-token-123';
    setToken(testToken);
    expect(getToken()).toBe(testToken);
  });

  it('should store and retrieve API key', () => {
    const testKey = 'test-api-key-456';
    setApiKey(testKey);
    expect(getApiKey()).toBe(testKey);
  });

  it('should store and retrieve current workspace', () => {
    const testWorkspace = 'workspace-id-789';
    setCurrentWorkspace(testWorkspace);
    expect(getCurrentWorkspace()).toBe(testWorkspace);
  });

  it('should clear all config', () => {
    setToken('token');
    setApiKey('key');
    setCurrentWorkspace('workspace');
    
    clearConfig();
    
    expect(getToken()).toBeUndefined();
    expect(getApiKey()).toBeUndefined();
    expect(getCurrentWorkspace()).toBeUndefined();
    // API URL should have default value
    expect(getApiUrl()).toBe('http://localhost:3000');
  });

  it('should prefer token over API key in auth header', () => {
    const { getAuthHeader } = require('./config');
    
    setToken('test-token');
    setApiKey('test-key');
    
    const header = getAuthHeader();
    expect(header).toHaveProperty('Authorization', 'Bearer test-token');
    expect(header).not.toHaveProperty('X-API-Key');
  });

  it('should use API key if no token', () => {
    const { getAuthHeader } = require('./config');
    
    setApiKey('test-key');
    
    const header = getAuthHeader();
    expect(header).toHaveProperty('X-API-Key', 'test-key');
    expect(header).not.toHaveProperty('Authorization');
  });

  it('should return empty header if no auth', () => {
    const { getAuthHeader } = require('./config');
    
    const header = getAuthHeader();
    expect(header).toEqual({});
  });
});

