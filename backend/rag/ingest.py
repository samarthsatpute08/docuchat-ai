from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import SentenceTransformerEmbeddings
import os

CHROMA_DIR = "./chroma_db"

def ingest_pdf(file_path: str, doc_id: str) -> int:
    # Step 1: Read the PDF
    loader = PyPDFLoader(file_path)
    pages = loader.load()

    # Step 2: Split into small chunks
    # Think of this like cutting a book into flashcards
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=100
    )
    chunks = splitter.split_documents(pages)

    # Step 3: Convert chunks to numbers (embeddings)
    # This is how AI understands text
    embeddings = SentenceTransformerEmbeddings(
        model_name="all-MiniLM-L6-v2"
    )

    # Step 4: Store in ChromaDB with doc_id as collection name
    vectorstore = Chroma(
        collection_name=doc_id,
        embedding_function=embeddings,
        persist_directory=CHROMA_DIR
    )
    vectorstore.add_documents(chunks)

    return len(chunks)