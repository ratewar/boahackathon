"use client";

import React, { useRef, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from 'react-markdown';
import {
  Send,
  Bot,
  User,
  Loader2,
  Sparkles,
  FileText,
  Globe,
  Code,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useChat } from '@ai-sdk/react';

export default function ChatPage() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState('');
  
  const { messages, sendMessage } = useChat();

  // Debug logging
  useEffect(() => {
    console.log('[Chat] Messages updated:', messages.length);
    messages.forEach((msg, idx) => {
      console.log(`[Chat] Message ${idx}:`, {
        id: msg.id,
        role: msg.role,
        partsCount: msg.parts.length,
      });
      msg.parts.forEach((part: any, pIdx: number) => {
        console.log(`  Part ${pIdx}:`, {
          type: part.type,
          textLength: part.text?.length,
          outputLength: typeof part.output === 'string' ? part.output.length : 0,
          hasToolCallId: !!part.toolCallId,
        });
      });
    });
  }, [messages]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    const scrollToBottom = () => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
      }
    };
    
    // Immediate scroll
    scrollToBottom();
    
    // Delayed scroll to catch any rendering updates
    const timeoutId = setTimeout(scrollToBottom, 100);
    
    return () => clearTimeout(timeoutId);
  }, [messages]);

  const isLoading = messages.length > 0 && messages[messages.length - 1].role === 'user';

  const suggestedPrompts = [
    "How do I authenticate with resend API?",
    "Show me an example of sending an email using resend api",
    "What are the available endpoints for stripe api?",
    "give me swagger documentation for resend email api",
  ];

  return (
    <div className="flex h-[calc(100vh-6rem)] sm:h-[calc(100vh-8rem)] flex-col">
      <Card className="flex flex-1 flex-col overflow-hidden">
        <div className="border-b border-border bg-background p-3 sm:p-4">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            API Documentation Chat
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Ask questions about API endpoints, authentication, and implementation
          </p>
        </div>

        <ScrollArea className="flex-1 p-3 sm:p-6" ref={scrollRef}>
          <div className="mx-auto max-w-5xl space-y-4 sm:space-y-6">
            {/* ---- Welcome block ---- */}
            {messages.length === 0 && (
              <div className="flex gap-3 sm:gap-4">
                <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg">
                  <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="flex-1 space-y-2 sm:space-y-3 rounded-2xl bg-muted/50 px-3 py-3 sm:px-5 sm:py-4">
                  <p className="text-sm sm:text-base font-medium leading-relaxed">
                    Hello! I'm your API Documentation Assistant.
                  </p>
                  <div className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                    <div className="flex items-start gap-2">
                      <Code className="mt-0.5 h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                      <span>
                        Ask me about API endpoints, authentication, parameters, and usage
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <FileText className="mt-0.5 h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                      <span>
                        Get code examples for your api integrations
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ---- Messages ---- */}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 sm:gap-4 ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.role === "assistant" && (
                  <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg">
                    <Bot className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                )}

                <div
                  className={`flex-1 space-y-2 sm:space-y-3 rounded-2xl px-3 py-3 sm:px-5 sm:py-4 ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground shadow-md max-w-[90%] sm:max-w-[85%]"
                      : "bg-muted/50"
                  }`}
                >
                  {/* Display message parts */}
                  {msg.parts.map((part: any, idx) => {
                    console.log('[Render] Part type:', part.type, 'hasText:', !!part.text, 'textPreview:', part.text?.substring(0, 100));
                    
                    // Skip step-start and step-finish
                    if (part.type === 'step-start' || part.type === 'step-finish') {
                      return null;
                    }
                    
                    // For user messages, just show the text directly
                    if (msg.role === 'user' && part.type === 'text') {
                      return (
                        <p key={idx} className="text-sm sm:text-base leading-relaxed text-primary-foreground break-words">
                          {part.text}
                        </p>
                      );
                    }
                    
                    if (part.type === 'text') {
                      return (
                        <div key={idx} className="text-sm sm:text-base leading-relaxed break-words">
                          <ReactMarkdown
                            components={{
                              code: ({ node, inline, className, children, ...props }: any) => {
                                const match = /language-(\w+)/.exec(className || '');
                                return !inline && match ? (
                                  <pre className="bg-slate-900 dark:bg-slate-800 text-slate-50 rounded-lg p-2 sm:p-4 overflow-x-auto my-2 sm:my-4 border border-slate-700 text-xs sm:text-sm">
                                    <code className={className} {...props}>
                                      {children}
                                    </code>
                                  </pre>
                                ) : (
                                  <code className="bg-slate-100 dark:bg-slate-800 text-rose-600 dark:text-rose-400 px-1 sm:px-1.5 py-0.5 rounded text-xs sm:text-sm font-mono" {...props}>
                                    {children}
                                  </code>
                                );
                              },
                              pre: ({ children }: any) => <>{children}</>,
                              p: ({ children }: any) => <p className="mb-4 last:mb-0 text-foreground">{children}</p>,
                              ul: ({ children }: any) => <ul className="list-disc pl-6 mb-4 space-y-2">{children}</ul>,
                              ol: ({ children }: any) => <ol className="list-decimal pl-6 mb-4 space-y-2">{children}</ol>,
                              li: ({ children }: any) => <li className="text-foreground">{children}</li>,
                              h1: ({ children }: any) => <h1 className="text-2xl font-bold mb-4 mt-6 first:mt-0 text-foreground">{children}</h1>,
                              h2: ({ children }: any) => <h2 className="text-xl font-bold mb-3 mt-5 first:mt-0 text-foreground">{children}</h2>,
                              h3: ({ children }: any) => <h3 className="text-lg font-semibold mb-2 mt-4 first:mt-0 text-foreground">{children}</h3>,
                              strong: ({ children }: any) => <strong className="font-semibold text-foreground">{children}</strong>,
                              a: ({ children, href }: any) => (
                                <a href={href} className="text-primary hover:underline font-medium" target="_blank" rel="noopener noreferrer">
                                  {children}
                                </a>
                              ),
                              blockquote: ({ children }: any) => (
                                <blockquote className="border-l-4 border-primary pl-4 italic my-4 text-muted-foreground">
                                  {children}
                                </blockquote>
                              ),
                            }}
                          >
                            {part.text}
                          </ReactMarkdown>
                        </div>
                      );
                    }
                    
                    // Show tool calls with their output
                    if (part.type.startsWith('tool-')) {
                      const hasOutput = part.output !== undefined && part.output !== null;
                      
                      return (
                        <div key={idx} className="rounded-lg border border-border bg-background/50 p-3 text-sm mb-3">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="h-4 w-4 text-primary" />
                            <span className="font-medium">
                              {hasOutput ? "Search Results" : "Searching documentation..."}
                            </span>
                            {!hasOutput && <Loader2 className="h-4 w-4 animate-spin text-primary ml-auto" />}
                            {hasOutput && <CheckCircle2 className="h-4 w-4 text-green-500 ml-auto" />}
                          </div>
                          {hasOutput && typeof part.output === 'string' && (
                            <div className="text-xs text-muted-foreground whitespace-pre-wrap max-h-96 overflow-y-auto border-t border-border pt-2 mt-2">
                              {part.output}
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>

                {msg.role === "user" && (
                  <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground shadow-md">
                    <User className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                )}
              </div>
            ))}

            {/* ---- Error display ---- */}
            {/* Error handling can be added here if needed */}

            {/* ---- Loading indicator ---- */}
            {isLoading && (
              <div className="flex gap-3 sm:gap-4">
                <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg">
                  <Bot className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="flex items-center gap-2 sm:gap-3 rounded-2xl bg-muted/50 px-3 py-3 sm:px-5 sm:py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    Thinking...
                  </span>
                </div>
              </div>
            )}
            
            {/* Invisible anchor for auto-scroll */}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* ---- Input at bottom ---- */}
        <div className="border-t border-border bg-background p-3 sm:p-4 mt-auto">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (input.trim()) {
                sendMessage({ text: input });
                setInput('');
              }
            }} 
            className="mx-auto max-w-5xl space-y-2 sm:space-y-3"
          >
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.currentTarget.value)}
                placeholder="Ask about API endpoints..."
                disabled={isLoading}
                className="flex-1 h-10 sm:h-12 text-sm sm:text-base"
              />
              <Button
                type="submit"
                disabled={isLoading || !input.trim()}
                size="lg"
                className="px-3 sm:px-6 h-10 sm:h-12"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 sm:h-5 sm:w-5" />
                )}
              </Button>
            </div>
            
            {/* Suggested prompts - always visible */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                Suggested questions:
              </p>
              <div className="grid gap-2 grid-cols-1 sm:grid-cols-2">
                {suggestedPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setInput(prompt)}
                    disabled={isLoading}
                    className="rounded-md border border-border bg-background px-2 sm:px-3 py-1.5 sm:py-2 text-left text-xs transition-colors hover:bg-accent hover:border-primary/50 disabled:opacity-50 disabled:cursor-not-allowed truncate"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
            
            <p className="text-xs text-center text-muted-foreground hidden sm:block">
              Responses are based on uploaded API documentation. Always verify with official docs.
            </p>
          </form>
        </div>
      </Card>
    </div>
  );
}
