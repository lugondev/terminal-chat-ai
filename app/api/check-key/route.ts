import { NextResponse } from 'next/server'

export const runtime = 'edge' // Optional: Use edge runtime for faster response

export async function GET() {
	try {
		const hasApiKey = !!process.env.OPENAI_API_KEY
		return NextResponse.json({ hasApiKey })
	} catch (error) {
		console.error('[Check Key API Error]', error)
		// In case of error, assume key is not available server-side
		return NextResponse.json({ hasApiKey: false }, { status: 500 })
	}
}
