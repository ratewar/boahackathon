import { openai } from "@ai-sdk/openai";
import { streamText, embed, tool, convertToModelMessages, UIMessage, stepCountIs } from "ai";
import { z } from "zod";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

async function getSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) =>
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          ),
      },
    }
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages }: { messages: UIMessage[] } = body;

    if (!Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "messages must be an array" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const result = streamText({
      model: openai("gpt-4o"),
      stopWhen: stepCountIs(5), // Allow up to 5 steps for tool calling and response
      system: `You are an API documentation assistant. Your ONLY purpose is to help developers understand and use APIs based on the uploaded documentation.

CRITICAL INSTRUCTION: After calling the searchDocuments tool and receiving results, you MUST ALWAYS generate a comprehensive text response. Never leave the conversation hanging after a tool call.

STRICT RULES:
1. ONLY answer questions about APIs, endpoints, authentication, parameters, request/response formats, and code examples
2. If a user asks anything unrelated to API documentation (greetings, general questions, off-topic), politely redirect them: "I can only help with API documentation questions. Please ask about endpoints, authentication, parameters, or how to use the API."
3. When providing code examples, use proper markdown code blocks with language tags
4. Format responses clearly with headers, bullet points, and code blocks
5. Always cite which document the information comes from

RESPONSE FORMAT (MANDATORY):
After using searchDocuments, you MUST respond with:
1. A brief introduction answering the question
2. Code examples in markdown code blocks with language identifiers (e.g., \`\`\`javascript, \`\`\`python, \`\`\`curl)
3. Explanation of key parameters
4. Any important notes or limitations

Example response structure:
## How to Send an Email

To send an email using the Resend API, use the following endpoint:

\`\`\`javascript
import { Resend } from 'resend';
const resend = new Resend('your_api_key');

const { data, error } = await resend.emails.send({
  from: 'sender@example.com',
  to: ['recipient@example.com'],
  subject: 'Hello',
  html: '<p>Email content</p>'
});
\`\`\`

**Required Parameters:**
- \`from\`: Sender email address
- \`to\`: Recipient email(s)
- \`subject\`: Email subject

Source: [Document name]`,
      messages: convertToModelMessages(messages),
      tools: {
        searchDocuments: tool({
          description: "Search through uploaded API documentation to find relevant information. Use this when users ask about API endpoints, authentication, parameters, or how to use the API.",
          inputSchema: z.object({
            query: z.string().describe("The search query to find relevant API documentation"),
          }),
          execute: async ({ query }) => {
            console.log("[searchDocuments] Query:", query);
            
            try {
              const supabase = await getSupabaseClient();
              
              // First check if there are any documents at all
              const { data: allDocs, error: docsError } = await supabase
                .from("documents")
                .select("id, title, status")
                .limit(10);
              
              console.log("[searchDocuments] Total documents in DB:", allDocs?.length, "Error:", docsError?.message);
              
              // Check if there are any embeddings
              const { data: allEmbeddings, error: embError } = await supabase
                .from("embeddings")
                .select("id, document_id")
                .limit(10);
              
              console.log("[searchDocuments] Total embeddings in DB:", allEmbeddings?.length, "Error:", embError?.message);
              
              if (!allEmbeddings || allEmbeddings.length === 0) {
                return "No documents have been processed yet. Please upload some documents first, and wait for them to be processed.";
              }
              
              const { embedding } = await embed({
                model: openai.embedding("text-embedding-3-small"),
                value: query,
              });

              console.log("[searchDocuments] Generated embedding, length:", embedding.length);

              // Try without threshold first to see if we get any results
              const { data: testData, error: testError } = await supabase.rpc("match_embeddings", {
                query_embedding: embedding,
                match_threshold: 0.0, // No threshold - get everything
                match_count: 5,
              });
              
              console.log("[searchDocuments] Test search (no threshold):", { 
                dataLength: testData?.length,
                topSimilarity: testData?.[0]?.similarity,
                error: testError?.message 
              });

              const { data, error } = await supabase.rpc("match_embeddings", {
                query_embedding: embedding,
                match_threshold: 0.5, // Only return results with 50%+ similarity
                match_count: 3, // Return top 3 most relevant chunks
              });
              
              console.log("[searchDocuments] Supabase response:", { 
                dataLength: data?.length, 
                error: error?.message 
              });
              
              if (error) {
                console.error("[searchDocuments] Supabase error:", error);
                return `Database error: ${error.message}`;
              }
              
              if (!data || data.length === 0) {
                return "No relevant documents found for your query. Try rephrasing your question or upload more documents.";
              }

              const docIds = [...new Set(data.map((r: any) => r.document_id))];
              const { data: docs } = await supabase
                .from("documents")
                .select("id, title")
                .in("id", docIds);

              console.log("[searchDocuments] Found docs:", docs?.length);

              // Return structured data for the LLM to process
              const results = data.map((item: any) => {
                const doc = docs?.find((d: any) => d.id === item.document_id);
                return {
                  source: doc?.title || 'Untitled',
                  similarity: Math.round(item.similarity * 100),
                  content: item.content
                };
              });

              // Format as a clear, structured response for the LLM
              const response = `I found ${data.length} relevant sections from the documentation:\n\n` +
                results.map((r, i) => 
                  `[${i + 1}] From "${r.source}" (${r.similarity}% relevant):\n${r.content}\n`
                ).join('\n---\n\n');

              console.log("[searchDocuments] Returning response, length:", response.length);
              return response;
            } catch (error) {
              console.error("[searchDocuments] Error:", error);
              return `Error searching documents: ${error instanceof Error ? error.message : String(error)}`;
            }
          },
        }),
      },
    });

    return result.toUIMessageStreamResponse();
    
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
