'use client'

import React, {useEffect, useRef, useState} from 'react'
import {ScrollArea} from './ui/scroll-area'
import {cn} from './ui/lib/utils'
import {useChat} from '@ai-sdk/react'

interface Message {
	type: 'user' | 'system' | 'assistant'
	content: string
}

export function Terminal() {
	const [input, setInput] = useState('')
	const [loadingDots, setLoadingDots] = useState('')
	const {
		messages: chatMessages,
		input: chatInput,
		handleInputChange: handleChatInputChange,
		handleSubmit: handleChatSubmit,
		status,
	} = useChat({
		api: '/api/terminal-chat',
		id: 'terminal-chat',
		initialInput: '',
		initialMessages: [],
	})
	const [messages, setMessages] = useState<Message[]>([
		{
			type: 'system',
			content: 'Welcome to the terminal! Type "help" for available commands.',
		},
	])

	// Loading dots animation
	useEffect(() => {
		let interval: NodeJS.Timeout
		if (status === 'streaming') {
			interval = setInterval(() => {
				setLoadingDots((prev) => {
					if (prev === '...') return ''
					return prev + '.'
				})
			}, 500)
		} else {
			setLoadingDots('')
		}
		return () => clearInterval(interval)
	}, [status])
	const inputRef = useRef<HTMLTextAreaElement>(null)
	const scrollAreaRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		// Focus input on mount
		inputRef.current?.focus()
	}, [])

	useEffect(() => {
		// Scroll to bottom on new message or streaming update
		const scrollViewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]')
		if (scrollViewport) {
			requestAnimationFrame(() => {
				scrollViewport.scrollTop = scrollViewport.scrollHeight
			})
		}
	}, [messages, chatMessages, status]) // Added status to dependencies to ensure scroll during streaming updates

	// Focus input when assistant finishes responding
	useEffect(() => {
		if (status !== 'streaming') {
			inputRef.current?.focus()
		}
	}, [status])

	// Handle streaming chat responses
	useEffect(() => {
		if (chatMessages.length > 0) {
			const lastMessage = chatMessages[chatMessages.length - 1]
			if (lastMessage.role === 'assistant') {
				setMessages((prev) => {
					const lastLocalMessage = prev[prev.length - 1]
					if (lastLocalMessage?.type === 'assistant') {
						return [...prev.slice(0, -1), {type: 'assistant', content: lastMessage.content}]
					}
					return [...prev, {type: 'assistant', content: lastMessage.content}]
				})
			}
		}
	}, [chatMessages])

	// Update local input when chat input changes
	useEffect(() => {
		if (chatInput !== input) {
			setInput(chatInput)
		}
	}, [chatInput])

	const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		const value = e.target.value
		setInput(value)
		// Keep chat input in sync when user is typing
		if (value !== chatInput) {
			handleChatInputChange({target: {value}} as any)
		}
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!input.trim()) return

		// Add user message
		setMessages((prev) => [...prev, {type: 'user', content: input}])

		// Process command
		const command = input.toLowerCase().trim()
		let response = ''

		switch (command) {
			case 'help':
				response = `Available commands:

  about        About this terminal
  clear        Clear the terminal
  date         Show current date and time
  echo         Print a line of text
  help         Show this help message
  projects     List featured projects
  social       Display social media links
  welcome      Display welcome message

Type any message to chat with the AI assistant.`
				break
			case 'clear':
				setMessages([])
				setInput('')
				inputRef.current?.focus() // Focus after clearing
				return
			case 'about':
				response = 'A terminal-style chat interface built with Next.js and shadcn/ui, inspired by https://terminal.satnaing.dev/'
				break
			case 'date':
				response = new Date().toLocaleString()
				break
			case 'echo':
				response = input.substring(5) || 'Please provide text to echo'
				break
			case 'projects':
				response = `Featured Projects:

  1. Terminal Chat UI
     A modern terminal-style interface built with React
     Tech: Next.js, TypeScript, Tailwind CSS

  2. Project Two
     Description of project two
     Tech: List of technologies

  Type 'project <number>' for more details`
				break
			case 'social':
				response = `Connect with me:

  GitHub:   https://github.com/yourusername
  Twitter:  https://twitter.com/yourusername
  LinkedIn: https://linkedin.com/in/yourusername`
				break
			case 'welcome':
				response = `Welcome to my terminal interface!
				
Type 'help' to see available commands.
Type 'about' to learn more about this project.
Type 'projects' to see my featured work.

You can type any message to chat with the AI assistant!`
				break
			default:
				if (command.startsWith('project ')) {
					const num = command.split(' ')[1]
					switch (num) {
						case '1':
							response = `Terminal Chat UI

A modern terminal-style interface built with React that simulates
a command-line experience in the browser. Features include:

- Custom command processing
- Real-time output
- Syntax highlighting
- Command history
- Responsive design

Tech Stack:
- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui components`
							break
						case '2':
							response = 'Project two details coming soon...'
							break
						default:
							response = `Project ${num} not found. Type 'projects' to see available projects.`
					}
				} else {
					// If not a recognized command, treat as chat message
					const message = input
					setInput('') // Clear input immediately

					// Sync with chat input
					handleChatInputChange({target: {value: ''}} as any)

					// Remove any previous "Thinking..." messages
					setMessages((prev) => prev.filter((msg) => msg.content !== 'Thinking...'))

					// Submit the chat form with the captured message
					setTimeout(() => {
						handleChatSubmit({
							preventDefault: () => {},
							type: 'submit',
							data: {input: message},
						} as any)
					}, 0)

					// Add a temporary thinking message until the real response comes
					setMessages((prev) => [...prev, {type: 'assistant', content: 'Thinking...'}])
					inputRef.current?.focus() // Focus after initiating chat
					return // Response will be handled by the streaming effect
				}
		}

		// Add system response (for local commands)
		setMessages((prev) => [...prev, {type: 'system', content: response}])

		setInput('') // Clear input for local commands
		inputRef.current?.focus() // Focus after local command response
	}

	// Determine text class based on message type and content
	const getMessageClass = (message: Message) => {
		if (message.type === 'system') {
			if (message.content.startsWith('Welcome')) {
				return 'terminal-text-welcome'
			} else if (message.content.startsWith('Available commands:')) {
				return 'terminal-text-help'
			} else if (message.content.startsWith('Connect with me:')) {
				return 'terminal-text-social'
			} else if (message.content.startsWith('Featured Projects:')) {
				// Assuming primary (pink) is defined for projects
				return 'text-pink-400' // Or use a specific class like terminal-text-projects if defined
			}
			return 'terminal-text-command-output' // Default for other system messages/command output
		} else if (message.type === 'user') {
			return 'terminal-text-input' // Use input color for the user's typed message
		} else if (message.type === 'assistant') {
			return 'terminal-text-assistant'
		}
		return 'terminal-text-system' // Fallback
	}

	return (
		<div className='w-full max-w-3xl mx-auto h-[600px] rounded-lg terminal-window terminal-text terminal-bg'>
			{' '}
			{/* Added terminal-bg */}
			<div className='flex items-center justify-between px-4 py-2 terminal-header'>
				<div className='flex space-x-2'>
					{/* Use Dracula comment color for dots for better theme consistency */}
					<div className='w-3 h-3 rounded-full bg-red-500' /> {/* Keep standard red */}
					<div className='w-3 h-3 rounded-full bg-yellow-500' /> {/* Keep standard yellow */}
					<div className='w-3 h-3 rounded-full bg-green-500' /> {/* Keep standard green */}
				</div>
				<div className='text-sm text-foreground opacity-50'>terminal</div> {/* Use foreground color */}
			</div>
			<ScrollArea className='h-[520px] p-4 terminal-scrollbar terminal-body' ref={scrollAreaRef}>
				{/* Welcome message - styled specifically if needed */}
				{messages
					.filter((msg) => msg.type === 'system' && msg.content.startsWith('Welcome'))
					.map((message, i) => (
						<div key={`welcome-${i}`} className={cn('mb-2 whitespace-pre-wrap', getMessageClass(message))}>
							<span className='terminal-text-prompt text-syntax-purple'>$</span> {/* Purple prompt for welcome */}
							{message.content}
						</div>
					))}

				{/* Rest of the messages */}
				{messages
					.filter((msg) => !(msg.type === 'system' && msg.content.startsWith('Welcome')))
					.map((message, i) => (
						<div key={i} className={cn('mb-2 whitespace-pre-wrap', getMessageClass(message))}>
							<span
								className={cn('terminal-text-prompt', {
									'text-syntax-green': message.type === 'user', // Green prompt for user
									'text-syntax-cyan': message.type === 'assistant', // Cyan prompt for assistant
									'text-syntax-purple': message.type === 'system' && message.content.startsWith('Welcome'), // Purple handled above but keep logic
									'text-foreground': message.type === 'system' && !message.content.startsWith('Welcome'), // Default prompt for system
								})}>
								{message.type === 'user' ? '>' : '$'}
							</span>
							{message.content}
							{/* Cursor only shown immediately after user input line */}
							{message.type === 'user' && i === messages.length - 1 && status !== 'streaming' && <span className='cursor' />}
						</div>
					))}
				{status === 'streaming' && (
					<div className='mb-2 whitespace-pre-wrap terminal-text-assistant'>
						{' '}
						{/* Use assistant color for thinking */}
						<span className='terminal-text-prompt text-syntax-cyan'>$</span> {/* Cyan prompt */}
						Thinking{loadingDots} {/* Content */}
					</div>
				)}
				{/* Input area with blinking cursor when focused and not streaming */}
				{status !== 'streaming' && (
					<div className='flex items-center'>
						<span className='terminal-text-prompt text-syntax-green'>{'>'}</span>
						<span className='terminal-text-input'>{input}</span>
						<span className='cursor' />
					</div>
				)}
			</ScrollArea>
			{/* Keep the form logic, but hide the actual textarea visually */}
			<form
				onSubmit={(e) => {
					e.preventDefault()
					handleSubmit(e)
				}}
				className='px-4 py-2 border-t border-border/50 bg-background/80'>
				{' '}
				{/* Use theme colors */}
				<div className='flex items-center relative'>
					{' '}
					{/* Make relative for textarea positioning */}
					{/* Visually hidden textarea that captures input */}
					<textarea
						ref={inputRef}
						value={input}
						onChange={handleInputChange}
						onKeyDown={(e) => {
							if (e.key === 'Enter' && !e.shiftKey) {
								e.preventDefault()
								handleSubmit(e)
							}
							// Handle other keys like Backspace, Arrow keys etc. if needed for a more robust fake terminal
						}}
						className='absolute top-0 left-0 w-full h-full opacity-0 cursor-text resize-none' // Hide it but keep functional
						placeholder='Type a command or message...'
						rows={1}
						disabled={status === 'streaming'}
						autoFocus
						spellCheck='false'
					/>
					{/* Display area mimicking the input - now handled within ScrollArea */}
					{/* Submit button can be removed or styled differently if desired */}
					{/* <button type='submit' className={cn('ml-2 text-xs text-foreground/70 hover:text-foreground transition-colors', status === 'streaming' && 'opacity-50 cursor-not-allowed')} disabled={status === 'streaming'}>
            [send]
          </button> */}
				</div>
			</form>
		</div>
	)
}
