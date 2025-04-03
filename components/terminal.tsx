'use client'

import React, {useEffect, useRef, useState, useCallback} from 'react' // Added useCallback
import {ScrollArea} from './ui/scroll-area'
import {cn} from './ui/lib/utils'
import {useChat} from '@ai-sdk/react'

const LOCAL_STORAGE_KEY = 'openai_api_key' // Added constant

interface Message {
	type: 'user' | 'system' | 'assistant'
	content: string
}

export function Terminal() {
	const [input, setInput] = useState('')
	const [loadingDots, setLoadingDots] = useState('')
	// --- Added API Key State ---
	const [apiKey, setApiKey] = useState<string | null>(null)
	const [isApiKeyRequired, setIsApiKeyRequired] = useState(false)
	const [apiKeyInput, setApiKeyInput] = useState('') // Separate state for the API key input field
	const [apiKeyError, setApiKeyError] = useState<string | null>(null)
	const [checkingBackendKey, setCheckingBackendKey] = useState(true) // State to track initial check
	// --- End API Key State ---

	// --- API Key Handling ---

	// Check backend for API key availability on mount
	useEffect(() => {
		const checkBackendApiKey = async () => {
			setCheckingBackendKey(true)
			try {
				const response = await fetch('/api/check-key')
				if (!response.ok) {
					throw new Error('Failed to check backend API key status')
				}
				const data = await response.json()

				if (data.hasApiKey) {
					// Backend has the key, frontend doesn't need one
					setApiKey(null) // Ensure frontend key state is null
					setIsApiKeyRequired(false)
					localStorage.removeItem(LOCAL_STORAGE_KEY) // Clear any potentially stale local key
					console.log('Backend has API key. Using server-side key.')
				} else {
					// Backend does NOT have the key, check local storage
					console.log('Backend does not have API key. Checking local storage...')
					const storedKey = localStorage.getItem(LOCAL_STORAGE_KEY)
					if (storedKey) {
						setApiKey(storedKey)
						setIsApiKeyRequired(false)
						console.log('Found API key in local storage.')
					} else {
						// No key locally either, require user input
						setApiKey(null)
						setIsApiKeyRequired(true)
						setMessages((prev) => [...prev, {type: 'system', content: 'OpenAI API Key not found. Please enter your key:'}])
						console.log('No API key in local storage. Prompting user.')
					}
				}
			} catch (error) {
				console.error('Error checking backend API key:', error)
				// Fallback: Assume backend doesn't have key, check local
				const storedKey = localStorage.getItem(LOCAL_STORAGE_KEY)
				if (storedKey) {
					setApiKey(storedKey)
					setIsApiKeyRequired(false)
				} else {
					setIsApiKeyRequired(true) // Safer to require if check failed
					setMessages((prev) => [...prev, {type: 'system', content: 'Error checking server key status. Please enter your OpenAI API Key:'}])
				}
			} finally {
				setCheckingBackendKey(false)
			}
		}

		checkBackendApiKey()
	}, []) // Run only on mount

	const saveApiKey = useCallback(() => {
		if (apiKeyInput.trim()) {
			localStorage.setItem(LOCAL_STORAGE_KEY, apiKeyInput.trim())
			setApiKey(apiKeyInput.trim())
			setIsApiKeyRequired(false)
			setApiKeyError(null)
			setApiKeyInput('') // Clear the input field
			// Add a message indicating success
			setMessages((prev) => [...prev, {type: 'system', content: 'API Key saved successfully.'}])
			setTimeout(() => inputRef.current?.focus(), 0) // Refocus main input
		} else {
			setApiKeyError('Please enter a valid API Key.')
		}
	}, [apiKeyInput]) // Added dependency

	const handleApiKeyInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		setApiKeyInput(e.target.value)
		if (apiKeyError) setApiKeyError(null) // Clear error on input change
	}

	const handleApiKeySubmit = (e: React.FormEvent) => {
		e.preventDefault()
		saveApiKey()
	}
	// --- End API Key Handling ---

	const {
		messages: chatMessages,
		input: chatInput,
		handleInputChange: handleChatInputChange,
		handleSubmit: handleChatSubmitInternal, // Rename internal handler
		reload, // Added reload
		error, // Added error state
		status,
	} = useChat({
		api: '/api/terminal-chat',
		id: 'terminal-chat',
		// Send the key in the body if it's from localStorage
		body: {
			apiKey: apiKey, // Send the current key state (will be null if backend has key)
		},
		// onError removed - proactive check handles missing key scenario
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
	const apiKeyInputRef = useRef<HTMLTextAreaElement>(null) // Added ref for API key input
	const scrollAreaRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		// Focus input on mount (either main or API key input)
		if (isApiKeyRequired) {
			apiKeyInputRef.current?.focus()
		} else {
			inputRef.current?.focus()
		}
	}, [isApiKeyRequired]) // Re-focus when API key requirement changes

	useEffect(() => {
		// Scroll to bottom on new message, streaming update, or API key prompt
		const scrollViewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]')
		if (scrollViewport) {
			requestAnimationFrame(() => {
				scrollViewport.scrollTop = scrollViewport.scrollHeight
			})
		}
	}, [messages, chatMessages, status, isApiKeyRequired]) // Added isApiKeyRequired

	// Focus input when assistant finishes responding or if API key becomes not required
	useEffect(() => {
		if (status !== 'streaming' && !isApiKeyRequired) {
			inputRef.current?.focus()
		} else if (isApiKeyRequired) {
			// Ensure API key input gets focus if needed and not streaming
			apiKeyInputRef.current?.focus()
		}
	}, [status, isApiKeyRequired])

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

	// Combined handleSubmit for both local commands and AI chat
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		const currentInput = input.trim()
		if (!currentInput) return

		// If API key is required, don't process normal commands/chat
		if (isApiKeyRequired) {
			setMessages((prev) => [...prev, {type: 'user', content: currentInput}, {type: 'system', content: 'Please enter your API Key above first.'}])
			setInput('')
			return
		}

		// Add user message
		setMessages((prev) => [...prev, {type: 'user', content: currentInput}])

		// Process command
		const command = currentInput.toLowerCase().trim()
		let response = ''

		switch (command) {
			case 'help':
				response = `Available commands:

  about        About this terminal
  clear        Clear the terminal
  date         Show current date and time
  clearkey     Clear the stored OpenAI API Key from local storage
  getkey       Show the stored OpenAI API Key (if set)
  help         Show this help message
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
			case 'getkey':
				const storedKey = localStorage.getItem(LOCAL_STORAGE_KEY)
				if (storedKey) {
					// Mask the key for display
					const maskedKey = storedKey.length > 8 ? `${storedKey.substring(0, 4)}...${storedKey.substring(storedKey.length - 4)}` : storedKey
					response = `Stored API Key: ${maskedKey}`
				} else {
					response = 'No API Key stored in local storage.'
				}
				break
			case 'clearkey':
				localStorage.removeItem(LOCAL_STORAGE_KEY)
				setApiKey(null) // Clear the key from state
				// We might need to re-trigger the check or prompt depending on backend status,
				// but for now, just confirm removal. The next API call or refresh will handle it.
				response = 'Stored API Key cleared from local storage.'
				// Optionally, you could re-run the check immediately:
				// checkBackendApiKey(); // Requires moving checkBackendApiKey outside useEffect or wrapping it
				break
			case 'social':
				response = `Connect with me:

  GitHub:   https://github.com/lugondev
  Twitter:  https://twitter.com/0xLugon
  Facebook: https://facebook.com/LugonAPT
  LinkedIn: https://www.linkedin.com/in/lugonlee`
				break
			case 'welcome':
				response = `Welcome to my terminal interface!
				
Type 'help' to see available commands.
Type 'about' to learn more about this project.
Type 'social' to connect with me on social media.

You can type any message to chat with the AI assistant!`
				break
			default:
				// If not a recognized command, treat as chat message
				const message = currentInput
				setInput('') // Clear input immediately

				// Check again if API key is needed before submitting
				if (isApiKeyRequired) {
					setMessages((prev) => [...prev, {type: 'system', content: 'Cannot chat: API Key is required.'}])
					return
				}

				// Sync with chat input (might not be necessary depending on useChat behavior)
				// handleChatInputChange({ target: { value: '' } } as any);

				// Remove any previous "Thinking..." messages
				setMessages((prev) => prev.filter((msg) => msg.content !== 'Thinking...'))

				// Submit the chat form with the captured message
				setTimeout(() => {
					// Use the renamed internal handler from useChat
					handleChatSubmitInternal({
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
		<div
			className='w-full max-w-3xl mx-auto h-[600px] rounded-lg terminal-window terminal-text terminal-bg'
			// Focus appropriate input based on state
			onClick={() => (isApiKeyRequired ? apiKeyInputRef.current?.focus() : inputRef.current?.focus())}>
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

				{/* Display API Key Error if present */}
				{apiKeyError && !isApiKeyRequired && <div className='mb-2 text-red-500'>$ {apiKeyError}</div>}

				{/* Display Streaming/Thinking status */}
				{status === 'streaming' && (
					<div className='mb-2 whitespace-pre-wrap terminal-text-assistant'>
						<span className='terminal-text-prompt text-syntax-cyan'>$</span> Thinking{loadingDots}
					</div>
				)}

				{/* Display Current Input Line (only if API key not required) */}
				{status !== 'streaming' && !isApiKeyRequired && (
					<div className='flex items-center'>
						<span className='terminal-text-prompt text-syntax-green'>{'>'}</span>
						<span className='terminal-text-input'>{input}</span>
						<span className='cursor' /> {/* Blinking cursor */}
					</div>
				)}

				{/* Display API Key Prompt Line (if API key is required) */}
				{isApiKeyRequired && (
					<div className='mt-2'>
						{apiKeyError && <div className='mb-1 text-red-500'>$ {apiKeyError}</div>}
						<div className='flex items-center'>
							<span className='mr-2 text-yellow-400'>API Key:</span>
							<span className='terminal-text-input'>{apiKeyInput}</span>
							<span className='cursor' /> {/* Blinking cursor for API key input */}
						</div>
					</div>
				)}
			</ScrollArea>

			{/* Conditionally render main input form OR API Key input form */}
			{!isApiKeyRequired ? (
				// Main Input Form (Visually hidden textarea)
				<form
					onSubmit={handleSubmit} // Use the main handler
					className='px-4 py-2 border-t border-border/50 bg-background/80'>
					<div className='flex items-center relative'>
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
							className='absolute top-0 left-0 w-full h-full opacity-0 cursor-text resize-none'
							placeholder='Type a command or message...'
							rows={1}
							disabled={status === 'streaming'} // Keep disabled while streaming
							autoFocus
							spellCheck='false'
						/>
						{/* Visual cue for disabled state during streaming (Optional) */}
						{status === 'streaming' && <div className='absolute inset-0 bg-background/50 cursor-not-allowed' />}
					</div>
				</form>
			) : (
				// API Key Input Form (Visually hidden textarea)
				<form
					onSubmit={handleApiKeySubmit} // Use the API key handler
					className='px-4 py-2 border-t border-border/50 bg-background/80'>
					<div className='flex items-center relative'>
						<textarea
							ref={apiKeyInputRef} // Use the specific ref
							value={apiKeyInput}
							onChange={handleApiKeyInputChange} // Use the specific handler
							onKeyDown={(e) => {
								if (e.key === 'Enter' && !e.shiftKey) {
									e.preventDefault()
									handleApiKeySubmit(e) // Submit API key on Enter
								}
							}}
							className='absolute top-0 left-0 w-full h-full opacity-0 cursor-text resize-none'
							placeholder='Enter your OpenAI API Key...'
							rows={1}
							autoFocus // Focus this when required
							spellCheck='false'
						/>
						{/* You could add a visual indicator or button here if desired */}
					</div>
				</form>
			)}
		</div>
	)
}
