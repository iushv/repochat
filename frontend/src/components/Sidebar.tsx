'use client';

import { useState } from 'react';
import { streamIngest, IngestResponse } from '@/lib/api';

interface SidebarProps {
    isReady: boolean;
    setIsReady: (ready: boolean) => void;
    isIngesting: boolean;
    setIsIngesting: (ingesting: boolean) => void;
    onClose?: () => void;
}

// Progress stages with icons
const stageInfo: Record<string, { icon: string; color: string }> = {
    starting: { icon: '⚡', color: 'var(--accent-blue)' },
    cloning: { icon: '📥', color: 'var(--accent-purple)' },
    loading: { icon: '📄', color: 'var(--accent-blue)' },
    embedding: { icon: '🧠', color: 'var(--accent-purple)' },
    complete: { icon: '✅', color: 'var(--accent-green)' },
    error: { icon: '❌', color: '#ef4444' },
};

export default function Sidebar({ isReady, setIsReady, isIngesting, setIsIngesting, onClose }: SidebarProps) {
    const [repoUrl, setRepoUrl] = useState('');
    const [progress, setProgress] = useState(0);
    const [stage, setStage] = useState<string>('');
    const [statusMessage, setStatusMessage] = useState<string>('');
    const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [repoInfo, setRepoInfo] = useState<IngestResponse | null>(null);

    const handleIngest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!repoUrl.trim() || isIngesting) return;

        setIsIngesting(true);
        setStatus(null);
        setProgress(0);
        setStage('starting');
        setStatusMessage('Initializing...');

        try {
            for await (const update of streamIngest(repoUrl)) {
                setStage(update.stage);
                setProgress(update.progress);
                setStatusMessage(update.message);

                if (update.stage === 'complete' && update.result) {
                    setRepoInfo(update.result);
                    setIsReady(true);
                    setStatus({ type: 'success', message: update.message });
                    if (onClose) onClose();
                } else if (update.stage === 'error') {
                    setStatus({ type: 'error', message: update.message });
                }
            }
        } catch (error) {
            setStatus({ type: 'error', message: error instanceof Error ? error.message : 'Failed to ingest' });
            setProgress(0);
            setStage('error');
        } finally {
            setIsIngesting(false);
        }
    };

    const getStageStyle = () => stageInfo[stage] || stageInfo.starting;

    return (
        <aside className="w-80 max-w-[85vw] bg-[var(--bg-secondary)] border-r border-[var(--border-primary)] flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-[var(--border-primary)]">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent-purple)] to-[var(--accent-blue)] flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="font-semibold text-[var(--text-primary)]">RepoChat</h1>
                            <p className="text-xs text-[var(--accent-green)]">Private Code Onboarding</p>
                        </div>
                    </div>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="lg:hidden p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)]"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Repository Input */}
            <div className="p-4 border-b border-[var(--border-primary)]">
                <form onSubmit={handleIngest}>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                        Add Your Codebase
                    </label>
                    <input
                        type="text"
                        value={repoUrl}
                        onChange={(e) => setRepoUrl(e.target.value)}
                        placeholder="https://github.com/org/repo"
                        disabled={isIngesting}
                        className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-purple)] disabled:opacity-50"
                    />

                    {/* Progress Bar */}
                    {isIngesting && (
                        <div className="mt-3 space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                                <span>{getStageStyle().icon}</span>
                                <span className="text-[var(--text-secondary)]">{statusMessage}</span>
                            </div>
                            <div className="relative w-full h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                                <div
                                    className="absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out"
                                    style={{
                                        width: `${progress}%`,
                                        backgroundColor: getStageStyle().color,
                                    }}
                                />
                            </div>
                            <div className="text-xs text-[var(--text-muted)] text-right">{progress}%</div>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isIngesting || !repoUrl.trim()}
                        className="mt-3 w-full bg-[var(--accent-purple)] text-white font-medium py-2 rounded-lg hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                    >
                        {isIngesting ? (
                            <>
                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                </svg>
                                Analyzing...
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                                Ingest Codebase
                            </>
                        )}
                    </button>
                </form>

                {/* Status Messages */}
                {status && (
                    <div className={`mt-3 p-3 rounded-lg text-sm flex items-start gap-2 ${status.type === 'success'
                        ? 'bg-[var(--accent-green)]/10 text-[var(--accent-green)] border border-[var(--accent-green)]/30'
                        : 'bg-red-500/10 text-red-400 border border-red-500/30'
                        }`}>
                        <span className="flex-shrink-0">{status.type === 'success' ? '✅' : '❌'}</span>
                        <span>{status.message}</span>
                    </div>
                )}
            </div>

            {/* Repository Info */}
            {repoInfo && (
                <div className="p-4 border-b border-[var(--border-primary)]">
                    <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-2">Active Codebase</h3>
                    <div className="p-3 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)]">
                        <div className="flex items-center gap-2 text-[var(--text-primary)] mb-2">
                            <svg className="w-4 h-4 text-[var(--accent-blue)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                            </svg>
                            <span className="font-mono text-sm truncate">{repoInfo.repository}</span>
                        </div>
                        <div className="flex gap-4 text-xs text-[var(--text-muted)]">
                            <span>📄 {repoInfo.documents} files</span>
                            <span>🧩 {repoInfo.chunks} chunks</span>
                        </div>
                        <div className="mt-2 flex items-center gap-1 text-xs text-[var(--accent-green)]">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Indexed locally
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Start Guide */}
            <div className="p-4 border-b border-[var(--border-primary)]">
                <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-2">🚀 Quick Start</h3>
                <ul className="space-y-2 text-sm text-[var(--text-muted)]">
                    <li className="flex items-start gap-2">
                        <span className="text-[var(--text-primary)]">1.</span>
                        <span>Paste your internal repo URL above</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-[var(--text-primary)]">2.</span>
                        <span>Wait for indexing to complete</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-[var(--text-primary)]">3.</span>
                        <span>Ask questions about your code</span>
                    </li>
                </ul>
            </div>

            {/* Enterprise Badge */}
            <div className="mt-auto p-4">
                <div className="rounded-lg bg-gradient-to-r from-[var(--accent-purple)]/10 to-[var(--accent-blue)]/10 border border-[var(--accent-purple)]/30 p-3">
                    <div className="flex items-center gap-2 mb-2">
                        <svg className="w-5 h-5 text-[var(--accent-purple)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        <span className="text-sm font-medium text-[var(--text-primary)]">Enterprise Mode</span>
                    </div>
                    <ul className="space-y-1 text-xs text-[var(--text-muted)]">
                        <li className="flex items-center gap-1">
                            <span className="text-[var(--accent-green)]">✓</span> 100% Local Processing
                        </li>
                        <li className="flex items-center gap-1">
                            <span className="text-[var(--accent-green)]">✓</span> No Cloud Dependencies
                        </li>
                        <li className="flex items-center gap-1">
                            <span className="text-[var(--accent-green)]">✓</span> Your Code Stays Private
                        </li>
                    </ul>
                </div>
            </div>
        </aside>
    );
}
