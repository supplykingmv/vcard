"use client"

import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider, useAuth } from "@/contexts/auth-context"
import { SignInPage } from "@/components/sign-in-page"
import ContactManager from "./contact-manager"
import { Logo } from "@/components/logo"

const inter = Inter({ subsets: ["latin"] })

function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="relative flex items-center justify-center">
          {/* Glowing spinner circle */}
          <div className="absolute w-28 h-28 rounded-full border-4 border-green-400 border-t-transparent animate-spin-slow shadow-[0_0_24px_4px_rgba(34,197,94,0.5)]" />
          {/* Flashing logo */}
          <Logo size="lg" className="animate-flash-slow" />
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <SignInPage />
  }

  return <ContactManager />
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <AuthWrapper>{children}</AuthWrapper>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
