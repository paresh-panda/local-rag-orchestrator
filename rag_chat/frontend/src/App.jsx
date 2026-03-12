import { useState, useRef, useEffect } from "react";

const STYLES = `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
:root {
  --bg: #f5f5f0; --surface: #ffffff; --surface2: #eaeae4;
  --border: #d8d8d0; --accent: #4a47a3; --accent2: #e05a7a;
  --text: #1a1a1a; --muted: #888880;
  --user-bubble: #e8e8f5; --ai-bubble: #ffffff;
}
body { background: var(--bg); color: var(--text); font-family: Arial, sans-serif; height: 100vh; display: flex; flex-direction: column; overflow: hidden; }
.app { display: flex; flex-direction: column; height: 100vh; max-width: 860px; margin: 0 auto; width: 100%; padding: 0 16px; }
.header { display: flex; align-items: center; justify-content: space-between; padding: 20px 0 16px; border-bottom: 1px solid var(--border); flex-shrink: 0; }
.header-left { display: flex; align-items: center; gap: 12px; }
.logo { width: 36px; height: 36px; background: linear-gradient(135deg, var(--accent), var(--accent2)); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; }
.title { font-family: Arial, sans-serif; font-weight: 800; font-size: 30px; letter-spacing: -0.5px; color: var(--text); }
.subtitle { font-size: 16px; color: var(--muted); margin-top: 1px; }
.clear-btn { background: transparent; border: 1px solid var(--border); color: var(--muted); padding: 6px 14px; border-radius: 8px; font-family: Arial, sans-serif; font-size: 16px; cursor: pointer; transition: all 0.2s; }
.clear-btn:hover { border-color: var(--accent2); color: var(--accent2); }
.messages { flex: 1; overflow-y: auto; padding: 24px 0; display: flex; flex-direction: column; gap: 20px; scroll-behavior: smooth; }
.messages::-webkit-scrollbar { width: 4px; }
.messages::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
.empty-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; color: var(--muted); text-align: center; }
.empty-icon { font-size: 48px; opacity: 0.3; }
.empty-title { font-family: Arial, sans-serif; font-weight: 700; font-size: 32px; color: var(--text); opacity: 0.4; }
.empty-sub { font-size: 20px; max-width: 300px; line-height: 1.7; color: var(--muted); }
.msg-row { display: flex; gap: 12px; align-items: flex-start; animation: fadeUp 0.3s ease; }
@keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.msg-row.user { flex-direction: row-reverse; }
.avatar { width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 15px; flex-shrink: 0; font-weight: bold; color: white; }
.avatar.user { background: linear-gradient(135deg, var(--accent), var(--accent2)); }
.avatar.ai { background: var(--surface2); border: 1px solid var(--border); color: var(--muted); }
.bubble { max-width: 72%; padding: 14px 18px; border-radius: 16px; font-size: 20px; line-height: 2.0; white-space: pre-wrap; word-break: break-word; }
.bubble.user { background: var(--user-bubble); border: 1px solid #c8c8e8; border-top-right-radius: 4px; }
.bubble.ai { background: var(--ai-bubble); border: 1px solid var(--border); border-top-left-radius: 4px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
.cursor { display: inline-block; width: 3px; height: 1em; background: var(--accent); margin-left: 2px; vertical-align: text-bottom; border-radius: 1px; animation: blink 0.6s ease-in-out infinite; }
@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
.thinking-dots { display: flex; gap: 6px; align-items: center; padding: 4px 0; }
.tdot { width: 8px; height: 8px; border-radius: 50%; animation: tdot 1.4s infinite ease-in-out; }
.tdot:nth-child(1){ background: var(--accent); animation-delay: 0s; }
.tdot:nth-child(2){ background: var(--muted); animation-delay: 0.2s; }
.tdot:nth-child(3){ background: var(--accent2); animation-delay: 0.4s; }
@keyframes tdot { 0%,80%,100%{transform:scale(0.7);opacity:0.4} 40%{transform:scale(1.1);opacity:1} }
.input-area { padding: 16px 0 20px; border-top: 1px solid var(--border); flex-shrink: 0; }
.input-wrap { display: flex; gap: 10px; align-items: flex-end; background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 10px 10px 10px 16px; transition: border-color 0.2s; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
.input-wrap:focus-within { border-color: var(--accent); }
textarea { flex: 1; background: transparent; border: none; outline: none; resize: none; color: var(--text); font-family: Arial, sans-serif; font-size: 20px; line-height: 1.8; min-height: 28px; max-height: 140px; overflow-y: auto; }
textarea::placeholder { color: var(--muted); }
.send-btn { width: 38px; height: 38px; background: linear-gradient(135deg, var(--accent), var(--accent2)); border: none; border-radius: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: transform 0.15s; font-size: 18px; color: white; }
.send-btn:hover:not(:disabled) { transform: scale(1.06); }
.send-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.hint { text-align: center; font-size: 15px; color: var(--muted); margin-top: 10px; }
.error-msg { color: var(--accent2); font-size: 16px; padding: 8px 16px; background: rgba(224,90,122,0.08); border: 1px solid rgba(224,90,122,0.2); border-radius: 10px; margin-bottom: 8px; }
`;

const API_URL = "/api/chat";
const CHAR_DELAY = 16;

