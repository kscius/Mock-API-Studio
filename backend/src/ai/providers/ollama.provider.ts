import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GenerateOptions, IAIProvider } from './base.provider';

@Injectable()
export class OllamaProvider implements IAIProvider {
  constructor(private readonly config: ConfigService) {}

  async generateText(prompt: string, options?: GenerateOptions): Promise<string> {
    const baseUrl = this.config.get<string>(
      'OLLAMA_BASE_URL',
      'http://localhost:11434',
    );
    const model = this.config.get<string>('AI_MODEL', 'llama3.2');

    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        stream: false,
        messages: [{ role: 'user', content: prompt }],
        options: {
          temperature: options?.temperature ?? 0.3,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = (await response.json()) as {
      message?: { content?: string };
    };
    return data.message?.content ?? '';
  }

  async generateJSON<T>(prompt: string): Promise<T> {
    const text = await this.generateText(
      `${prompt}\n\nRespond with valid JSON only, no markdown fences.`,
    );
    return JSON.parse(text) as T;
  }
}
