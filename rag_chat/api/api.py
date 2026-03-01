"""
rag_chat/api/api.py
FastAPI layer — src/ and db/ are mounted in from the pdf-engine volume,
so this container shares the exact same RAG code and vector DB.
"""

import os
import sys

# src/ is mounted at /app/src via docker-compose volume
sys.path.insert(0, "/app/src")

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import httpx

app = FastAPI(title="PDF Insights API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://frontend:80"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Plug in your RAG chain ────────────────────────────────────────────
# Because src/ is mounted from the host, you can import directly:
#
# OPTION A — LangChain:
# from your_rag_module import rag_chain
# def get_answer(question, history):
#     result = rag_chain.invoke({
#         "question": question,
#         "chat_history": [(m.role, m.content) for m in history],
#     })
#     return result["answer"]
#
# OPTION B — LlamaIndex:
# from your_rag_module import query_engine
# def get_answer(question, history):
#     return str(query_engine.query(question))
#
# OPTION C — Raw Ollama (default, works out of the box):

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://ollama:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3")

async def get_answer(question: str, history: list) -> str:
    messages = [{"role": m.role, "content": m.content} for m in history]
    messages.append({"role": "user", "content": question})
    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.post(
            f"{OLLAMA_HOST}/api/chat",
            json={"model": OLLAMA_MODEL, "messages": messages, "stream": False},
        )
        resp.raise_for_status()
        return resp.json()["message"]["content"]

# ── Models ────────────────────────────────────────────────────────────

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]

class ChatResponse(BaseModel):
    answer: str

# ── Routes ────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    if not req.messages:
        raise HTTPException(status_code=400, detail="No messages provided")
    try:
        answer = await get_answer(req.messages[-1].content, req.messages[:-1])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return ChatResponse(answer=answer)