export default function App() {
  const [messages, setMessages] = useState([]);
  const [liveText, setLiveText] = useState("");
  const [phase, setPhase]       = useState("idle"); // idle | thinking | typing
  const [input, setInput]       = useState("");
  const [error, setError]       = useState("");

  const messagesEndRef = useRef(null);
  const textareaRef    = useRef(null);
  const queueRef       = useRef([]);       // chars waiting to be printed
  const liveRef        = useRef("");       // accumulated printed text
  const timerRef       = useRef(null);
  const lineBufferRef  = useRef("");       // handles partial SSE lines across chunks
  const doneRef        = useRef(false);    // stream fully received

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, liveText, phase]);

  const stopAll = () => {
    clearInterval(timerRef.current);
    timerRef.current   = null;
    queueRef.current   = [];
    liveRef.current    = "";
    lineBufferRef.current = "";
    doneRef.current    = false;
  };

  // Drip one char per tick; finalise when queue empty + stream done
  const startTypewriter = () => {
    if (timerRef.current) return;
    timerRef.current = setInterval(() => {
      if (queueRef.current.length > 0) {
        liveRef.current += queueRef.current.shift();
        setLiveText(liveRef.current);
      } else if (doneRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
        const final = liveRef.current;
        liveRef.current = "";
        doneRef.current = false;
        setLiveText("");
        setPhase("idle");
        setMessages(prev => [...prev, { role: "assistant", content: final }]);
      }
    }, CHAR_DELAY);
  };

  // Parse a complete SSE line
  const handleSSELine = (line, onFirstToken) => {
    if (!line.startsWith("data: ")) return;
    const payload = line.slice(6).trim();
    if (payload === "[DONE]") {
      doneRef.current = true;
      return;
    }
    try {
      const parsed = JSON.parse(payload);
      if (parsed.error) throw new Error(parsed.error);
      const token = parsed.token || "";
      if (token) {
        onFirstToken();
        for (const ch of token) queueRef.current.push(ch);
      }
    } catch (e) {
      if (parsed?.error) throw e;
    }
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || phase !== "idle") return;

    setInput("");
    setError("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    const newMessages = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setPhase("thinking");
    stopAll();

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || `HTTP ${response.status}`);
      }

      const reader    = response.body.getReader();
      const decoder   = new TextDecoder();
      let firstToken  = true;

      const onFirstToken = () => {
        if (!firstToken) return;
        firstToken = false;
        setPhase("typing");
        startTypewriter();
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Append new data to line buffer and split on newlines
        lineBufferRef.current += decoder.decode(value, { stream: true });
        const lines = lineBufferRef.current.split("\n");

        // Last element may be an incomplete line — keep it in the buffer
        lineBufferRef.current = lines.pop();

        for (const line of lines) {
          if (line.trim()) handleSSELine(line, onFirstToken);
        }
      }

      // Process any remaining buffered content
      if (lineBufferRef.current.trim()) {
        handleSSELine(lineBufferRef.current, onFirstToken);
        lineBufferRef.current = "";
      }

      // Mark done so typewriter can finalise
      doneRef.current = true;
      // If we never got a first token (empty response), clean up
      if (firstToken) {
        setPhase("idle");
      } else {
        startTypewriter(); // ensure timer is running to flush remaining queue
      }

    } catch (err) {
      stopAll();
      setPhase("idle");
      setError("Error: " + err.message);
    }
  };

  const handleClear = () => {
    stopAll();
    setPhase("idle");
    setMessages([]);
    setError("");
  };

  const autoResize = (e) => {
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 140) + "px";
  };

  return (
    <>
    <style>{STYLES}</style>
    <div className="app">

    <div className="header">
    <div className="header-left">
    <div className="logo">◈</div>
    <div>
    <div className="title">PDF Insights</div>
    <div className="subtitle">rag · ollama · local</div>
    </div>
    </div>
    <button className="clear-btn" onClick={handleClear}>clear history</button>
    </div>

    <div className="messages">
    {messages.length === 0 && phase === "idle" ? (
      <div className="empty-state">
      <div className="empty-icon">◈</div>
      <div className="empty-title">Ask your documents</div>
      <div className="empty-sub">Answered by your local RAG pipeline via Ollama</div>
      </div>
    ) : (
      messages.map((msg, i) => (
        <div key={i} className={`msg-row ${msg.role === "user" ? "user" : ""}`}>
        <div className={`avatar ${msg.role === "user" ? "user" : "ai"}`}>
        {msg.role === "user" ? "U" : "◈"}
        </div>
        <div className={`bubble ${msg.role === "user" ? "user" : "ai"}`}>
        {msg.content}
        </div>
        </div>
      ))
    )}

    {phase === "thinking" && (
      <div className="msg-row">
      <div className="avatar ai">◈</div>
      <div className="bubble ai">
      <div className="thinking-dots">
      <div className="tdot"/><div className="tdot"/><div className="tdot"/>
      </div>
      </div>
      </div>
    )}

    {phase === "typing" && (
      <div className="msg-row">
      <div className="avatar ai">◈</div>
      <div className="bubble ai">
      {liveText}<span className="cursor"/>
      </div>
      </div>
    )}

    <div ref={messagesEndRef} />
    </div>

    <div className="input-area">
    {error && <div className="error-msg">{error}</div>}
    <div className="input-wrap">
    <textarea
    ref={textareaRef}
    placeholder="Ask about your documents..."
    value={input}
    onChange={(e) => { setInput(e.target.value); autoResize(e); }}
    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }}}
    rows={1}
    />
    <button
    className="send-btn"
    onClick={sendMessage}
    disabled={!input.trim() || phase !== "idle"}
    >↑</button>
    </div>
    <div className="hint">Enter to send · Shift+Enter for new line</div>
    </div>

    </div>
    </>
  );
}
