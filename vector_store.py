from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEndpointEmbeddings, HuggingFaceEmbeddings
import os
from dotenv import load_dotenv

load_dotenv()

# Configuration
FAISS_PATH = "faiss_index"
EMBEDDING_MODEL = "sentence-transformers/all-mpnet-base-v2"

def get_retriever(k=5):
    """
    Returns a retriever for the FAISS index with appropriate embeddings.
    Automatically detects if local or API embeddings were used during ingestion.
    """
    if not os.path.exists(FAISS_PATH):
        raise FileNotFoundError(f"FAISS index not found at {FAISS_PATH}. Please ingest a repository first.")
    
    # Check if we should use local embeddings
    # This is stored in a simple flag file when ingesting
    use_local = os.path.exists(os.path.join(FAISS_PATH, ".local_embeddings"))
    
    if use_local:
        embeddings = HuggingFaceEmbeddings(
            model_name=EMBEDDING_MODEL,
            model_kwargs={'device': 'cpu'}
        )
    else:
        api_key = os.getenv("HUGGINGFACEHUB_API_TOKEN")
        embeddings = HuggingFaceEndpointEmbeddings(
            huggingfacehub_api_token=api_key,
            model=EMBEDDING_MODEL
        )
    
    # Allow dangerous deserialization because we created the file ourselves
    vector_store = FAISS.load_local(FAISS_PATH, embeddings, allow_dangerous_deserialization=True)
    return vector_store.as_retriever(search_kwargs={"k": k})
