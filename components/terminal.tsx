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

	return (
		<div className='w-full max-w-3xl mx-auto h-[600px] rounded-lg terminal-window terminal-text text-green-400'>
			<div className='flex items-center justify-between px-4 py-2 terminal-header'>
				<div className='flex space-x-2'>
					<div className='w-3 h-3 rounded-full bg-red-500' />
					<div className='w-3 h-3 rounded-full bg-yellow-500' />
					<div className='w-3 h-3 rounded-full bg-green-500' />
				</div>
				<div className='text-sm opacity-50'>terminal</div>
			</div>
			<ScrollArea className='h-[520px] p-4 terminal-scrollbar terminal-body' ref={scrollAreaRef}>
				{messages.map((message, i) => (
					<div
						key={i}
						className={cn('mb-2 whitespace-pre-wrap', {
							'text-blue-400': message.type === 'user',
							'text-yellow-400': message.type === 'assistant',
						})}>
						<span className='mr-2 opacity-70'>{message.type === 'user' ? '>' : '$'}</span>
						{message.content}
						{message.type === 'user' && <span className='cursor' />}
					</div>
				))}
				{status === 'streaming' && (
					<div className='mb-2 whitespace-pre-wrap text-green-400'>
						<span className='mr-2 opacity-70'>$</span>
						Thinking{loadingDots}
					</div>
				)}
			</ScrollArea>
			<form
				onSubmit={(e) => {
					e.preventDefault()
					handleSubmit(e)
				}}
				className='px-4 py-2 border-t border-white/20 bg-black/40'>
				<div className='flex items-center'>
					<span className='mr-2 opacity-70 text-green-400'>{'>'}</span>
					<textarea
						ref={inputRef}
						value={input}
						onChange={handleInputChange}
						onKeyDown={(e) => {
							if (e.key === 'Enter' && !e.shiftKey) {
								e.preventDefault()
								handleSubmit(e)
							}
						}}
						className='flex-1 bg-transparent border-none outline-none resize-none text-green-400 placeholder-green-700 text-sm leading-normal'
						placeholder='Type a command or message...'
						rows={1}
						disabled={status === 'streaming'}
					/>
					<button type='submit' className={cn('ml-2 text-xs text-green-400/70 hover:text-green-400 transition-colors', status === 'streaming' && 'opacity-50 cursor-not-allowed')} disabled={status === 'streaming'}>
						[send]
					</button>
				</div>
			</form>
		</div>
	)
}
