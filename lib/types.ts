export interface Document {
  id: string
  title: string
  type: "file" | "link"
  file_url?: string
  link_url?: string
  content?: string
  file_size?: number
  mime_type?: string
  status: "processing" | "completed" | "failed"
  created_at: string
  updated_at: string
}

export interface Embedding {
  id: string
  document_id: string
  content: string
  embedding: number[]
  metadata?: Record<string, any>
  created_at: string
}

export interface SearchResult {
  id: string
  document_id: string
  content: string
  similarity: number
  metadata?: Record<string, any>
}
