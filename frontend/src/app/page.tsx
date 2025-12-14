'use client';

import { useState, useEffect } from 'react';
import ChatInterface from '@/components/ChatInterface';
import Sidebar from '@/components/Sidebar';
import { getRepoStatus } from '@/lib/api';

export default function Home() {
  const [isReady, setIsReady] = useState(false);

  // Check if there's an existing index on mount
  useEffect(() => {
    getRepoStatus()
      .then((status) => setIsReady(status.indexed))
      .catch(() => setIsReady(false));
  }, []);

  return (
    <main className="flex h-screen bg-[var(--bg-primary)]">
      <Sidebar isReady={isReady} setIsReady={setIsReady} />
      <div className="flex-1 flex flex-col">
        <ChatInterface isReady={isReady} />
      </div>
    </main>
  );
}
