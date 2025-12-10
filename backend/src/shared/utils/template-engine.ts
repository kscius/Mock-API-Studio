// backend/src/shared/utils/template-engine.ts
import Handlebars from 'handlebars';

Handlebars.registerHelper('json', function (context) {
  return JSON.stringify(context);
});

export interface TemplateContext {
  params: Record<string, any>;
  query: Record<string, any>;
  body: any;
  headers: Record<string, any>;
}

/**
 * Renderiza un valor con Handlebars si es string, si es objeto/array
 * hace un deep-walk y renderiza todos los strings internos.
 */
export function renderWithTemplate<T = any>(
  value: T,
  context: TemplateContext,
): T {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === 'string') {
    const template = Handlebars.compile(value);
    return template(context) as unknown as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => renderWithTemplate(item, context)) as unknown as T;
  }

  if (typeof value === 'object') {
    const result: any = {};
    for (const [k, v] of Object.entries(value)) {
      result[k] = renderWithTemplate(v, context);
    }
    return result;
  }

  // number, boolean, etc
  return value;
}

