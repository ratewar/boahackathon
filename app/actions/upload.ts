"use server"

import { put } from "@vercel/blob"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { embedMany } from "ai"
import { openai } from "@ai-sdk/openai"
import { encodingForModel } from "js-tiktoken"

// 🔤 Setup tokenizer for token counting
const encoder = encodingForModel("text-embedding-3-small")
function countTokens(text: string): number {
  return encoder.encode(text).length
}

// 🧹 Sanitize text
function sanitizeText(text: string): string {
  return text
    .replace(/\0/g, "")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

// 📄 Extract readable text from File
async function extractTextFromFile(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const text = new TextDecoder().decode(arrayBuffer)
    return sanitizeText(text)
  } catch (error) {
    console.error("[v0] Text extraction error:", error)
    return ""
  }
}

// ✂️ Chunk text into smaller pieces
function chunkText(text: string, chunkSize = 400): string[] {
  const chunks: string[] = []
  const cleanText = text.replace(/\s+/g, " ").trim()
  const words = cleanText.split(/\s+/)

  for (let i = 0; i < words.length; i += chunkSize) {
    const chunk = words.slice(i, i + chunkSize).join(" ")
    if (chunk.trim().length > 50) chunks.push(chunk)
  }

  return chunks
}

// 🧩 Ensure each chunk fits under token limit
function enforceTokenLimit(chunks: string[], maxTokens = 7500): string[] {
  const safeChunks: string[] = []

  for (const chunk of chunks) {
    const tokenCount = countTokens(chunk)
    if (tokenCount <= maxTokens) {
      safeChunks.push(chunk)
    } else {
      // Split overly large chunk recursively
      const midpoint = Math.floor(chunk.length / 2)
      safeChunks.push(...enforceTokenLimit([chunk.slice(0, midpoint), chunk.slice(midpoint)], maxTokens))
    }
  }

  return safeChunks
}

// 📤 Handle file upload
export async function uploadFile(formData: FormData) {
  try {
    const file = formData.get("file") as File
    if (!file) {
      return { success: false, error: "No file provided" }
    }

    console.log("[v0] Uploading file:", file.name, file.type, file.size)

    // Upload file to Vercel Blob
    const blob = await put(file.name, file, {
      access: "public",
      addRandomSuffix: true,
    })

    // Extract text
    const content = await extractTextFromFile(file)
    if (!content || content.length < 10) {
      return {
        success: false,
        error: "Could not extract text from file. Please ensure it contains readable text.",
      }
    }

    // Save document record
    const supabase = await getSupabaseServerClient()
    const { data: document, error: docError } = await supabase
      .from("documents")
      .insert({
        title: file.name,
        type: "file",
        file_url: blob.url,
        content: content.substring(0, 10000),
        file_size: file.size,
        mime_type: file.type,
        status: "processing",
      })
      .select()
      .single()

    if (docError) throw new Error("Failed to save document to database")

    // Chunk + enforce token safety
    let chunks = chunkText(content)
    chunks = enforceTokenLimit(chunks)
    console.log(`[v0] Safe chunks count: ${chunks.length}`)

    // Generate embeddings in batches
    const BATCH_SIZE = 50
    const allEmbeddings: number[][] = []

    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE)
      console.log(`[v0] Embedding batch ${i / BATCH_SIZE + 1}/${Math.ceil(chunks.length / BATCH_SIZE)} (${batch.length} chunks)`)

      const { embeddings: batchEmbeddings } = await embedMany({
        model: openai.embedding("text-embedding-3-small"),
        values: batch,
      })

      allEmbeddings.push(...batchEmbeddings)
    }

    // Insert embeddings
    const embeddingsData = chunks.map((chunk, index) => ({
      document_id: document.id,
      content: chunk,
      embedding: allEmbeddings[index],
      metadata: { chunk_index: index, total_chunks: chunks.length },
    }))

    const { error: embError } = await supabase.from("embeddings").insert(embeddingsData)
    if (embError) throw new Error("Failed to store embeddings")

    // Mark document as completed
    await supabase.from("documents").update({ status: "completed" }).eq("id", document.id)

    console.log("[v0] File upload complete:", document.id)
    return { success: true, document }
  } catch (error: any) {
    console.error("[v0] Upload error:", error)
    return { success: false, error: error.message || String(error) }
  }
}

