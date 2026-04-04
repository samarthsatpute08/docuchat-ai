import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

export default function Dashboard() {
  const [docs, setDocs] = useState([])
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const navigate = useNavigate()
  const email = localStorage.getItem('email')

  useEffect(() => {
    fetchDocs()
  }, [])

  const fetchDocs = async () => {
    try {
      const res = await api.get('/documents')
      setDocs(res.data.documents)
    } catch (err) {
      console.error(err)
    }
  }

  const handleUpload = async (file) => {
    if (!file || !file.name.endsWith('.pdf')) {
      alert('Please upload a PDF file')
      return
    }
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    try {
      await api.post('/upload', formData)
      await fetchDocs()
    } catch (err) {
      alert('Upload failed')
    }
    setUploading(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    handleUpload(file)
  }

  const handleLogout = () => {
    localStorage.clear()
    navigate('/login')
  }

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.logo}>DocuChat AI</div>
        <div style={styles.headerRight}>
          <span style={styles.email}>{email}</span>
          <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
        </div>
      </div>

      <div style={styles.container}>
        <h1 style={styles.title}>My Documents</h1>
        <p style={styles.subtitle}>Upload a PDF and start chatting with it</p>

        {/* Upload Area */}
        <div
          style={{...styles.uploadArea, ...(dragOver ? styles.uploadAreaActive : {})}}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          {uploading ? (
            <div>
              <div style={styles.spinner}></div>
              <p style={styles.uploadText}>Processing PDF...</p>
              <p style={styles.uploadHint}>Reading and indexing your document</p>
            </div>
          ) : (
            <div>
              <div style={styles.uploadIcon}>📄</div>
              <p style={styles.uploadText}>Drop your PDF here</p>
              <p style={styles.uploadHint}>or</p>
              <label style={styles.uploadBtn}>
                Choose PDF File
                <input
                  type="file"
                  accept=".pdf"
                  style={{ display: 'none' }}
                  onChange={e => handleUpload(e.target.files[0])}
                />
              </label>
            </div>
          )}
        </div>

        {/* Documents Grid */}
        {docs.length === 0 ? (
          <div style={styles.empty}>
            <p>No documents yet. Upload your first PDF above!</p>
          </div>
        ) : (
          <div style={styles.grid}>
            {docs.map((doc) => (
              <div
                key={doc.doc_id}
                style={styles.docCard}
                onClick={() => navigate(`/chat/${doc.doc_id}?name=${doc.filename}`)}
              >
                <div style={styles.docIcon}>📑</div>
                <div style={styles.docInfo}>
                  <p style={styles.docName}>{doc.filename}</p>
                  <p style={styles.docMeta}>{doc.chunks} chunks indexed</p>
                </div>
                <div style={styles.chatBtn}>Chat →</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', background: '#f5f5f0' },
  header: {
    background: 'white',
    padding: '16px 32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #eee',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  logo: { fontSize: '20px', fontWeight: '700', color: '#667eea' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '16px' },
  email: { fontSize: '14px', color: '#666' },
  logoutBtn: {
    padding: '8px 16px',
    background: 'none',
    border: '1px solid #ddd',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#666',
  },
  container: { maxWidth: '800px', margin: '0 auto', padding: '40px 20px' },
  title: { fontSize: '28px', fontWeight: '700', marginBottom: '8px' },
  subtitle: { color: '#666', marginBottom: '32px' },
  uploadArea: {
    border: '2px dashed #ccc',
    borderRadius: '16px',
    padding: '48px',
    textAlign: 'center',
    background: 'white',
    marginBottom: '32px',
    transition: 'all 0.2s',
    cursor: 'pointer',
  },
  uploadAreaActive: {
    borderColor: '#667eea',
    background: '#f0f0ff',
  },
  uploadIcon: { fontSize: '48px', marginBottom: '16px' },
  uploadText: { fontSize: '18px', fontWeight: '600', marginBottom: '8px' },
  uploadHint: { color: '#888', marginBottom: '16px', fontSize: '14px' },
  uploadBtn: {
    display: 'inline-block',
    padding: '12px 28px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '15px',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 16px',
  },
  empty: {
    textAlign: 'center',
    color: '#888',
    padding: '40px',
  },
  grid: { display: 'flex', flexDirection: 'column', gap: '12px' },
  docCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '20px 24px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    transition: 'transform 0.1s',
    border: '1px solid #eee',
  },
  docIcon: { fontSize: '32px' },
  docInfo: { flex: 1 },
  docName: { fontWeight: '600', marginBottom: '4px' },
  docMeta: { fontSize: '13px', color: '#888' },
  chatBtn: {
    color: '#667eea',
    fontWeight: '600',
    fontSize: '14px',
  }
}