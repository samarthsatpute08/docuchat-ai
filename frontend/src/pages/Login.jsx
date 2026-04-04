import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/login', { email, password })
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('email', res.data.email)
      navigate('/dashboard')
    } catch (err) {
      setError('Wrong email or password')
    }
    setLoading(false)
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>DocuChat AI</div>
        <p style={styles.subtitle}>Chat with your PDFs using AI</p>

        <form onSubmit={handleLogin}>
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              style={styles.input}
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={styles.footer}>
          No account?{' '}
          <Link to="/register" style={styles.link}>Create one free</Link>
        </p>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  card: {
    background: 'white',
    borderRadius: '16px',
    padding: '40px',
    width: '100%',
    maxWidth: '400px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
  },
  logo: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#667eea',
    marginBottom: '8px',
  },
  subtitle: {
    color: '#666',
    marginBottom: '32px',
    fontSize: '14px',
  },
  field: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    marginBottom: '6px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#333',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    border: '2px solid #e8e8e8',
    borderRadius: '8px',
    fontSize: '15px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  error: {
    color: '#e53e3e',
    fontSize: '14px',
    marginBottom: '16px',
  },
  button: {
    width: '100%',
    padding: '13px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '8px',
  },
  footer: {
    textAlign: 'center',
    marginTop: '24px',
    fontSize: '14px',
    color: '#666',
  },
  link: {
    color: '#667eea',
    textDecoration: 'none',
    fontWeight: '500',
  }
}