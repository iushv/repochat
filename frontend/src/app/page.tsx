'use client';

import { useState, useEffect } from 'react';
import ChatInterface from '@/components/ChatInterface';
import Sidebar from '@/components/Sidebar';
import { getRepoStatus } from '@/lib/api';

export default function Home() {
  const [isReady, setIsReady] = useState(false);
  const [isIngesting, setIsIngesting] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Check if there's an existing index on mount
  useEffect(() => {
    getRepoStatus()
      .then((status) => setIsReady(status.indexed))
      .catch(() => setIsReady(false));
  }, []);

  return (
    <main className="flex h-screen bg-[var(--bg-primary)] relative">
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[var(--text-primary)]"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {sidebarOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:relative inset-y-0 left-0 z-40
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <Sidebar
          isReady={isReady}
          setIsReady={setIsReady}
          isIngesting={isIngesting}
          setIsIngesting={setIsIngesting}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col w-full lg:w-auto">
        <ChatInterface isReady={isReady} isIngesting={isIngesting} />
      </div>
    </main>
  );
}
