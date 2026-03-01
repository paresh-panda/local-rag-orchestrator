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
  .empty-sub { font-size: 20px; max-width: 280px; line-height: 1.7; color: var(--muted); }
  .msg-row { display: flex; gap: 12px; align-items: flex-start; animation: fadeUp 0.3s ease; }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  .msg-row.user { flex-direction: row-reverse; }
  .avatar { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; font-weight: bold; color: white; }
  .avatar.user { background: linear-gradient(135deg, var(--accent), var(--accent2)); }
  .avatar.ai { background: var(--surface2); border: 1px solid var(--border); color: var(--muted); }
  .bubble { max-width: 72%; padding: 12px 16px; border-radius: 16px; font-size: 20px; line-height: 2.0; white-space: pre-wrap; word-break: break-word; }
  .bubble.user { background: var(--user-bubble); border: 1px solid #c8c8e8; border-top-right-radius: 4px; color: var(--text); }
  .bubble.ai { background: var(--ai-bubble); border: 1px solid var(--border); border-top-left-radius: 4px; color: var(--text); box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
  .typing { display: flex; gap: 5px; padding: 14px 18px; align-items: center; }
  .dot { width: 6px; height: 6px; background: var(--accent); border-radius: 50%; animation: bounce 1.2s infinite; }
  .dot:nth-child(2) { animation-delay: 0.2s; background: var(--muted); }
  .dot:nth-child(3) { animation-delay: 0.4s; background: var(--accent2); }
  @keyframes bounce { 0%, 80%, 100% { transform: translateY(0); opacity: 0.5; } 40% { transform: translateY(-6px); opacity: 1; } }
  .input-area { padding: 16px 0 20px; border-top: 1px solid var(--border); flex-shrink: 0; }
  .input-wrap { display: flex; gap: 10px; align-items: flex-end; background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 10px 10px 10px 16px; transition: border-color 0.2s; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
  .input-wrap:focus-within { border-color: var(--accent); }
  textarea { flex: 1; background: transparent; border: none; outline: none; resize: none; color: var(--text); font-family: Arial, sans-serif; font-size: 20px; line-height: 1.8; min-height: 24px; max-height: 140px; overflow-y: auto; }
  textarea::placeholder { color: var(--muted); }
  .send-btn { width: 36px; height: 36px; background: linear-gradient(135deg, var(--accent), var(--accent2)); border: none; border-radius: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: opacity 0.2s, transform 0.15s; font-size: 16px; color: white; }
  .send-btn:hover:not(:disabled) { transform: scale(1.06); }
  .send-btn:disabled { opacity: 0.35; cursor: not-allowed; }
  .hint { text-align: center; font-size: 15px; color: var(--muted); margin-top: 10px; }
  .error-msg { color: var(--accent2); font-size: 16px; padding: 8px 16px; background: rgba(224,90,122,0.08); border: 1px solid rgba(224,90,122,0.2); border-radius: 10px; margin-bottom: 8px; }
`;

const API_URL = "/api/chat";

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const messagesEndRef           = useRef(null);
  const textareaRef              = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const autoResize = (e) => {
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 140) + "px";
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setError("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    const newMessages = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setLoading(true);

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
      const data = await response.json();
      setMessages([...newMessages, { role: "assistant", content: data.answer || "No response." }]);
    } catch (err) {
      setError("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
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
          <button className="clear-btn" onClick={() => { setMessages([]); setError(""); }}>
            clear history
          </button>
        </div>

        <div className="messages">
          {messages.length === 0 && !loading ? (
            <div className="empty-state">
              <div className="empty-icon">◈</div>
              <div className="empty-title">Ask your documents</div>
              <div className="empty-sub">Questions are answered using your local RAG pipeline via Ollama</div>
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
          {loading && (
            <div className="msg-row">
              <div className="avatar ai">◈</div>
              <div className="bubble ai">
                <div className="typing">
                  <div className="dot" /><div className="dot" /><div className="dot" />
                </div>
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
              onKeyDown={handleKey}
              rows={1}
            />
            <button className="send-btn" onClick={sendMessage} disabled={!input.trim() || loading}>↑</button>
          </div>
          <div className="hint">Enter to send · Shift+Enter for new line</div>
        </div>
      </div>
    </>
  );
}
