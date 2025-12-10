// backend/src/shared/utils/path-matcher.ts
import { pathToRegexp, Key } from 'path-to-regexp';

export interface PathMatch {
  params: Record<string, string>;
}

export class PathMatcher {
  /**
   * Match a request path against a path template (e.g., /users/:id)
   * Returns params if matched, null if not matched
   */
  static match(template: string, requestPath: string): PathMatch | null {
    const keys: Key[] = [];
    const regexp = pathToRegexp(template, keys);
    const match = regexp.exec(requestPath);

    if (!match) {
      return null;
    }

    const params: Record<string, string> = {};
    keys.forEach((key, index) => {
      params[key.name] = match[index + 1];
    });

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

