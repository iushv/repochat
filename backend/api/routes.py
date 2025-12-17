"""
RepoChat Backend - API Routes
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
import json
import logging

from ..services import rag_service, llm_service
from ..core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()


# ============== Request/Response Models ==============

class IngestRequest(BaseModel):
    url: str
    
class IngestResponse(BaseModel):
    success: bool
    message: str
    repository: Optional[str] = None
    documents: int = 0
    chunks: int = 0

class ChatRequest(BaseModel):
    question: str
    stream: bool = True

class ChatResponse(BaseModel):
    answer: str
    sources: list[str]

class HealthResponse(BaseModel):
    status: str
    version: str
    llm_status: dict
    index_status: dict


# ============== Routes ==============

@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Check health of all services."""
    return {
        "status": "healthy",
        "version": settings.APP_VERSION,
        "llm_status": llm_service.health_check(),
        "index_status": rag_service.get_stats()
    }


@router.post("/repos/ingest", response_model=IngestResponse)
async def ingest_repository(request: IngestRequest):
    """Ingest a GitHub repository into the vector store."""
    logger.info(f"Ingesting repository: {request.url}")
    result = await rag_service.ingest_repository(request.url)
    
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    
    return result


@router.post("/repos/ingest/stream")
async def ingest_repository_stream(request: IngestRequest):
    """Ingest a GitHub repository with streaming progress updates."""
    logger.info(f"Ingesting repository (streaming): {request.url}")
    
    async def generate():
        try:
            # Extract repo name
            repo_name = request.url.split("/")[-1].replace(".git", "")
            
            # Progress: Starting
            start_data = json.dumps({'stage': 'starting', 'message': 'Initializing...', 'progress': 5})
            yield f"data: {start_data}\n\n"
            
            # Progress: Cloning
            clone_msg = f'Cloning {repo_name}...'
            clone_data = json.dumps({'stage': 'cloning', 'message': clone_msg, 'progress': 15})
            yield f"data: {clone_data}\n\n"
            
            # Actually perform ingestion
            result = await rag_service.ingest_repository(request.url)
            
            if result["success"]:
                # Progress: Complete
                docs = result["documents"]
                chunks = result["chunks"]
                complete_msg = f'Indexed {docs} files ({chunks} chunks)'
                complete_data = json.dumps({'stage': 'complete', 'message': complete_msg, 'progress': 100, 'result': result})
                yield f"data: {complete_data}\n\n"
            else:
                error_data = json.dumps({'stage': 'error', 'message': result['message'], 'progress': 0})
                yield f"data: {error_data}\n\n"
                
        except Exception as e:
            logger.error(f"Ingestion stream failed: {e}")
            error_data = json.dumps({'stage': 'error', 'message': str(e), 'progress': 0})
            yield f"data: {error_data}\n\n"
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )


@router.get("/repos/status")
async def get_repo_status():
    """Get current repository/index status."""
    return rag_service.get_stats()


@router.post("/chat")
async def chat(request: ChatRequest):
    """Chat with the codebase."""
    if not rag_service.has_index():
        raise HTTPException(
            status_code=400, 
            detail="No repository indexed. Please ingest a repository first."
        )
    
    # Get context from RAG
    context, sources = rag_service.get_context(request.question)
    
    if not context:
        raise HTTPException(
            status_code=404,
            detail="No relevant code found for your question."
        )
    
    # Build prompt with enhanced formatting instructions
    system_prompt = """You are RepoChat, an expert AI assistant that helps developers understand codebases.

RESPONSE FORMATTING RULES:
1. Start with a brief 1-2 sentence summary answering the question directly
2. Use clear markdown headers (## and ###) to organize longer responses
3. When showing code, ALWAYS use fenced code blocks with the language: ```python, ```javascript, etc.
4. Keep explanations concise and scannable - use bullet points for lists
5. Include file paths as inline code: `path/to/file.py`
6. When referencing multiple files, use a table or bullet list
7. End with a brief "Key Takeaway" if the response is complex

CONTENT RULES:
- Answer based ONLY on the provided code context
- Be specific - reference actual function/class names from the code
- If information isn't in the context, say "Based on the provided code, I cannot find..."
- Don't hallucinate or assume functionality not shown"""

    user_prompt = f"""Question: {request.question}

Code Context (from repository files):
{context}

Provide a clear, well-formatted answer following the formatting rules. Be concise but thorough."""

    if request.stream:
        # Streaming response
        async def generate():
            # First, send sources
            yield f"data: {json.dumps({'type': 'sources', 'data': sources})}\n\n"
            
            # Then stream the answer
            try:
                for chunk in llm_service.generate(user_prompt, system_prompt, stream=True):
                    yield f"data: {json.dumps({'type': 'token', 'data': chunk})}\n\n"
                
                yield f"data: {json.dumps({'type': 'done'})}\n\n"
            except Exception as e:
                yield f"data: {json.dumps({'type': 'error', 'data': str(e)})}\n\n"
        
        return StreamingResponse(
            generate(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            }
        )
    else:
        # Non-streaming response
        try:
            answer = llm_service.generate(user_prompt, system_prompt, stream=False)
            return {"answer": answer, "sources": sources}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))


@router.post("/search")
async def search(query: str, k: int = 10):
    """Search the codebase without LLM generation."""
    if not rag_service.has_index():
        raise HTTPException(status_code=400, detail="No repository indexed.")
    
    results = rag_service.search(query, k=k)
    return {"results": results, "count": len(results)}
