"use client"

import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider, useAuth } from "@/contexts/auth-context"
import { SignInPage } from "@/components/sign-in-page"
import ContactManager from "./contact-manager"

const inter = Inter({ subsets: ["latin"] })

function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()

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
