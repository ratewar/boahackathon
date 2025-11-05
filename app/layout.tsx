"use client"

import type React from "react"
import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { AppSidebar } from "@/components/app-sidebar"
import { Toaster } from "@/components/ui/toaster"
import { usePathname } from "next/navigation"

// Fonts are defined via CSS variables in globals.css

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const pathname = usePathname()
  const isLandingPage = pathname === "/"

  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        {isLandingPage ? (
          // Landing page - no sidebar, no container
          <>
            {children}
            <Toaster />
            <Analytics />
          </>
        ) : (
          // App pages - with sidebar
          <div className="flex h-screen overflow-hidden">
            <AppSidebar />
            <main className="flex-1 overflow-y-auto">
              <div className="container mx-auto p-8">{children}</div>
            </main>
            <Toaster />
            <Analytics />
          </div>
        )}
      </body>
    </html>
  )
}
