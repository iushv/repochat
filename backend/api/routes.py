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
    
    # Build prompt
    system_prompt = """You are RepoChat, an AI assistant that helps developers understand codebases.
You answer questions based ONLY on the provided code context.
Always include relevant code snippets in your answers.
Be concise but thorough.
If the context doesn't contain enough information to answer, say so."""

    user_prompt = f"""Question: {request.question}

Code Context:
{context}

Instructions:
1. Answer the question based on the code above
2. Include relevant code snippets with file paths
3. Be specific and accurate
4. If unsure, say so"""

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
