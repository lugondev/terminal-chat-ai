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
		// Scroll to bottom on new message
		if (scrollAreaRef.current) {
			scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
		}
	}, [messages, chatMessages])

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
  chat         Chat with AI assistant
  clear        Clear the terminal
  date         Show current date and time
  echo         Print a line of text
  help         Show this help message
  projects     List featured projects
  social       Display social media links
  welcome      Display welcome message`
				break
			case 'clear':
				setMessages([])
				setInput('')
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
			case 'chat':
				const chatMessage = input.substring(5).trim()
				if (!chatMessage) {
					response = 'Please provide a message to chat with the AI assistant'
				} else {
					// Show loading state
					setMessages((prev) => [...prev, {type: 'system', content: `Thinking${loadingDots}`}])
					// Submit chat message
					handleChatInputChange({target: {value: chatMessage}} as any)
					const form = document.createElement('form')
					const submitEvent = new Event('submit', {cancelable: true})
					await handleChatSubmit(submitEvent)
					// Remove loading message
					setMessages((prev) => prev.slice(0, -1))
					return // Skip adding response since it's handled by the streaming effect
				}
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
					setMessages((prev) => [...prev, {type: 'system', content: `Thinking${loadingDots}`}])
					handleChatInputChange({target: {value: input}} as any)
					const form = document.createElement('form')
					const submitEvent = new Event('submit', {cancelable: true})
					await handleChatSubmit(submitEvent)
					setMessages((prev) => prev.slice(0, -1))
					return // Skip adding response since it's handled by the streaming effect
				}
		}

		// Add system response
		setMessages((prev) => [...prev, {type: 'system', content: response}])

		setInput('')
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
			</ScrollArea>
			<form
				onSubmit={(e) => {
					e.preventDefault()
					handleSubmit(e)
				}}
				className='p-4 border-t border-white/10'>
				<div className='flex items-center'>
					<span className='mr-2 text-green-400 opacity-70'>{'>'}</span>
					<textarea
						ref={inputRef}
						value={input}
						onChange={(e) => setInput(e.target.value)}
						onKeyDown={async (e) => {
							if (e.key === 'Enter' && !e.shiftKey) {
								e.preventDefault()
								await handleSubmit(e)
							}
						}}
						className='flex-1 bg-transparent border-none outline-none resize-none text-green-400 placeholder-green-800'
						placeholder='Type a command...'
						rows={1}
						disabled={status === 'streaming'}
					/>
					<button type='submit' className={cn('ml-2 px-3 py-1 rounded bg-green-800 text-green-100 hover:bg-green-700 transition-colors', status === 'streaming' && 'opacity-50 cursor-not-allowed')} disabled={status === 'streaming'}>
						Send
					</button>
				</div>
			</form>
		</div>
	)
}
