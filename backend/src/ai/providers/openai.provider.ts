import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IAIProvider, GenerateOptions } from './base.provider';

@Injectable()
export class OpenAiProvider implements IAIProvider {
  constructor(private readonly config: ConfigService) {}

  async generateText(prompt: string, _options?: GenerateOptions): Promise<string> {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
      }),
    });
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }
    const data = (await response.json()) as { choices: { message: { content: string } }[] };
    return data.choices[0]?.message?.content ?? '';
  }

  async generateJSON<T>(prompt: string): Promise<T> {
    const text = await this.generateText(
      `${prompt}\n\nRespond with valid JSON only, no markdown fences.`,
    );
    return JSON.parse(text) as T;
  }
}
