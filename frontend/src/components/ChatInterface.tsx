'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ChatMessage, streamChat } from '@/lib/api';

interface ChatInterfaceProps {
    isReady: boolean;
    isIngesting: boolean;
}

// Trust Badge Component
function TrustBadge({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
    return (
        <div className="flex flex-col items-center px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl">
            <span className="text-2xl mb-1">{icon}</span>
            <span className="text-sm font-medium text-[var(--text-primary)]">{title}</span>
            <span className="text-xs text-[var(--text-muted)]">{subtitle}</span>
        </div>
    );
}

// Collapsible Section Component
function CollapsibleSection({
    title,
    icon,
    children,
    defaultOpen = false,
    badge
}: {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    defaultOpen?: boolean;
    badge?: string;
}) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="border border-[var(--border-primary)] rounded-lg overflow-hidden mb-3">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-3 py-2 bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors text-left"
            >
                <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    {icon}
                    <span>{title}</span>
                    {badge && (
                        <span className="px-1.5 py-0.5 text-xs bg-[var(--accent-purple)]/20 text-[var(--accent-purple)] rounded">
                            {badge}
                        </span>
                    )}
                </div>
                <svg
                    className={`w-4 h-4 text-[var(--text-muted)] transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {isOpen && (
                <div className="px-3 py-2 bg-[var(--bg-primary)] text-sm">
                    {children}
                </div>
            )}
        </div>
    );
}

// Code Block Component with syntax highlighting
function CodeBlock({ language, children }: { language?: string; children: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(children);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const lang = language || 'text';

    return (
        <div className="relative group my-3 rounded-lg overflow-hidden border border-[var(--border-primary)]">
            <div className="flex items-center justify-between px-3 py-1.5 bg-[#1e1e1e] border-b border-[var(--border-primary)]">
                <span className="text-xs text-[var(--text-muted)] font-mono uppercase">{lang}</span>
                <button
                    onClick={handleCopy}
                    className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-1 transition-colors"
                >
                    {copied ? (
                        <>
                            <svg className="w-3.5 h-3.5 text-[var(--accent-green)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Copied!
                        </>
                    ) : (
                        <>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Copy
                        </>
                    )}
                </button>
            </div>
            <SyntaxHighlighter
                language={lang}
                style={vscDarkPlus}
                customStyle={{
                    margin: 0,
                    padding: '12px',
                    background: '#1e1e1e',
                    fontSize: '13px',
                    borderRadius: 0,
                }}
                wrapLongLines={true}
            >
                {children.trim()}
            </SyntaxHighlighter>
        </div>
    );
}

// Message Component with proper formatting
function MessageContent({ message }: { message: ChatMessage }) {
    if (message.role === 'user') {
        return <p className="text-sm">{message.content}</p>;
    }

    const markdownComponents = useMemo(() => ({
        code({ className, children, ...props }: { className?: string; children?: React.ReactNode }) {
            const match = /language-(\w+)/.exec(className || '');
            const codeString = String(children).replace(/\n$/, '');

            if (match || codeString.includes('\n') || codeString.length > 80) {
                return <CodeBlock language={match?.[1]}>{codeString}</CodeBlock>;
            }

            return (
                <code className="text-[var(--accent-purple)] bg-[var(--bg-secondary)] px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                    {children}
                </code>
            );
        },
        table({ children }: { children?: React.ReactNode }) {
            return (
                <div className="overflow-x-auto my-3 rounded-lg border border-[var(--border-primary)]">
                    <table className="min-w-full divide-y divide-[var(--border-primary)]">
                        {children}
                    </table>
                </div>
            );
        },
        th({ children }: { children?: React.ReactNode }) {
            return (
                <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--text-primary)] bg-[var(--bg-secondary)] border-b border-[var(--border-primary)]">
                    {children}
                </th>
            );
        },
        td({ children }: { children?: React.ReactNode }) {
            return (
                <td className="px-3 py-2 text-sm text-[var(--text-secondary)] border-b border-[var(--border-primary)]">
                    {children}
                </td>
            );
        },
        h1({ children }: { children?: React.ReactNode }) {
            return <h1 className="text-xl font-bold text-[var(--text-primary)] mt-4 mb-2">{children}</h1>;
        },
        h2({ children }: { children?: React.ReactNode }) {
            return <h2 className="text-lg font-semibold text-[var(--text-primary)] mt-4 mb-2">{children}</h2>;
        },
        h3({ children }: { children?: React.ReactNode }) {
            return <h3 className="text-base font-semibold text-[var(--text-primary)] mt-3 mb-1">{children}</h3>;
        },
        p({ children }: { children?: React.ReactNode }) {
            return <p className="text-[var(--text-primary)] leading-relaxed my-2">{children}</p>;
        },
        ul({ children }: { children?: React.ReactNode }) {
            return <ul className="list-disc list-inside my-2 space-y-1 text-[var(--text-primary)]">{children}</ul>;
        },
        ol({ children }: { children?: React.ReactNode }) {
            return <ol className="list-decimal list-inside my-2 space-y-1 text-[var(--text-primary)]">{children}</ol>;
        },
        li({ children }: { children?: React.ReactNode }) {
            return <li className="text-[var(--text-primary)]">{children}</li>;
        },
        strong({ children }: { children?: React.ReactNode }) {
            return <strong className="font-semibold text-[var(--text-primary)]">{children}</strong>;
        },
        a({ href, children }: { href?: string; children?: React.ReactNode }) {
            return <a href={href} className="text-[var(--accent-blue)] hover:underline">{children}</a>;
        },
        blockquote({ children }: { children?: React.ReactNode }) {
            return (
                <blockquote className="border-l-4 border-[var(--accent-purple)] pl-4 my-2 italic text-[var(--text-secondary)]">
                    {children}
                </blockquote>
            );
        },
    }), []);

    return (
        <div className="space-y-3">
            {message.sources && message.sources.length > 0 && (
                <CollapsibleSection
                    title="Sources Referenced"
                    icon={
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    }
                    badge={`${message.sources.length} files`}
                    defaultOpen={false}
                >
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                        {message.sources.map((source, i) => {
                            const filePath = source.replace(/^.*?\/repos\/[^/]+\//, '');
                            return (
                                <div key={i} className="flex items-center gap-2 py-1 px-2 rounded bg-[var(--bg-secondary)] text-[var(--text-secondary)]">
                                    <svg className="w-3 h-3 text-[var(--accent-blue)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <span className="text-xs font-mono truncate">{filePath}</span>
                                </div>
                            );
                        })}
                    </div>
                </CollapsibleSection>
            )}

            {message.content ? (
                <div className="text-[var(--text-primary)]">
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={markdownComponents}
                    >
                        {message.content}
                    </ReactMarkdown>
                </div>
            ) : (
                <div className="flex items-center gap-2 text-[var(--text-muted)]">
                    <span className="typing-dot w-2 h-2 bg-[var(--text-muted)] rounded-full"></span>
                    <span className="typing-dot w-2 h-2 bg-[var(--text-muted)] rounded-full"></span>
                    <span className="typing-dot w-2 h-2 bg-[var(--text-muted)] rounded-full"></span>
                    <span className="text-sm ml-2">Analyzing codebase...</span>
                </div>
            )}

            {message.isStreaming && message.content && (
                <span className="inline-block w-2 h-4 bg-[var(--accent-purple)] animate-pulse"></span>
            )}
        </div>
    );
}

// Enterprise Welcome Screen
function WelcomeScreen({ onQuestionClick }: { onQuestionClick: (q: string) => void }) {
    const onboardingQuestions = [
        { text: "What does this project do?", icon: "🎯" },
        { text: "How do I set up my dev environment?", icon: "⚙️" },
        { text: "Explain the architecture", icon: "🏗️" },
        { text: "Where is the main entry point?", icon: "🚀" },
    ];

    return (
        <div className="flex flex-col items-center justify-center h-full text-center px-4 max-w-3xl mx-auto">
            {/* Hero Section */}
            <div className="mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-3">
                    Onboard to any codebase in hours, not months
                </h1>
                <p className="text-base sm:text-lg text-[var(--text-secondary)] max-w-xl">
                    Ask questions about your code and get answers with actual snippets,
                    all running <span className="text-[var(--accent-green)] font-medium">100% locally</span>.
                </p>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap justify-center gap-3 mb-8">
                <TrustBadge icon="🔒" title="100% Private" subtitle="Code stays local" />
                <TrustBadge icon="🏢" title="Enterprise Ready" subtitle="On-prem deployment" />
                <TrustBadge icon="📄" title="No Docs Needed" subtitle="AI understands code" />
            </div>

            {/* Quick Start Questions */}
            <div className="w-full max-w-lg">
                <p className="text-sm text-[var(--text-muted)] mb-3">New to this codebase? Start with:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {onboardingQuestions.map((q) => (
                        <button
                            key={q.text}
                            onClick={() => onQuestionClick(q.text)}
                            className="flex items-center gap-2 px-4 py-3 text-left bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-purple)] transition-all hover:scale-[1.02]"
                        >
                            <span className="text-lg">{q.icon}</span>
                            <span className="text-sm">{q.text}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function ChatInterface({ isReady, isIngesting }: ChatInterfaceProps) {
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
        await sendMessage(input);
    };

    const sendMessage = async (text: string) => {
        const userMessage: ChatMessage = { role: 'user', content: text };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        const assistantMessage: ChatMessage = {
            role: 'assistant',
            content: '',
            sources: [],
            isStreaming: true
        };
        setMessages(prev => [...prev, assistantMessage]);

        try {
            for await (const chunk of streamChat(text)) {
                if (chunk.type === 'sources') {
                    setMessages(prev => {
                        const updated = prev.slice(0, -1);
                        const last = prev[prev.length - 1];
                        if (last.role === 'assistant') {
                            return [...updated, { ...last, sources: chunk.data as string[] }];
                        }
                        return prev;
                    });
                } else if (chunk.type === 'token') {
                    setMessages(prev => {
                        const updated = prev.slice(0, -1);
                        const last = prev[prev.length - 1];
                        if (last.role === 'assistant') {
                            return [...updated, { ...last, content: last.content + chunk.data }];
                        }
                        return prev;
                    });
                } else if (chunk.type === 'done') {
                    setMessages(prev => {
                        const updated = prev.slice(0, -1);
                        const last = prev[prev.length - 1];
                        if (last.role === 'assistant') {
                            return [...updated, { ...last, isStreaming: false }];
                        }
                        return prev;
                    });
                } else if (chunk.type === 'error') {
                    throw new Error(chunk.data as string);
                }
            }
        } catch (error) {
            setMessages(prev => {
                const updated = prev.slice(0, -1);
                const last = prev[prev.length - 1];
                if (last.role === 'assistant') {
                    return [...updated, {
                        ...last,
                        content: `**Error:** ${error instanceof Error ? error.message : 'Unknown error'}`,
                        isStreaming: false
                    }];
                }
                return prev;
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Privacy Banner */}
            <div className="px-4 py-2 bg-[var(--accent-green)]/10 border-b border-[var(--accent-green)]/30 flex items-center justify-center gap-2">
                <svg className="w-4 h-4 text-[var(--accent-green)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="text-xs sm:text-sm text-[var(--accent-green)] font-medium">
                    Enterprise Mode: Your code never leaves this machine
                </span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 pt-14 lg:pt-6">
                {/* Show welcome screen when ready and no messages */}
                {messages.length === 0 && isReady && !isIngesting && (
                    <WelcomeScreen onQuestionClick={(q) => sendMessage(q)} />
                )}

                {/* Show processing state when ingesting */}
                {isIngesting && (
                    <div className="flex flex-col items-center justify-center h-full text-center px-4">
                        <div className="w-20 h-20 mb-6 rounded-full bg-[var(--accent-purple)]/20 flex items-center justify-center animate-pulse">
                            <svg className="w-10 h-10 text-[var(--accent-purple)] animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
                            Analyzing your codebase...
                        </h2>
                        <p className="text-[var(--text-secondary)] max-w-md mb-4">
                            Please wait while we index your repository. This may take a few minutes for larger codebases.
                        </p>
                        <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>You can ask questions once indexing is complete</span>
                        </div>
                    </div>
                )}

                {/* Show prompt to ingest when not ready and not ingesting */}
                {messages.length === 0 && !isReady && !isIngesting && (
                    <div className="flex flex-col items-center justify-center h-full text-center px-4">
                        <div className="w-16 h-16 mb-4 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center">
                            <svg className="w-8 h-8 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
                            Ingest a repository to get started
                        </h2>
                        <p className="text-[var(--text-secondary)] max-w-md">
                            Add a GitHub repository URL in the sidebar to begin analyzing your codebase.
                        </p>
                    </div>
                )}

                {messages.map((message, index) => (
                    <div
                        key={index}
                        className={`flex gap-3 animate-fade-in ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        {message.role === 'assistant' && (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--accent-purple)] to-[var(--accent-blue)] flex items-center justify-center flex-shrink-0 mt-1">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                        )}

                        <div className={`${message.role === 'user' ? 'max-w-[70%]' : 'max-w-[90%] sm:max-w-[85%] flex-1'}`}>
                            <div
                                className={`rounded-2xl px-4 py-3 ${message.role === 'user'
                                    ? 'bg-[var(--accent-blue)] text-white'
                                    : 'bg-[var(--bg-tertiary)] border border-[var(--border-primary)]'
                                    }`}
                            >
                                <MessageContent message={message} />
                            </div>
                        </div>

                        {message.role === 'user' && (
                            <div className="w-8 h-8 rounded-full bg-[var(--accent-green)] flex items-center justify-center flex-shrink-0 mt-1">
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
            <div className="border-t border-[var(--border-primary)] p-3 sm:p-4 bg-[var(--bg-secondary)]">
                <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
                    <div className="relative">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={isReady ? "Ask about your codebase..." : "Ingest a repository first..."}
                            disabled={!isReady || isLoading}
                            className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl px-4 py-3 pr-12 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-purple)] focus:ring-1 focus:ring-[var(--accent-purple)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
                        />
                        <button
                            type="submit"
                            disabled={!isReady || isLoading || !input.trim()}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-[var(--accent-purple)] text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-opacity-90 transition-all"
                        >
                            {isLoading ? (
                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                </svg>
                            ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
