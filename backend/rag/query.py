from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import SentenceTransformerEmbeddings
from groq import Groq
import os
from dotenv import load_dotenv

load_dotenv()

CHROMA_DIR = "./chroma_db"

def query_pdf(doc_id: str, question: str, chat_history: list = []) -> str:
    # Step 1: Convert question to numbers
    embeddings = SentenceTransformerEmbeddings(
        model_name="all-MiniLM-L6-v2"
    )

    # Step 2: Search ChromaDB for relevant chunks
    vectorstore = Chroma(
        collection_name=doc_id,
        embedding_function=embeddings,
        persist_directory=CHROMA_DIR
    )
    
    relevant_chunks = vectorstore.similarity_search(question, k=3)
    context = "\n\n".join([chunk.page_content for chunk in relevant_chunks])

    # Step 3: Build prompt with context
    prompt = f"""You are a helpful assistant. Answer the question based ONLY on the context below.
If the answer is not in the context, say "I couldn't find that in the document."

Context from document:
{context}

Question: {question}

Answer:"""

    # Step 4: Send to Groq AI and get answer
    client = Groq(api_key=os.getenv("GROQ_API_KEY"))
    
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=500
    )

    return response.choices[0].message.content