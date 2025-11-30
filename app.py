import streamlit as st
import os
import sys

# Ensure the current directory is in the python path so imports work
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.append(current_dir)

from ingest import ingest_repo
from simple_agent import simple_agent
from langchain_core.messages import HumanMessage, AIMessage
import io

# Page Config
st.set_page_config(page_title="RepoChat - Private Code Onboarding", page_icon="🔒", layout="wide")

st.title("🔒 RepoChat - Privacy-First Code Onboarding")
st.markdown("**Understand any codebase through conversation** — Fully private by default, perfect for internal repos")

# Add helpful info box
with st.expander("💡 How to use RepoChat", expanded=False):
    st.markdown("""
    **Privacy-First by Default:**
    - RepoChat runs in **fully private mode** by default
    - All processing happens on your machine
    - Perfect for proprietary/internal codebases
    
    **For Teams & Organizations:**
    - Ingest your **private/internal repositories** (works with any Git URL)
    - New developers can ask questions and get instant answers
    - No code leaves your infrastructure
    
    **Sample Questions:**
    - "What does this codebase do?"
    - "How is authentication implemented?"
    - "Show me an example of how to add a new feature"
    - "Explain the database schema"
    - "Where is the API endpoint for user login?"
    
    **Setup Required for Privacy Mode:**
    - Install and run LM Studio (localhost:1234)
    - First run will download embedding model (~400MB)
    
    **To use Cloud APIs instead:** Disable Privacy Mode in settings
    """)

st.divider()

# Sidebar - Repository Ingestion
with st.sidebar:
    st.header("📚 Repository Setup")
    st.markdown("**Onboard to any codebase** — Works with public repos or private internal code")
    
    st.divider()
    # Repository URL input
    st.subheader("1. Repository URL")
    repo_url = st.text_input(
        "GitHub URL",
        placeholder="https://github.com/username/repo",
        help="Works with public repos or private repos (if you have access)"
    )
    
    if st.button("Ingest Repository"):
        if repo_url:
            with st.spinner("Ingesting repository..."):
                # Capture stdout for logs
                sys.stdout = mystdout = io.StringIO()
                
                try:
                    result = ingest_repo(
                        repo_url,
                        use_local_embeddings=st.session_state.get("use_local_embeddings", False)
                    )
                    output = mystdout.getvalue()
                    
                    if result and result.get("success"):
                        st.success(f"✅ Ingestion Complete! Indexed {result['documents']} files into {result['chunks']} chunks.")
                    else:
                        st.error(f"❌ Ingestion Failed: {result.get('message', 'Unknown error')}")
                    
                    with st.expander("View Logs"):
                        st.code(output)
                except Exception as e: # Keep the exception handling for unexpected errors
                    st.error(f"An unexpected error occurred during ingestion: {e}")
                finally:
                    sys.stdout = sys.__stdout__
        else:
            st.warning("Please enter a URL.")

    # Privacy Mode - Single Toggle
    st.header("🔒 Privacy Mode")
    st.caption("**Default: Fully Private** — All processing happens on your machine")
    
    privacy_mode = st.toggle(
        "Enable Privacy Mode (Recommended)",
        value=True,  # Default to ON
        help="When enabled: Uses local embeddings + local LLM. No data sent to external APIs. Requires LM Studio running on localhost:1234"
    )
    
    # Store in session state
    if "privacy_mode" not in st.session_state:
        st.session_state.privacy_mode = True
    st.session_state.privacy_mode = privacy_mode
    
    # Automatically set embedding and LLM preferences based on privacy mode
    st.session_state.use_local_embeddings = privacy_mode
    st.session_state.use_local_llm = privacy_mode
    
    # Show current mode
    if privacy_mode:
        st.success("✅ **Fully Private Mode Active**")
        st.markdown("""
        - ✅ Embeddings: Local (sentence-transformers)
        - ✅ LLM: Local (LM Studio required)
        - ✅ No external API calls
        - ✅ Code stays on your infrastructure
        """)
        st.warning("⚠️ **Requirement**: LM Studio must be running on `localhost:1234`")
    else:
        st.info("☁️ **Cloud API Mode Active**")
        st.markdown("""
        - ☁️ Embeddings: Hugging Face API
        - ☁️ LLM: Hugging Face API
        - ⚠️ Requires `HUGGINGFACEHUB_API_TOKEN` in .env
        - ⚠️ Subject to rate limits
        """)
    
    st.divider()
    st.info("🏢 **For Organizations:** Privacy Mode is enabled by default to keep your proprietary code secure.")

# Chat Interface
if "messages" not in st.session_state:
    st.session_state.messages = []

# Display chat messages
for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])
        
        # Show sources for assistant messages
        if message["role"] == "assistant" and "sources" in message and message["sources"]:
            with st.expander("📂 Source Files"):
                for source in message["sources"]:
                    st.code(source, language="text")

# Chat input
if prompt := st.chat_input("Ask about the codebase..."):
    # Add user message
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)
    
    # Generate response using simple agent
    with st.chat_message("assistant"):
        with st.spinner("🤔 Thinking..."):
            try:
                result = simple_agent(
                    prompt, 
                    use_local_llm=st.session_state.get("use_local_llm", False)
                )
                answer = result["answer"]
                sources = result["sources"]
                
                # Display answer
                st.markdown(answer)
                
                # Display sources in expandable section
                if sources:
                    with st.expander("📂 Source Files"):
                        for source in sources:
                            # Extract just the filename for cleaner display
                            filename = source.split('/')[-1] if '/' in source else source
                            st.code(source, language="text")
                
                # Store in history
                st.session_state.messages.append({
                    "role": "assistant", 
                    "content": answer,
                    "sources": sources
                })
            
            except FileNotFoundError:
                st.info("👈 Please ingest a repository first using the sidebar.")
            except Exception as e:
                st.error(f"An error occurred: {e}")
