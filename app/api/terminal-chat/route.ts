import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'

export const maxDuration = 30

export async function POST(req: Request) {
	const { messages } = await req.json()

	const result = streamText({
		model: openai('gpt-4o-mini'),
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

	return result.toDataStreamResponse()
}
