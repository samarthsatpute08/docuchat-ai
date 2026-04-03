import axios from "axios";

const API = axios.create({ baseURL: "http://127.0.0.1:8000" });

API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

export const register = (email, password) =>
  API.post("/register", { email, password });

export const login = (email, password) =>
  API.post("/login", { email, password });

export const uploadPDF = (file) => {
  const form = new FormData();
  form.append("file", file);
  return API.post("/upload", form);
};

export const getDocuments = () => API.get("/documents");

export const askQuestion = (doc_id, question) =>
  API.post("/chat", { doc_id, question });