import { useState } from "react";
import { askQuestion } from "../api";
import { useParams } from "react-router-dom";

export default function Chat() {
  const { docId } = useParams();
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    if (!question) return;
    setLoading(true);
    const q = question;
    setQuestion("");
    try {
      const res = await askQuestion(docId, q);
      setMessages(prev => [...prev, { q, a: res.data.answer }]);
    } catch (err) {
      alert("Something went wrong");
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 700, margin: "50px auto", fontFamily: "Arial" }}>
      <h2>Chat with PDF</h2>
      <div style={{ minHeight: 400, border: "1px solid #ddd", borderRadius: 8, padding: 15, marginBottom: 15 }}>
        {messages.length === 0 && <p style={{ color: "#999" }}>Ask a question about your PDF!</p>}
        {messages.map((msg, i) => (
          <div key={i} style={{ marginBottom: 15 }}>
            <p style={{ background: "#EEF2FF", padding: 10, borderRadius: 8 }}><strong>You:</strong> {msg.q}</p>
            <p style={{ background: "#F0FDF4", padding: 10, borderRadius: 8 }}><strong>AI:</strong> {msg.a}</p>
          </div>
        ))}
        {loading && <p style={{ color: "#999" }}>Thinking...</p>}
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <input value={question} onChange={e => setQuestion(e.target.value)}
          placeholder="Ask a question..."
          onKeyDown={e => e.key === "Enter" && handleAsk()}
          style={{ flex: 1, padding: 10, borderRadius: 5, border: "1px solid #ddd" }}
        />
        <button onClick={handleAsk} disabled={loading}
          style={{ padding: "10px 20px", background: "#4F46E5", color: "white", border: "none", borderRadius: 5 }}>
          Ask
        </button>
      </div>
    </div>
  );
}