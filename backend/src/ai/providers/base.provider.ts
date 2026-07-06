export interface GenerateOptions {
  maxTokens?: number;
  temperature?: number;
}

export interface IAIProvider {
  generateText(prompt: string, options?: GenerateOptions): Promise<string>;
  generateJSON<T = unknown>(prompt: string, schema?: Record<string, unknown>): Promise<T>;
}
