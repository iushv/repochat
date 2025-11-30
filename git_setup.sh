#!/bin/bash
# Git setup commands for RepoChat

# Initialize git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: RepoChat - RAG-based code assistant

Features:
- Repository ingestion with FAISS vector search
- Multi-step reasoning agent with file reading
- Streamlit chat interface
- Source file tracking
- Hugging Face API integration"

echo "✅ Git repository initialized!"
echo ""
echo "Next steps:"
echo "1. Create a GitHub repository"
echo "2. Run: git remote add origin <your-repo-url>"
echo "3. Run: git push -u origin main"
