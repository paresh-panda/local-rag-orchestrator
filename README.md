# local-rag-orchestrator 🔍

An enterprise-grade, local-first Retrieval-Augmented Generation (RAG) pipeline designed for high-fidelity document analysis.



## Architectural Overview
The `local-rag-orchestrator` is designed to bridge the gap between private document repositories and local LLM inference. Unlike "script-style" implementations, this system prioritizes **state management** and **decoupled retrieval logic**.

### Key Principles
* **Persistent Indexing:** Uses `ChromaDB` for vector storage, eliminating redundant embedding cycles and ensuring data durability.
* **Separation of Concerns:** The engine logic is encapsulated in a class, facilitating easy integration into larger event-driven architectures.
* **Resilience:** Built with modular error handling to bypass system-protected directories and gracefully handle inference timeouts.
* **Efficiency:** Employs `RecursiveCharacterTextSplitter` to optimize for context coherence while respecting LLM token limits.

## Tech Stack
* **Language:** Python 3.11+
* **LLM Engine:** Ollama (Llama3/Mistral)
* **Vector Store:** ChromaDB
* **Embeddings:** Nomic Embed Text
* **Orchestration:** LangChain / LangChain Community

## Getting Started

### Prerequisites
1. **Ollama:** Ensure [Ollama](https://ollama.com/) is running locally.
2. **Models:** ```bash
   ollama pull llama3
   ollama pull nomic-embed-text
