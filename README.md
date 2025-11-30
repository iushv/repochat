# RepoChat 🤖

A RAG-based agentic AI assistant that helps you understand and query code repositories using natural language.

## Features

- 🔍 **Intelligent Code Search**: Vector search using FAISS for finding relevant code
- 🤖 **AI Agent**: LLM-powered agent that answers questions about your codebase
- 📂 **Multi-Step Reasoning**: Automatically reads files when needed for complete context
- 💬 **Chat Interface**: Clean Streamlit UI for easy interaction
- 📊 **Source Tracking**: Shows which files were used to generate answers

## Tech Stack

- **LLM**: Hugging Face API (Zephyr 7B Beta)
- **Embeddings**: sentence-transformers/all-mpnet-base-v2
- **Vector Store**: FAISS
- **Framework**: LangChain
- **UI**: Streamlit

## Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd repo_chat
```

2. Create a virtual environment and install dependencies:
```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

3. Set up your Hugging Face API token:
```bash
# Create a .env file
echo "HUGGINGFACEHUB_API_TOKEN=your_token_here" > .env
```

Get your token from: https://huggingface.co/settings/tokens

## Usage

1. Start the Streamlit app:
```bash
streamlit run app.py
```

2. In the sidebar, enter a GitHub repository URL and click "Ingest Repository"

3. Wait for the ingestion to complete (1-2 minutes for small repos)

4. Start asking questions about the code!

### Example Questions

- "What does this repo do?"
- "How does the authentication work?"
- "Show me an example of the zero-shot-react agent"
- "Explain the main function"

## Project Structure

```
repo_chat/
├── app.py              # Streamlit UI
├── simple_agent.py     # Agent with multi-step reasoning
├── custom_llm.py       # Custom LLM wrapper for HF API
├── ingest.py           # Repository ingestion pipeline
├── vector_store.py     # FAISS vector store wrapper
├── requirements.txt    # Python dependencies
├── .env               # API keys (not in git)
└── .gitignore         # Git ignore rules
```

## How It Works

1. **Ingestion**: Clones the repo, chunks code files, generates embeddings, stores in FAISS
2. **Search**: When you ask a question, retrieves the 6 most relevant code chunks
3. **Reasoning**: Detects if full file reading is needed (keywords like "show me", "example")
4. **Answer**: LLM generates response with actual code snippets and explanations

## Features in Detail

### Multi-Step Reasoning
The agent automatically reads full files when:
- Question contains "show me", "example of", "complete", "full", or "entire"
- Additional context would improve answer quality

### Source Tracking
Each answer includes an expandable "📂 Source Files" section showing which files were used.

### Code-Aware Chunking
Uses LangChain's `RecursiveCharacterTextSplitter` with separators optimized for code:
- `\nclass ` - Python class definitions
- `\ndef ` - Python function definitions  
- `\n\n` - Paragraph breaks
- etc.

## Limitations

- **Free Tier API**: Uses Hugging Face's free Inference API (may have rate limits)
- **Model Size**: Zephyr 7B is smaller than GPT-4; answers may vary in quality
- **Context Window**: Limited to ~6KB of context (4KB search + 2KB file content)

## Future Improvements

- [ ] AST-based chunking for better code understanding
- [ ] Support for local LLMs (Ollama)
- [ ] Better response caching
- [ ] Support for multiple programming languages
- [ ] Repository comparison features

## License

MIT

## Author

Created as a portfolio project demonstrating RAG + Agentic AI capabilities.
