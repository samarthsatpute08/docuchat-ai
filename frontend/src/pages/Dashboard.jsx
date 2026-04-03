import { useState, useEffect } from "react";
import { getDocuments, uploadPDF } from "../api";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const [docs, setDocs] = useState([]);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    getDocuments().then(res => setDocs(res.data.documents));
  }, []);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      await uploadPDF(file);
      const res = await getDocuments();
      setDocs(res.data.documents);
    } catch (err) {
      alert("Upload failed");
    }
    setUploading(false);
  };

  return (
    <div style={{ maxWidth: 700, margin: "50px auto", fontFamily: "Arial" }}>
      <h2>My Documents</h2>
      <div style={{ marginBottom: 20 }}>
        <input type="file" accept=".pdf" onChange={e => setFile(e.target.files[0])} />
        <button onClick={handleUpload} disabled={uploading}
          style={{ marginLeft: 10, padding: "8px 16px", background: "#4F46E5", color: "white", border: "none", borderRadius: 5 }}>
          {uploading ? "Uploading..." : "Upload PDF"}
        </button>
      </div>
      {docs.length === 0 && <p>No documents yet. Upload a PDF!</p>}
      {docs.map(doc => (
        <div key={doc.doc_id} style={{ padding: 15, border: "1px solid #ddd", borderRadius: 8, marginBottom: 10 }}>
          <strong>{doc.filename}</strong>
          <p style={{ margin: "5px 0", color: "#666" }}>{doc.chunks} chunks</p>
          <button onClick={() => navigate(`/chat/${doc.doc_id}`)}
            style={{ padding: "6px 12px", background: "#10B981", color: "white", border: "none", borderRadius: 5 }}>
            Chat with this PDF
          </button>
        </div>
      ))}
    </div>
  );
}