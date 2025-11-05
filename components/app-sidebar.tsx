"use client"

import { Upload, MessageSquare, Sparkles } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Upload", href: "/upload", icon: Upload },
  { name: "Chat", href: "/chat", icon: MessageSquare },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Logo Header */}
      <Link href="/" className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6 hover:bg-sidebar-accent/50 transition-colors">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-md rounded-lg"></div>
          <div className="relative bg-gradient-to-br from-primary to-primary/80 p-2 rounded-lg">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
        </div>
        <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
          DocIQ
        </h1>
      </Link>
      
      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>
      
      {/* User Section */}
      <div className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent px-3 py-2">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground font-semibold text-sm">
            U
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-sidebar-foreground">Rajat Ratewal</p>
            <p className="text-xs text-muted-foreground">rajat.ratewal@natwest.com</p>
          </div>
        </div>
      </div>
    </div>
  )
}

