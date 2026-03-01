import os
import ollama
from typing import Optional
from langchain_community.document_loaders import PyPDFLoader
from langchain_community.vectorstores import Chroma
from langchain_ollama import OllamaEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma

# Configuration: Points to the container or local host
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
DEBUG = os.getenv("DEBUG", "False").lower() == "true"

class PDFInsightsEngine:
    def __init__(self, model_name: str = "llama3", db_path: str = "./db"):
        self.model_name = model_name
        self.db_path = db_path
        
        # Point embeddings to the Ollama service
        self.embeddings = OllamaEmbeddings(
            model="nomic-embed-text", 
            base_url=OLLAMA_HOST
        )
        
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000, 
            chunk_overlap=100
        )

    def ingest_pdf(self, file_path: str) -> None:
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")

        loader = PyPDFLoader(file_path)
        docs = loader.load()
        chunks = self.text_splitter.split_documents(docs)
        
        Chroma.from_documents(
            documents=chunks, 
            embedding=self.embeddings, 
            persist_directory=self.db_path
        )
        print(f"--- Indexed {len(chunks)} chunks ---")

    def query(self, question: str) -> str:
        # Use an explicit client for container networking
        client = ollama.Client(host=OLLAMA_HOST)
        
        db = Chroma(persist_directory=self.db_path, embedding_function=self.embeddings)
        relevant_docs = db.similarity_search(question, k=3)
        if DEBUG:
            print("\n--- [DEBUG] Context retrieved ---")
            for doc in relevant_docs:
                print(f"Content: {doc.page_content[:100]}...")

        context = "\n\n".join([doc.page_content for doc in relevant_docs])

        response = client.chat(model=self.model_name, messages=[
            {
                'role': 'system', 
                'content': f"You are a helpful assistant. Use ONLY the following context to answer: {context}"
            },
            {'role': 'user', 'content': question}
        ])
        """
        # Note: The system prompt explicitly instructs the model to rely solely on the provided context.
        response = client.chat(model=self.model_name, messages=[
            {
                'role': 'system', 
                'content': (
                    "You are a helpful assistant. Use ONLY the provided context to answer the user's question. "
                    "If the answer cannot be found in the context, explicitly state: 'I cannot answer this based on the provided document.'"
                )
            },
            {'role': 'user', 'content': question}
        ])
        """
        return response['message']['content']