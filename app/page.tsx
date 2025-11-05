import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, FileText, MessageSquare, Zap, Shield, Code, Sparkles } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20 md:py-32">
        <div className="flex flex-col items-center text-center space-y-8 max-w-4xl mx-auto">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
              <div className="relative bg-gradient-to-br from-primary to-primary/80 p-4 rounded-2xl shadow-lg">
                <Sparkles className="h-10 w-10 text-primary-foreground" />
              </div>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
              DocIQ
            </h1>
          </div>

          {/* Tagline */}
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl font-light">
            Your intelligent API documentation assistant. Upload docs, ask questions, get instant answers with code examples.
          </p>

          {/* CTA Button */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link href="/upload">
              <Button size="lg" className="text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/chat">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                Try Chat Demo
                <MessageSquare className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-20">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          Why Choose DocIQ?
        </h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Feature 1 */}
          <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-card border border-border hover:shadow-lg transition-shadow">
            <div className="bg-primary/10 p-4 rounded-full mb-4">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Smart Document Processing</h3>
            <p className="text-muted-foreground">
              Upload API documentation and we'll automatically extract, chunk, and embed the content for intelligent search.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-card border border-border hover:shadow-lg transition-shadow">
            <div className="bg-primary/10 p-4 rounded-full mb-4">
              <Code className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Code Examples</h3>
            <p className="text-muted-foreground">
              Get formatted code examples in multiple languages with proper syntax highlighting and explanations.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-card border border-border hover:shadow-lg transition-shadow">
            <div className="bg-primary/10 p-4 rounded-full mb-4">
              <Zap className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Instant Answers</h3>
            <p className="text-muted-foreground">
              Ask questions in natural language and get accurate, context-aware responses powered by AI.
            </p>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="container mx-auto px-4 py-20 bg-muted/30">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          How It Works
        </h2>
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="flex gap-6 items-start">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold shadow-lg">
              1
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Upload Your Documentation</h3>
              <p className="text-muted-foreground">
                Upload API documentation files or paste URLs. We support various formats and automatically extract the content.
              </p>
            </div>
          </div>

          <div className="flex gap-6 items-start">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold shadow-lg">
              2
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">AI Processing</h3>
              <p className="text-muted-foreground">
                Our AI processes and indexes your documentation using advanced embeddings for semantic search.
              </p>
            </div>
          </div>

          <div className="flex gap-6 items-start">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold shadow-lg">
              3
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Ask Questions</h3>
              <p className="text-muted-foreground">
                Chat with your documentation. Get code examples, parameter explanations, and implementation guidance instantly.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center space-y-6 bg-gradient-to-br from-primary/10 to-primary/5 p-12 rounded-3xl border border-primary/20">
          <h2 className="text-3xl md:text-4xl font-bold">
            Ready to supercharge your API documentation?
          </h2>
          <p className="text-lg text-muted-foreground">
            Start uploading your documentation and experience the power of AI-assisted development.
          </p>
          <Link href="/upload">
            <Button size="lg" className="text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all">
              Start Now - It's Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 DocIQ. Built with AI for developers.</p>
        </div>
      </footer>
    </div>
  )
}