// 🌐 Handle link upload
export async function uploadLink(url: string) {
  try {
    console.log("[v0] Fetching link:", url)

    const response = await fetch(url)
    if (!response.ok) throw new Error(`Failed to fetch URL: ${response.statusText}`)

    const html = await response.text()
    const titleMatch = html.match(/<title>(.*?)<\/title>/i)
    const title = titleMatch ? titleMatch[1] : url

    // Better HTML cleaning - remove scripts, styles, and extract text
    let textContent = html
      // Remove script tags and their content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
      // Remove style tags and their content
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
      // Remove HTML comments
      .replace(/<!--[\s\S]*?-->/g, ' ')
      // Remove all HTML tags
      .replace(/<[^>]+>/g, ' ')
      // Decode common HTML entities
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&#x27;/g, "'")
      .replace(/&#x2F;/g, '/')
      .replace(/&apos;/g, "'")
      // Clean up whitespace
      .replace(/\s+/g, ' ')
      .trim()

    textContent = sanitizeText(textContent)
    
    if (!textContent || textContent.length < 50) {
      throw new Error("Could not extract meaningful text from the URL. The page might be JavaScript-heavy or require authentication.")
    }

    const supabase = await getSupabaseServerClient()
    const { data: document, error: docError } = await supabase
      .from("documents")
      .insert({
        title,
        type: "link",
        link_url: url,
        content: textContent.substring(0, 10000),
        status: "processing",
      })
      .select()
      .single()

    if (docError) throw new Error("Failed to save link to database")

    let chunks = chunkText(textContent)
    chunks = enforceTokenLimit(chunks)
    console.log(`[v0] Safe link chunks: ${chunks.length}`)

    const BATCH_SIZE = 50
    const allEmbeddings: number[][] = []

    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE)
      console.log(`[v0] Embedding batch ${i / BATCH_SIZE + 1}/${Math.ceil(chunks.length / BATCH_SIZE)} (${batch.length} chunks)`)

      const { embeddings: batchEmbeddings } = await embedMany({
        model: openai.embedding("text-embedding-3-small"),
        values: batch,
      })

      allEmbeddings.push(...batchEmbeddings)
    }

    const embeddingsData = chunks.map((chunk, index) => ({
      document_id: document.id,
      content: chunk,
      embedding: allEmbeddings[index],
      metadata: { chunk_index: index, total_chunks: chunks.length },
    }))

    const { error: embError } = await supabase.from("embeddings").insert(embeddingsData)
    if (embError) throw new Error("Failed to store embeddings")

    await supabase.from("documents").update({ status: "completed" }).eq("id", document.id)

    console.log("[v0] Link upload complete:", document.id)
    return { success: true, document }
  } catch (error: any) {
    console.error("[v0] Link upload error:", error)
    return { success: false, error: error.message || String(error) }
  }
}

// 📂 Get all documents
export async function getDocuments() {
  try {
    const supabase = await getSupabaseServerClient()
    const { data, error } = await supabase.from("documents").select("*").order("created_at", { ascending: false })
    if (error) throw error
    return { success: true, documents: data }
  } catch (error) {
    console.error("[v0] Get documents error:", error)
    return { success: false, error: String(error), documents: [] }
  }
}

// 🗑 Delete document
export async function deleteDocument(id: string) {
  try {
    const supabase = await getSupabaseServerClient()
    const { error } = await supabase.from("documents").delete().eq("id", id)
    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error("[v0] Delete document error:", error)
    return { success: false, error: String(error) }
  }
}
