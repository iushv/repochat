"""
RepoChat Backend - RAG Service
Handles repository ingestion, vector storage, and retrieval.
"""
import os
import shutil
import logging
from typing import Optional
from pathlib import Path
from git import Repo
from langchain_community.document_loaders import DirectoryLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings, HuggingFaceEndpointEmbeddings
from langchain_community.vectorstores import FAISS
from ..core.config import settings

logger = logging.getLogger(__name__)


class RAGService:
    """Service for RAG operations: ingestion, retrieval, and search."""
    
    def __init__(self):
        self.embeddings = self._init_embeddings()
        self.vector_store: Optional[FAISS] = None
        self._load_existing_index()
    
    def _init_embeddings(self):
        """Initialize embedding model."""
        if settings.USE_LOCAL_EMBEDDINGS:
            logger.info("Using local embeddings (sentence-transformers)")
            return HuggingFaceEmbeddings(
                model_name=settings.EMBEDDING_MODEL,
                model_kwargs={'device': 'cpu'}
            )
        else:
            logger.info("Using Hugging Face API embeddings")
            return HuggingFaceEndpointEmbeddings(
                huggingfacehub_api_token=settings.HUGGINGFACEHUB_API_TOKEN,
                model=settings.EMBEDDING_MODEL
            )
    
    def _load_existing_index(self):
        """Load existing FAISS index if available."""
        if os.path.exists(settings.FAISS_INDEX_PATH):
            try:
                self.vector_store = FAISS.load_local(
                    settings.FAISS_INDEX_PATH,
                    self.embeddings,
                    allow_dangerous_deserialization=True
                )
                logger.info(f"Loaded existing index from {settings.FAISS_INDEX_PATH}")
            except Exception as e:
                logger.warning(f"Could not load existing index: {e}")
    
    async def ingest_repository(self, repo_url: str) -> dict:
        """
        Ingest a GitHub repository into the vector store.
        
        Args:
            repo_url: GitHub repository URL
            
        Returns:
            dict with status, document count, and chunk count
        """
        try:
            # Extract repo name
            repo_name = repo_url.split("/")[-1].replace(".git", "")
            repo_path = os.path.join(settings.REPO_DATA_PATH, repo_name)
            
            # Ensure data directory exists
            os.makedirs(settings.REPO_DATA_PATH, exist_ok=True)
            os.makedirs(settings.FAISS_INDEX_PATH, exist_ok=True)
            
            # Clone or pull repository
            if os.path.exists(repo_path):
                logger.info(f"Repository exists, pulling updates...")
                try:
                    repo = Repo(repo_path)
                    repo.remotes.origin.pull()
                except Exception as e:
                    logger.warning(f"Could not pull: {e}")
            else:
                logger.info(f"Cloning repository to {repo_path}")
                Repo.clone_from(repo_url, repo_path)
            
            # Load documents
            logger.info("Loading documents...")
            loader = DirectoryLoader(
                repo_path,
                glob="**/*",
                exclude=["**/.git", "**/__pycache__", "**/*.pyc", "**/node_modules"],
                loader_cls=TextLoader,
                loader_kwargs={"autodetect_encoding": True},
                use_multithreading=True,
                silent_errors=True
            )
            documents = loader.load()
            
            if not documents:
                return {
                    "success": False,
                    "message": "No documents found in repository",
                    "documents": 0,
                    "chunks": 0
                }
            
            logger.info(f"Loaded {len(documents)} documents")
            
            # Split into chunks
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=settings.CHUNK_SIZE,
                chunk_overlap=settings.CHUNK_OVERLAP,
                add_start_index=True,
                separators=["\nclass ", "\ndef ", "\n\n", "\n", " ", ""]
            )
            chunks = text_splitter.split_documents(documents)
            logger.info(f"Created {len(chunks)} chunks")
            
            # Create vector store
            self.vector_store = FAISS.from_documents(chunks, self.embeddings)
            self.vector_store.save_local(settings.FAISS_INDEX_PATH)
            
            return {
                "success": True,
                "message": "Repository ingested successfully",
                "repository": repo_name,
                "documents": len(documents),
                "chunks": len(chunks)
            }
            
        except Exception as e:
            logger.error(f"Ingestion failed: {e}")
            return {
                "success": False,
                "message": str(e),
                "documents": 0,
                "chunks": 0
            }
    
    def search(self, query: str, k: Optional[int] = None) -> list[dict]:
        """
        Search the vector store for relevant documents.
        
        Args:
            query: Search query
            k: Number of results (default from settings)
            
        Returns:
            List of relevant documents with metadata
        """
        if not self.vector_store:
            return []
        
        k = k or settings.RETRIEVAL_K
        docs = self.vector_store.similarity_search(query, k=k)
        
        results = []
        for doc in docs:
            results.append({
                "content": doc.page_content,
                "source": doc.metadata.get("source", "unknown"),
                "start_index": doc.metadata.get("start_index", 0)
            })
        
        return results
    
    def get_context(self, query: str) -> tuple[str, list[str]]:
        """
        Get context string and source files for a query.
        
        Args:
            query: User question
            
        Returns:
            Tuple of (context_string, list_of_source_files)
        """
        docs = self.search(query)
        
        if not docs:
            return "", []
        
        # Build context string
        context_parts = []
        sources = set()
        
        for doc in docs:
            source = doc["source"]
            sources.add(source)
            context_parts.append(f"--- File: {source} ---\n{doc['content']}")
        
        context = "\n\n".join(context_parts)
        
        # Truncate to context window
        if len(context) > settings.CONTEXT_WINDOW:
            context = context[:settings.CONTEXT_WINDOW] + "\n... [truncated]"
        
        return context, list(sources)
    
    def has_index(self) -> bool:
        """Check if an index is loaded."""
        return self.vector_store is not None
    
    def get_stats(self) -> dict:
        """Get index statistics."""
        if not self.vector_store:
            return {"indexed": False}
        
        return {
            "indexed": True,
            "index_path": settings.FAISS_INDEX_PATH
        }


# Singleton instance
rag_service = RAGService()
