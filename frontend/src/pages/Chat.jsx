import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import api from '../api'

export default function Chat() {
  const { docId } = useParams()
  const [searchParams] = useSearchParams()
  const docName = searchParams.get('name') || 'Document'
  const [messages, setMessages] = useState([])
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const bottomRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    loadHistory()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadHistory = async () => {
    try {
      const res = await api.get(`/history/${docId}`)
      const historyMessages = []
      res.data.history.forEach(item => {
        historyMessages.push({ role: 'user', text: item.question })
        historyMessages.push({ role: 'ai', text: item.answer })
      })
      setMessages(historyMessages)
    } catch (err) {
      console.error(err)
    }
    setLoadingHistory(false)
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!question.trim()) return

    const userMsg = { role: 'user', text: question }
    setMessages(prev => [...prev, userMsg])
    setQuestion('')
    setLoading(true)

    try {
      const res = await api.post('/chat', {
        doc_id: docId,
        question: question
      })
      setMessages(prev => [...prev, { role: 'ai', text: res.data.answer }])
    } catch (err) {
      if (err.response?.status === 429) {
        setMessages(prev => [...prev, {
          role: 'ai',
          text: 'Too many questions! Please wait a minute before asking again.'
        }])
      } else {
        setMessages(prev => [...prev, {
          role: 'ai',
          text: 'Something went wrong. Please try again.'
        }])
      }
    }
    setLoading(false)
  }

  if (loadingHistory) {
    return (
      <div style={styles.loading}>
        <p>Loading conversation history...</p>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <button onClick={() => navigate('/dashboard')} style={styles.backBtn}>
          ← Back
        </button>
        <div style={styles.docName}>📑 {docName}</div>
        <div style={styles.badge}>AI Ready</div>
      </div>

      <div style={styles.messages}>
        {messages.length === 0 && (
          <div style={styles.welcome}>
            <div style={styles.welcomeIcon}>💬</div>
            <h2 style={styles.welcomeTitle}>Ask anything about this document</h2>
            <p style={styles.welcomeText}>
              Try one of these to get started:
            </p>
            <div style={styles.suggestions}>
              {[
                'Summarize this document',
                'What are the main topics?',
                'What is the conclusion?'
              ].map(s => (
                <button
                  key={s}
                  style={styles.suggestion}
                  onClick={() => setQuestion(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={msg.role === 'user' ? styles.userRow : styles.aiRow}>
            <div style={msg.role === 'user' ? styles.userBubble : styles.aiBubble}>
              {msg.role === 'ai' && <span style={styles.aiLabel}>AI</span>}
              <p style={styles.msgText}>{msg.text}</p>
            </div>
          </div>
        ))}

        {loading && (
          <div style={styles.aiRow}>
            <div style={styles.aiBubble}>
              <span style={styles.aiLabel}>AI</span>
              <p style={styles.typing}>Thinking...</p>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={sendMessage} style={styles.inputArea}>
        <input
          style={styles.input}
          placeholder="Ask a question about your PDF..."
          value={question}
          onChange={e => setQuestion(e.target.value)}
          disabled={loading}
        />
        <button style={styles.sendBtn} type="submit" disabled={loading}>
          {loading ? '...' : 'Ask'}
        </button>
      </form>
    </div>
  )
}

const styles = {
  page: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: '#f5f5f0',
  },
  loading: {
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#666',
  },
  header: {
    background: 'white',
    padding: '16px 24px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    borderBottom: '1px solid #eee',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  backBtn: {
    background: 'none',
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '8px 14px',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#555',
  },
  docName: {
    flex: 1,
    fontWeight: '600',
    fontSize: '15px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  badge: {
    background: '#e8f5e9',
    color: '#2e7d32',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
  },
  messages: {
    flex: 1,
    overflowY: 'auto',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  welcome: {
    textAlign: 'center',
    padding: '60px 20px',
  },
  welcomeIcon: { fontSize: '48px', marginBottom: '16px' },
  welcomeTitle: { fontSize: '22px', fontWeight: '700', marginBottom: '8px' },
  welcomeText: { color: '#666', marginBottom: '24px' },
  suggestions: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'center',
    flexWrap: 'wrap'
  },
  suggestion: {
    padding: '10px 18px',
    background: 'white',
    border: '1px solid #ddd',
    borderRadius: '20px',
    cursor: 'pointer',
    fontSize: '13px',
    color: '#555',
  },
  userRow: { display: 'flex', justifyContent: 'flex-end' },
  aiRow: { display: 'flex', justifyContent: 'flex-start' },
  userBubble: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '12px 18px',
    borderRadius: '18px 18px 4px 18px',
    maxWidth: '70%',
  },
  aiBubble: {
    background: 'white',
    padding: '16px 18px',
    borderRadius: '18px 18px 18px 4px',
    maxWidth: '75%',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    border: '1px solid #eee',
  },
  aiLabel: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#667eea',
    textTransform: 'uppercase',
    display: 'block',
    marginBottom: '6px',
  },
  msgText: {
    fontSize: '15px',
    lineHeight: '1.6',
    whiteSpace: 'pre-wrap'
  },
  typing: { color: '#888', fontStyle: 'italic' },
  inputArea: {
    padding: '16px 24px',
    background: 'white',
    borderTop: '1px solid #eee',
    display: 'flex',
    gap: '12px',
  },
  input: {
    flex: 1,
    padding: '14px 18px',
    border: '2px solid #e8e8e8',
    borderRadius: '12px',
    fontSize: '15px',
    outline: 'none',
  },
  sendBtn: {
    padding: '14px 28px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
  }
}