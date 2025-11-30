from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEndpointEmbeddings
import os
from dotenv import load_dotenv

load_dotenv()

# Configuration
FAISS_PATH = "faiss_index"
EMBEDDING_MODEL = "sentence-transformers/all-mpnet-base-v2"

def get_vector_store():
    """
    Returns the FAISS vector store instance.
    """
    api_key = os.getenv("HUGGINGFACEHUB_API_TOKEN")
    embeddings = HuggingFaceEndpointEmbeddings(
        huggingfacehub_api_token=api_key,
        model=EMBEDDING_MODEL
    )
    
    if not os.path.exists(FAISS_PATH):
        # If no index exists, we can't load it. 
        # In a real app, we might return None or raise an error.
        print("⚠️ No FAISS index found. Please run ingestion first.")
        return None

    # Allow dangerous deserialization because we created the file ourselves
    vector_store = FAISS.load_local(FAISS_PATH, embeddings, allow_dangerous_deserialization=True)
    return vector_store

def get_retriever(k=5):
    """
    Returns a retriever object for the vector store.
    """
    vector_store = get_vector_store()
    if vector_store:
        return vector_store.as_retriever(search_kwargs={"k": k})
    return None
