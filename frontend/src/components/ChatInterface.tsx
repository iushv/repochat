'use client';

import { useState, useRef, useEffect } from 'react';
import { ChatMessage, streamChat } from '@/lib/api';

interface ChatInterfaceProps {
    isReady: boolean;
}

export default function ChatInterface({ isReady }: ChatInterfaceProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading || !isReady) return;

        const userMessage: ChatMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        // Add placeholder for assistant message
        const assistantMessage: ChatMessage = {
            role: 'assistant',
            content: '',
            sources: [],
            isStreaming: true
        };
        setMessages(prev => [...prev, assistantMessage]);

        try {
            for await (const chunk of streamChat(input)) {
                if (chunk.type === 'sources') {
                    setMessages(prev => {
                        const updated = [...prev];
                        const last = updated[updated.length - 1];
                        if (last.role === 'assistant') {
                            last.sources = chunk.data as string[];
                        }
                        return updated;
                    });
                } else if (chunk.type === 'token') {
                    setMessages(prev => {
                        const updated = [...prev];
                        const last = updated[updated.length - 1];
                        if (last.role === 'assistant') {
                            last.content += chunk.data;
                        }
                        return updated;
                    });
                } else if (chunk.type === 'done') {
                    setMessages(prev => {
                        const updated = [...prev];
                        const last = updated[updated.length - 1];
                        if (last.role === 'assistant') {
                            last.isStreaming = false;
                        }
                        return updated;
                    });
                } else if (chunk.type === 'error') {
                    throw new Error(chunk.data as string);
                }
            }
        } catch (error) {
            setMessages(prev => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last.role === 'assistant') {
                    last.content = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
                    last.isStreaming = false;
                }
                return updated;
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="w-16 h-16 mb-4 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center">
                            <svg className="w-8 h-8 text-[var(--accent-purple)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
                            Ask anything about your code
                        </h2>
                        <p className="text-[var(--text-secondary)] max-w-md">
                            I can help you understand how functions work, find implementations,
                            explain architectural decisions, and more.
                        </p>
                        <div className="mt-6 flex flex-wrap gap-2 justify-center">
                            {['What does this repo do?', 'How is authentication implemented?', 'Show me the main entry point'].map((q) => (
                                <button
                                    key={q}
                                    onClick={() => setInput(q)}
                                    className="px-3 py-1.5 text-sm bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-purple)] transition-colors"
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {messages.map((message, index) => (
                    <div
                        key={index}
                        className={`flex gap-4 animate-fade-in ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        {message.role === 'assistant' && (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--accent-purple)] to-[var(--accent-blue)] flex items-center justify-center flex-shrink-0">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                        )}

                        <div className={`max-w-[80%] ${message.role === 'user' ? 'order-first' : ''}`}>
                            <div
                                className={`rounded-2xl px-4 py-3 ${message.role === 'user'
                                        ? 'bg-[var(--accent-blue)] text-white'
                                        : 'bg-[var(--bg-tertiary)] border border-[var(--border-primary)]'
                                    }`}
                            >
                                {message.role === 'assistant' ? (
                                    <div className="prose prose-invert prose-sm max-w-none">
                                        <pre className="whitespace-pre-wrap font-sans text-[var(--text-primary)]">
                                            {message.content || (
                                                <span className="flex gap-1">
                                                    <span className="typing-dot w-2 h-2 bg-[var(--text-muted)] rounded-full"></span>
                                                    <span className="typing-dot w-2 h-2 bg-[var(--text-muted)] rounded-full"></span>
                                                    <span className="typing-dot w-2 h-2 bg-[var(--text-muted)] rounded-full"></span>
                                                </span>
                                            )}
                                        </pre>
                                        {message.isStreaming && message.content && (
                                            <span className="inline-block w-2 h-4 bg-[var(--accent-purple)] animate-pulse ml-1"></span>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-sm">{message.content}</p>
                                )}
                            </div>

                            {/* Sources */}
                            {message.sources && message.sources.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                    {message.sources.slice(0, 5).map((source, i) => (
                                        <span
                                            key={i}
                                            className="text-xs px-2 py-0.5 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded text-[var(--text-muted)]"
                                        >
                                            📄 {source.split('/').pop()}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {message.role === 'user' && (
                            <div className="w-8 h-8 rounded-full bg-[var(--accent-green)] flex items-center justify-center flex-shrink-0">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                        )}
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-[var(--border-primary)] p-4">
                <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
                    <div className="relative">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={isReady ? "Ask about your code..." : "Ingest a repository first..."}
                            disabled={!isReady || isLoading}
                            className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl px-4 py-3 pr-12 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-purple)] focus:ring-1 focus:ring-[var(--accent-purple)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        />
                        <button
                            type="submit"
                            disabled={!isReady || isLoading || !input.trim()}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-[var(--accent-purple)] text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-opacity-90 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
