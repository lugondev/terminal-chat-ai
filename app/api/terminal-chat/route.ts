import { openai, createOpenAI } from '@ai-sdk/openai' // Correct import for createOpenAI
import { streamText } from 'ai' // Remove StreamingTextResponse import

export const maxDuration = 30

export async function POST(req: Request) {
	// Extract both messages and the optional apiKey from the request body
	const { messages, apiKey } = await req.json()

	// Conditionally create an OpenAI provider instance if an API key is provided from the client
	const openaiProvider = apiKey
		? createOpenAI({
			apiKey: apiKey, // Use the key from the request body
		})
		: undefined // If no key from client, use the default provider (which uses env vars)

	// Select the model. If using a custom provider, call the model function on it.
	// Otherwise, call the model function directly (which uses the default provider).
	const model = openaiProvider ? openaiProvider('gpt-4o-mini') : createOpenAI()('gpt-4o-mini')

	const result = await streamText({
		model: model, // Pass the correctly configured model
		messages: [
			{
				role: 'system',
				content: 'You are a helpful terminal assistant. Keep responses concise and use plain text formatting suitable for terminal output. Avoid using markdown or other rich formatting.'
			},
			...messages
		],
		async onFinish({ text, usage }) {
			// Optional: implement logging or message storage
		},
	})

	// Use the standard method to convert the stream result to a Next.js response
	return result.toDataStreamResponse()
}
