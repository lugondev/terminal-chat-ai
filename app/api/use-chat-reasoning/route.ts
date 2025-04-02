import { anthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';
import type { AnthropicProviderOptions } from '@ai-sdk/anthropic';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  console.log(JSON.stringify(messages, null, 2));

  const result = streamText({
    model: anthropic('claude-3-opus-20240229'),
    messages,
    providerOptions: {
      anthropic: {
        thinking: { type: 'enabled', budgetTokens: 12000 },
      } satisfies AnthropicProviderOptions,
    },
  });

  return result.toDataStreamResponse({
    sendReasoning: true,
  });
}
