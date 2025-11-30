import os
import shutil
import tempfile
from git import Repo
from langchain_community.document_loaders import DirectoryLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEndpointEmbeddings, HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from dotenv import load_dotenv

load_dotenv()

# Configuration
FAISS_PATH = "faiss_index"
EMBEDDING_MODEL = "sentence-transformers/all-mpnet-base-v2"

def ingest_repo(repo_url: str, use_local_embeddings: bool = False):
    """
    Ingests a GitHub repository into a FAISS vector store.
    
    Args:
        repo_url: GitHub repository URL
        use_local_embeddings: If True, use local sentence-transformers. 
                            If False, use Hugging Face API.
    """
    print(f"🚀 Starting ingestion for: {repo_url}")
    
    try:
        # 1. Clone Repo
        # Use a persistent directory so the agent can read files later
        repo_name = repo_url.split("/")[-1].replace(".git", "")
        repo_path = os.path.join("repo_data", repo_name)
        
        if os.path.exists(repo_path):
            print(f"🔄 Repo already exists at {repo_path}, pulling latest changes...")
            try:
                repo = Repo(repo_path)
                repo.remotes.origin.pull()
            except Exception as e:
                print(f"⚠️ Could not pull repo: {e}")
        else:
            print(f"⬇️ Cloning to {repo_path}...")
            Repo.clone_from(repo_url, repo_path)
        
        # 2. Load Documents
        print("📂 Loading files...")
        loader = DirectoryLoader(
            repo_path,
                glob="**/*",
                loader_cls=TextLoader,
                loader_kwargs={"autodetect_encoding": True},
                use_multithreading=True,
                show_progress=True,
                silent_errors=True # Skip files that can't be read
            )
        documents = loader.load()
        print(f"📄 Loaded {len(documents)} documents.")
        
        if not documents:
            print("⚠️ No documents found. Check the repo URL or content.")
            return

        # 3. Split Text (Chunking)
        print("✂️ Splitting code into chunks...")
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            add_start_index=True,
            separators=["\nclass ", "\ndef ", "\n\n", "\n", " ", ""] # Code-aware splitters
        )
        chunks = text_splitter.split_documents(documents)
        print(f"🧩 Created {len(chunks)} chunks.")

        # 4. Embed & Store
        print("💾 Indexing to FAISS...")
        
        # Choose embedding method
        if use_local_embeddings:
            print("🖥️  Using LOCAL embeddings (sentence-transformers)")
            embeddings = HuggingFaceEmbeddings(
                model_name=EMBEDDING_MODEL,
                model_kwargs={'device': 'cpu'}
            )
        else:
            print("☁️  Using Hugging Face API embeddings")
            api_key = os.getenv("HUGGINGFACEHUB_API_TOKEN")
            embeddings = HuggingFaceEndpointEmbeddings(
                huggingfacehub_api_token=api_key,
                model=EMBEDDING_MODEL
            )
        
        # Initialize FAISS
        vector_store = FAISS.from_documents(chunks, embeddings)
        vector_store.save_local(FAISS_PATH)
        
        # Save a flag to indicate which embedding method was used
        if use_local_embeddings:
            with open(os.path.join(FAISS_PATH, ".local_embeddings"), "w") as f:
                f.write("true")
        
        print(f"✅ Ingestion Complete! Database saved to {FAISS_PATH}")
            
    except Exception as e:
        print(f"❌ Error during ingestion: {e}")
    # No cleanup of repo_path needed as we want to persist it for the agent

if __name__ == "__main__":
    # Test with a small repo if run directly
    test_repo = "https://github.com/hwchase17/langchain-hub" # Example
    # ingest_repo(test_repo)
    print("Run this script by importing `ingest_repo` or uncommenting the test line.")
