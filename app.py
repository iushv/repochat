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
st.set_page_config(page_title="RepoChat", page_icon="🤖", layout="wide")

st.title("💬 RepoChat - AI-Powered Code Onboarding")
st.markdown("**Understand any codebase through conversation** — Perfect for onboarding to internal repos, legacy code, or open-source projects")

# Add helpful info box
with st.expander("💡 How to use RepoChat", expanded=False):
    st.markdown("""
    **For Teams & Organizations:**
    - Ingest your **private/internal repositories** (works with any Git URL)
    - Enable **Local mode** to keep proprietary code completely offline
    - New developers can ask questions and get instant answers
    
    **Sample Questions:**
    - "What does this codebase do?"
    - "How is authentication implemented?"
    - "Show me an example of how to add a new feature"
    - "Explain the database schema"
    - "Where is the API endpoint for user login?"
    
    **Privacy Note:** Use local embeddings + local LLM for complete data privacy.
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
            with st.spinner("Cloning and Indexing... (This may take a minute)"):
                # Capture stdout to show progress
                # This is a bit hacky but useful for the POC to show what's happening
                old_stdout = sys.stdout
                sys.stdout = mystdout = io.StringIO()
                
                try:
                    ingest_repo(
                        repo_url,
                        use_local_embeddings=st.session_state.get("use_local_embeddings", False)
                    )
                    output = mystdout.getvalue()
                    st.success("Ingestion Complete!")
                    with st.expander("View Logs"):
                        st.code(output)
                except Exception as e:
                    st.error(f"Error: {e}")
                finally:
                    sys.stdout = old_stdout
        else:
            st.warning("Please enter a URL.")

    # LLM Selection
    st.header("⚙️ Privacy & Settings")
    st.caption("💡 Enable local mode for complete data privacy with internal/proprietary code")
    
    st.subheader("2. Embedding Mode")
    use_local_embed = st.checkbox(
        "🔒 Use Local Embeddings (Private)",
        value=False,
        help="Runs on your machine - code never leaves your infrastructure"
    )
    
    if "use_local_embeddings" not in st.session_state:
        st.session_state.use_local_embeddings = False
    st.session_state.use_local_embeddings = use_local_embed
    
    st.divider()
    
    st.subheader("3. LLM Mode")
    
    # LLM Selection
    use_local = st.checkbox(
        "🔒 Use Local LLM (Private)", 
        value=False,
        help="LM Studio on localhost - responses stay completely private"
    )
    
    if use_local:
        st.info("🖥️ Using local LLM via LM Studio")
        st.caption("Make sure LM Studio is running with a model loaded!")
    else:
        st.info("☁️ Using Hugging Face API (Zephyr 7B)")
    
    # Store in session state
    if "use_local_llm" not in st.session_state:
        st.session_state.use_local_llm = False
    st.session_state.use_local_llm = use_local
    
    st.divider()
    st.info("🏢 **For Organizations:** Use fully local mode to onboard developers to private repos while keeping code secure and offline.")

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
