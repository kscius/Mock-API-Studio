// backend/src/shared/utils/path-matcher.ts
import { match } from 'path-to-regexp';

export interface PathMatch {
  params: Record<string, string>;
}

export class PathMatcher {
  /**
   * Match a request path against a path template (e.g., /users/:id)
   * Returns params if matched, null if not matched
   */
  static match(template: string, requestPath: string): PathMatch | null {
    const matcher = match(template);
    const result = matcher(requestPath);

    if (!result) {
      return null;
    }

    const params: Record<string, string> = {};
    for (const [key, value] of Object.entries(result.params)) {
      if (value !== undefined) {
        params[key] = Array.isArray(value) ? value[0] : value;
      }
    }

    return { params };
  }

  /**
   * Normalize path by removing trailing slashes and ensuring leading slash
   */
  static normalize(path: string): string {
    let normalized = path.trim();
    
    // Ensure leading slash
    if (!normalized.startsWith('/')) {
      normalized = '/' + normalized;
    }
    
    // Remove trailing slash (except for root)
    if (normalized.length > 1 && normalized.endsWith('/')) {
      normalized = normalized.slice(0, -1);
    }

    return normalized;
  }
}

