import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GenerateOptions, IAIProvider } from './base.provider';

@Injectable()
export class AnthropicProvider implements IAIProvider {
  constructor(private readonly config: ConfigService) {}

  async generateText(prompt: string, options?: GenerateOptions): Promise<string> {
    const apiKey = this.config.get<string>('ANTHROPIC_API_KEY');
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not configured');
    }

    const model = this.config.get<string>('AI_MODEL', 'claude-3-5-haiku-20241022');
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        max_tokens: options?.maxTokens ?? 4096,
        temperature: options?.temperature ?? 0.3,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`);
    }

    const data = (await response.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };
    return data.content?.find((c) => c.type === 'text')?.text ?? '';
  }

  async generateJSON<T>(prompt: string): Promise<T> {
    const text = await this.generateText(
      `${prompt}\n\nRespond with valid JSON only, no markdown fences.`,
    );
    return JSON.parse(text) as T;
  }
}
