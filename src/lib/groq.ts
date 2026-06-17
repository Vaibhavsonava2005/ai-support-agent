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
  const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || 'dummy_key_for_build',
  });

  const { jsonMode = false, maxTokens = 2048, temperature = 0.3 } = options;

  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages,
        max_tokens: maxTokens,
        temperature,
        ...(jsonMode && { response_format: { type: 'json_object' } }),
      });

      const content = completion.choices[0]?.message?.content || '';

      return {
        content,
        usage: completion.usage
          ? {
              promptTokens: completion.usage.prompt_tokens,
              completionTokens: completion.usage.completion_tokens,
              totalTokens: completion.usage.total_tokens,
            }
          : undefined,
      };
    } catch (error: any) {
      lastError = error;
      console.error(`Groq API attempt ${attempt + 1} failed:`, error.message);

      // Wait before retry (exponential backoff)
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
      }
    }
  }

  throw new Error(`Groq API failed after ${maxRetries} attempts: ${lastError?.message}`);
}
