import Groq from 'groq-sdk';

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export async function callGroq(
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  options: {
    jsonMode?: boolean;
    maxTokens?: number;
    temperature?: number;
  } = {}
): Promise<LLMResponse> {
  const { jsonMode = false, maxTokens = 2048, temperature = 0.3 } = options;
  const apiKey = process.env.GROQ_API_KEY || 'dummy_key_for_build';

  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages,
          max_tokens: maxTokens,
          temperature,
          ...(jsonMode && { response_format: { type: 'json_object' } }),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content || '';

      return {
        content,
        usage: data.usage ? {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
        } : undefined,
      };
    } catch (error: any) {
      lastError = error;
      console.error(`Groq fetch attempt ${attempt + 1} failed:`, error.message);

      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
      }
    }
  }

  throw new Error(`Groq API failed after ${maxRetries} attempts: ${lastError?.message}`);
}
