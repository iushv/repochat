// API client for RepoChat backend
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export interface IngestRequest {
    url: string;
}

export interface IngestResponse {
    success: boolean;
    message: string;
    repository?: string;
    documents: number;
    chunks: number;
}

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    sources?: string[];
    isStreaming?: boolean;
}

export interface HealthResponse {
    status: string;
    version: string;
    llm_status: {
        status: string;
        provider: string;
    };
    index_status: {
        indexed: boolean;
    };
}

// Health check
export async function checkHealth(): Promise<HealthResponse> {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error('Health check failed');
    return res.json();
}

// Ingest repository
export async function ingestRepository(url: string): Promise<IngestResponse> {
    const res = await fetch(`${API_BASE}/repos/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || 'Ingestion failed');
    }

    return res.json();
}

// Chat with streaming
export async function* streamChat(question: string): AsyncGenerator<{
    type: 'sources' | 'token' | 'done' | 'error';
    data?: string | string[];
}> {
    const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, stream: true }),
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || 'Chat failed');
    }

    const reader = res.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) throw new Error('No response body');

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split('\n').filter(line => line.startsWith('data: '));

        for (const line of lines) {
            try {
                const data = JSON.parse(line.slice(6));
                yield data;
            } catch {
                // Ignore parse errors
            }
        }
    }
}

// Get repo status
export async function getRepoStatus(): Promise<{ indexed: boolean }> {
    const res = await fetch(`${API_BASE}/repos/status`);
    if (!res.ok) return { indexed: false };
    return res.json();
}
