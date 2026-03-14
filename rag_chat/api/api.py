"""
rag_chat/api/api.py
Uses similarity score threshold to reject off-topic questions before they reach Ollama.
"""

import os
import sys
import json
import httpx

sys.path.insert(0, "/app/src")

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List

from langchain_community.vectorstores import Chroma
from langchain_ollama import OllamaEmbeddings

app = FastAPI(title="PDF Insights API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

OLLAMA_HOST       = os.getenv("OLLAMA_HOST",  "http://ollama:11434")
OLLAMA_MODEL      = os.getenv("OLLAMA_MODEL", "llama3")
CHROMA_DIR        = os.getenv("CHROMA_DIR",   "/app/db")

# Similarity threshold: 0.0 = identical, 2.0 = completely unrelated
# Chunks with distance ABOVE this are considered irrelevant
# Start at 0.8 — lower it (e.g. 0.6) to be stricter, raise it to be more lenient
RELEVANCE_CUTOFF  = float(os.getenv("RELEVANCE_CUTOFF", "0.8"))
TOP_K             = int(os.getenv("TOP_K", "3"))

print(f"[startup] Loading ChromaDB from {CHROMA_DIR}...")
embeddings  = OllamaEmbeddings(model="nomic-embed-text", base_url=OLLAMA_HOST)
vectorstore = Chroma(persist_directory=CHROMA_DIR, embedding_function=embeddings)
print(f"[startup] ChromaDB ready — {vectorstore._collection.count()} chunks indexed.")


class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]


@app.get("/health")
def health():
    return {"status": "ok", "indexed_chunks": vectorstore._collection.count()}


@app.post("/chat")
async def chat(req: ChatRequest):
    if not req.messages:
        raise HTTPException(status_code=400, detail="No messages provided")

    question = req.messages[-1].content

    # Step 1 — Retrieve chunks WITH similarity scores
    # Returns list of (Document, distance) — lower distance = more relevant
    results = vectorstore.similarity_search_with_relevance_scores(question, k=TOP_K)

    print(f"[retrieval] Query: '{question}'")
    for doc, score in results:
        print(f"[retrieval]   score={score:.3f} | {doc.page_content[:80]}...")

    # Step 2 — Filter out chunks below relevance threshold
    relevant = [(doc, score) for doc, score in results if score >= RELEVANCE_CUTOFF]

    async def out_of_scope_stream():
        msg = "I can only answer questions based on the ingested documents. This question does not appear to be covered in them."
        yield f"data: {json.dumps({'token': msg})}\n\n"
        yield "data: [DONE]\n\n"

    if not relevant:
        print(f"[retrieval] All scores below cutoff {RELEVANCE_CUTOFF} — rejecting query.")
        return StreamingResponse(
            out_of_scope_stream(),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
        )

    # Step 3 — Build context from relevant chunks only
    context = "\n\n---\n\n".join(doc.page_content for doc, _ in relevant)
    print(f"[retrieval] Using {len(relevant)} relevant chunks.")

    history  = [{"role": m.role, "content": m.content} for m in req.messages[:-1]]
    messages = [
        {
            "role": "system",
            "content": (
                "You are a document assistant. Answer using ONLY the context below. "
                "Do NOT use any outside knowledge. "
                "If the context does not contain enough information, say exactly: "
                "'I cannot answer this based on the provided documents.'\n\n"
                f"CONTEXT:\n{context}"
            ),
        },
        *history,
        {"role": "user", "content": question},
    ]

    # Step 4 — Stream from Ollama
    async def stream():
        try:
            async with httpx.AsyncClient(timeout=120) as client:
                async with client.stream(
                    "POST",
                    f"{OLLAMA_HOST}/api/chat",
                    json={"model": OLLAMA_MODEL, "messages": messages, "stream": True},
                ) as response:
                    async for line in response.aiter_lines():
                        if not line.strip():
                            continue
                        try:
                            chunk = json.loads(line)
                            token = chunk.get("message", {}).get("content", "")
                            if token:
                                yield f"data: {json.dumps({'token': token})}\n\n"
                            if chunk.get("done", False):
                                yield "data: [DONE]\n\n"
                                return
                        except json.JSONDecodeError:
                            continue
        except Exception as e:
            yield f"data: {json.dumps({'token': f'[Error: {str(e)}]'})}\n\n"
            yield "data: [DONE]\n\n"

    return StreamingResponse(
        stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )