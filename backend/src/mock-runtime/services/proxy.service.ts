import { Injectable, Logger } from '@nestjs/common';
import { ApiEndpoint } from '@prisma/client';

interface ProxyResponse {
  status: number;
  headers: Record<string, string>;
  body: any;
  isProxied: true;
}

@Injectable()
export class ProxyService {
  private readonly logger = new Logger(ProxyService.name);

  async forwardRequest(
    endpoint: ApiEndpoint,
    requestData: {
      method: string;
      path: string;
      headers: Record<string, string>;
      body?: any;
      query?: Record<string, string>;
    },
  ): Promise<ProxyResponse> {
    const { proxyTarget, proxyHeaders, proxyTimeout } = endpoint;

    if (!proxyTarget) {
      throw new Error('Proxy target URL is not configured');
    }

    // Build target URL
    const targetUrl = this.buildTargetUrl(proxyTarget, requestData.path, requestData.query);

    // Merge headers
    const headers = this.mergeHeaders(requestData.headers, proxyHeaders as any);

    // Prepare request options
    const options: RequestInit = {
      method: requestData.method,
      headers,
      signal: AbortSignal.timeout(proxyTimeout || 5000),
    };

    // Add body for non-GET requests
    if (requestData.body && requestData.method !== 'GET') {
      options.body = JSON.stringify(requestData.body);
    }

    try {
      this.logger.log(`Proxying ${requestData.method} to ${targetUrl}`);

      const response = await fetch(targetUrl, options);

      // Read response body
      const contentType = response.headers.get('content-type');
      let body;

      if (contentType?.includes('application/json')) {
        try {
          body = await response.json();
        } catch {
          body = await response.text();
        }
      } else {
        body = await response.text();
      }

      // Extract response headers
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      this.logger.log(`Proxy response: ${response.status}`);

      return {
        status: response.status,
        headers: responseHeaders,
        body,
        isProxied: true,
      };
    } catch (error: any) {
      this.logger.error(`Proxy request failed: ${error.message}`);
      
      if (error.name === 'AbortError') {
        throw new Error('Proxy request timed out');
      }

      throw new Error(`Proxy request failed: ${error.message}`);
    }
  }

  private buildTargetUrl(
    baseUrl: string,
    path: string,
    query?: Record<string, string>,
  ): string {
    // Remove trailing slash from base URL
    const cleanBaseUrl = baseUrl.replace(/\/$/, '');

    // Build URL with query params
    const url = new URL(`${cleanBaseUrl}${path}`);

    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    return url.toString();
  }

  private mergeHeaders(
    requestHeaders: Record<string, string>,
    proxyHeadersConfig: {
      add?: Record<string, string>;
      remove?: string[];
      override?: Record<string, string>;
    } | null,
  ): Record<string, string> {
    const headers = { ...requestHeaders };

    if (!proxyHeadersConfig) {
      return headers;
    }

    // Remove specified headers
    if (proxyHeadersConfig.remove) {
      proxyHeadersConfig.remove.forEach((key) => {
        delete headers[key.toLowerCase()];
      });
    }

    // Add new headers
    if (proxyHeadersConfig.add) {
      Object.entries(proxyHeadersConfig.add).forEach(([key, value]) => {
        if (!headers[key.toLowerCase()]) {
          headers[key] = value;
        }
      });
    }

    // Override headers
    if (proxyHeadersConfig.override) {
      Object.entries(proxyHeadersConfig.override).forEach(([key, value]) => {
        headers[key] = value;
      });
    }

    // Remove headers that might cause issues
    delete headers['host'];
    delete headers['connection'];

    return headers;
  }
}

