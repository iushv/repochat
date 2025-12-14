'use client';

import { useState } from 'react';
import { ingestRepository, IngestResponse } from '@/lib/api';

interface SidebarProps {
    isReady: boolean;
    setIsReady: (ready: boolean) => void;
}

export default function Sidebar({ isReady, setIsReady }: SidebarProps) {
    const [repoUrl, setRepoUrl] = useState('');
    const [isIngesting, setIsIngesting] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [repoInfo, setRepoInfo] = useState<IngestResponse | null>(null);

    const handleIngest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!repoUrl.trim() || isIngesting) return;

        setIsIngesting(true);
        setStatus(null);

        try {
            const result = await ingestRepository(repoUrl);
            setRepoInfo(result);
            setIsReady(true);
            setStatus({ type: 'success', message: `Indexed ${result.documents} files (${result.chunks} chunks)` });
        } catch (error) {
            setStatus({ type: 'error', message: error instanceof Error ? error.message : 'Failed to ingest' });
        } finally {
            setIsIngesting(false);
        }
    };

    return (
        <aside className="w-80 bg-[var(--bg-secondary)] border-r border-[var(--border-primary)] flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-[var(--border-primary)]">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent-purple)] to-[var(--accent-blue)] flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="font-semibold text-[var(--text-primary)]">RepoChat</h1>
                        <p className="text-xs text-[var(--text-muted)]">AI Code Assistant</p>
                    </div>
                </div>
            </div>

            {/* Repository Input */}
            <div className="p-4 border-b border-[var(--border-primary)]">
                <h2 className="text-sm font-medium text-[var(--text-primary)] mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    Repository
                </h2>

                <form onSubmit={handleIngest}>
                    <input
                        type="text"
                        value={repoUrl}
                        onChange={(e) => setRepoUrl(e.target.value)}
                        placeholder="https://github.com/user/repo"
                        className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-purple)] mb-2"
                    />

                    <button
                        type="submit"
                        disabled={isIngesting || !repoUrl.trim()}
                        className="w-full bg-[var(--accent-purple)] hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors"
                    >
                        {isIngesting ? (
                            <>
                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Indexing...
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                                Ingest Repository
                            </>
                        )}
                    </button>
                </form>

                {/* Status */}
                {status && (
                    <div className={`mt-3 p-3 rounded-lg text-sm ${status.type === 'success'
                            ? 'bg-[var(--accent-green)]/10 border border-[var(--accent-green)]/30 text-[var(--accent-green)]'
                            : 'bg-[var(--accent-red)]/10 border border-[var(--accent-red)]/30 text-[var(--accent-red)]'
                        }`}>
                        {status.message}
                    </div>
                )}
            </div>

            {/* Repository Info */}
            {repoInfo && (
                <div className="p-4 border-b border-[var(--border-primary)]">
                    <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                            <svg className="w-4 h-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                            </svg>
                            <span className="text-sm font-medium text-[var(--text-primary)]">{repoInfo.repository}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-[var(--text-secondary)]">
                            <div className="flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                {repoInfo.documents} files
                            </div>
                            <div className="flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                                </svg>
                                {repoInfo.chunks} chunks
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Privacy Badge */}
            <div className="p-4 mt-auto">
                <div className="bg-[var(--accent-green)]/10 border border-[var(--accent-green)]/30 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-[var(--accent-green)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2m12-14V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span className="text-sm font-medium text-[var(--accent-green)]">Privacy Mode</span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                        All processing happens locally. Your code never leaves your machine.
                    </p>
                </div>
            </div>
        </aside>
    );
}
