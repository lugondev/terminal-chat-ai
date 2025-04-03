import './globals.css'
import {Inter} from 'next/font/google'
import BlinkingPointsBackground from '@/components/BlinkingPointsBackground' // Import the component

const inter = Inter({subsets: ['latin']})

export const metadata = {
	title: 'Terminal Chatbot',
	description: 'A chatbot application built with Next.js and the OpenAI API.',
}

export default function RootLayout({children}: {children: React.ReactNode}) {
	return (
		<html lang='en'>
			<body className={inter.className}>
				<BlinkingPointsBackground /> {/* Add the background component */}
				{children}
			</body>
		</html>
	)
}
