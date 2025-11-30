import os
from custom_llm import CustomHFLLM
from vector_store import get_retriever
from dotenv import load_dotenv

load_dotenv()

def search_codebase(query: str) -> str:
    """Searches the codebase for relevant code snippets using RAG."""
    retriever = get_retriever()
    docs = retriever.invoke(query)
    result = "\n\n".join([f"--- Source: {d.metadata.get('source', 'Unknown')} ---\n{d.page_content}" for d in docs])
    return result if result else "No relevant code found."

def read_file(file_path: str) -> str:
    """Reads the full content of a specific file."""
    if ".." in file_path or file_path.startswith("/"):
        return "Error: Invalid file path. Please use relative paths."
    
    base_path = "repo_data"
    full_path = os.path.join(base_path, file_path)
    
    if not os.path.exists(full_path):
        found = False
        for root, dirs, files in os.walk(base_path):
            if file_path in files:
                full_path = os.path.join(root, file_path)
                found = True
                break
        if not found:
             return f"Error: File {file_path} not found in {base_path}."

    try:
        with open(full_path, "r") as f:
            return f.read()
    except Exception as e:
        return f"Error reading file: {e}"

def simple_agent(question: str, debug: bool = False, use_local_llm: bool = False) -> dict:
    """
    Simple agent that searches the codebase and answers questions.
    Uses multi-step reasoning: search -> read files if needed -> answer.
    Returns both answer and source information.
    
    Args:
        question: The question to answer
        debug: Enable debug output
        use_local_llm: If True, use LM Studio local LLM. If False, use HF API.
    """
    # Initialize LLM based on preference
    if use_local_llm:
        from local_llm import LocalLLM
        if debug:
            print("🖥️  Using LOCAL LLM (LM Studio)")
        llm = LocalLLM()
    else:
        from custom_llm import CustomHFLLM
        if debug:
            print("☁️  Using Hugging Face API")
        api_key = os.getenv("HUGGINGFACEHUB_API_TOKEN")
        llm = CustomHFLLM(
            repo_id="HuggingFaceH4/zephyr-7b-beta",
            token=api_key
        )
    
    # Step 1: Search for relevant code
    print(f"🔍 Searching codebase for: {question}")
    retriever = get_retriever()
    retriever.search_kwargs = {"k": 10}  # Increased from 6 to get more context
    docs = retriever.invoke(question)
    
    # Extract source files
    sources = list(set([d.metadata.get('source', 'Unknown') for d in docs]))
    
    # Format search results
    search_results = "\n\n".join([
        f"--- File: {d.metadata.get('source', 'Unknown')} ---\n{d.page_content}" 
        for d in docs
    ])
    
    if debug:
        print(f"\n📄 Found {len(docs)} relevant code snippets from {len(sources)} files")
    
    # Step 2: Check if we should read a full file for more context
    # Keywords that suggest we need complete file content
    full_file_keywords = ["show me", "example of", "complete", "full", "entire"]
    should_read_file = any(keyword in question.lower() for keyword in full_file_keywords)
    
    additional_context = ""
    if should_read_file and sources:
        # Read the most relevant file (first in sources)
        most_relevant = sources[0]
        if debug:
            print(f"� Reading full file for more detail: {most_relevant}")
        
        try:
            # Extract relative path from source
            if "repo_data/" in most_relevant:
                relative_path = most_relevant.split("repo_data/", 1)[1]
                file_content = read_file(relative_path)
                
                if not file_content.startswith("Error"):
                    additional_context = f"\n\nFull content of {most_relevant}:\n{file_content[:2000]}"
                    if debug:
                        print(f"✅ Successfully read {len(file_content)} characters")
        except Exception as e:
            if debug:
                print(f"⚠️ Could not read file: {e}")
    
    # Step 3: Enhanced prompt with few-shot example
    prompt = f"""You are analyzing a code repository. Your job is to answer the USER'S QUESTION using code from the repository.

CRITICAL: Answer the question that was ACTUALLY ASKED. Do not answer different questions you see in the code.

EXAMPLE:
User Question: How does the authentication work?
Answer: The authentication uses JWT tokens. Here's the implementation:

```python
def authenticate(token):
    decoded = jwt.decode(token, SECRET_KEY)
    return User.get(decoded['user_id'])
```

The `authenticate` function decodes the JWT token and retrieves the user from the database.

---

USER'S QUESTION (answer THIS, not other questions): {question}

Code from the repository:
{search_results[:6000]}{additional_context}

INSTRUCTIONS:
1. READ THE USER'S QUESTION CAREFULLY
2. Answer ONLY what they asked - don't answer other questions you see in the code
3. Show actual code snippets using markdown code blocks (```language)
4. Include file names when showing code
5. Explain what the code does
6. Be specific and reference actual function/class names
7. If you see JSON/YAML configs, show them in code blocks too

YOUR ANSWER TO "{question}":"""
    
    if debug:
        print("\n💭 Generating answer...")
    
    # Step 4: Generate answer
    answer = llm.invoke(prompt)
    
    # Return both answer and sources
    return {
        "answer": answer,
        "sources": sources[:5]  # Limit to top 5 sources
    }
