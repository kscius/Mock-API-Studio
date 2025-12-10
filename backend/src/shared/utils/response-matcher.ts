// backend/src/shared/utils/response-matcher.ts

export interface ResponseMatchRule {
  query?: Record<string, string | number | boolean>;
  headers?: Record<string, string>;
  bodyEquals?: any;
}

export interface RuntimeRequestContext {
  query: Record<string, any>;
  headers: Record<string, string>;
  body: any;
}

export function responseMatches(
  rule: ResponseMatchRule | undefined,
  ctx: RuntimeRequestContext,
): boolean {
  if (!rule) return false;

  // Match de query params (igualdad simple)
  if (rule.query) {
    for (const [key, expected] of Object.entries(rule.query)) {
      const actual = ctx.query?.[key];
      if (actual === undefined) return false;
      if (String(actual) !== String(expected)) return false;
    }
  }

  // Match de headers (case-insensitive)
  if (rule.headers) {
    const normHeaders: Record<string, string> = {};
    for (const [k, v] of Object.entries(ctx.headers || {})) {
      normHeaders[k.toLowerCase()] = String(v);
    }

    for (const [key, expected] of Object.entries(rule.headers)) {
      const actual = normHeaders[key.toLowerCase()];
      if (actual === undefined) return false;
      if (actual !== expected) return false;
    }
  }

  // Match de bodyEquals (deep-ish compare muy simple)
  if (rule.bodyEquals !== undefined) {
    const expected = JSON.stringify(rule.bodyEquals);
    const actual = JSON.stringify(ctx.body ?? null);
    if (expected !== actual) return false;
  }

  return true;
}

