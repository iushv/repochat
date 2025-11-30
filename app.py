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

st.title("🤖 RepoChat: Agentic Code Assistant")
st.markdown("Chat with your codebase using RAG + Agents.")

# Sidebar for Ingestion
with st.sidebar:
    st.header("📂 Repository Ingestion")
    repo_url = st.text_input("GitHub Repo URL", placeholder="https://github.com/username/repo")
    
    if st.button("Ingest Repository"):
        if repo_url:
            with st.spinner("Cloning and Indexing... (This may take a minute)"):
                # Capture stdout to show progress
                # This is a bit hacky but useful for the POC to show what's happening
                old_stdout = sys.stdout
                sys.stdout = mystdout = io.StringIO()
                
                try:
                    ingest_repo(repo_url)
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

    st.divider()
    st.info("Built with LangChain, FAISS, and Hugging Face.")

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
                result = simple_agent(prompt)
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
