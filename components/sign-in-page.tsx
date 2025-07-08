"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Eye, EyeOff, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Logo } from "@/components/logo"
import { useAuth } from "@/contexts/auth-context"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

export function SignInPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [showReset, setShowReset] = useState(false)
  const [resetEmail, setResetEmail] = useState("")
  const [resetStatus, setResetStatus] = useState<string | null>(null)
  const [resetLoading, setResetLoading] = useState(false)

  const { login, resetPassword } = useAuth()

  useEffect(() => {
    const remembered = localStorage.getItem("rememberedEmail")
    if (remembered) {
      setEmail(remembered)
      setRememberMe(true)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    if (rememberMe) {
      localStorage.setItem("rememberedEmail", email)
    } else {
      localStorage.removeItem("rememberedEmail")
    }

    try {
      const success = await login(email, password, rememberMe)
      if (!success) {
        setError("Invalid email or password")
      }
    } catch (error) {
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = () => {
    setResetEmail(email)
    setShowReset(true)
    setResetStatus(null)
  }

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setResetLoading(true)
    setResetStatus(null)
    const ok = await resetPassword(resetEmail)
    setResetStatus(ok ? "A password reset email has been sent if the address exists." : "Failed to send reset email. Please check the address and try again.")
    setResetLoading(false)
  }

  return (
    <div
      className="min-h-screen relative overflow-hidden flex items-center justify-center"
      style={{
        background: '#f8fafc',
        position: 'relative',
      }}
    >
      {/* Homepage-style Background Pattern */}
      <div className="absolute inset-0">
        {/* Geometric Line Pattern */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url('/line-pattern.png')`,
            backgroundSize: '400px 400px',
            backgroundRepeat: 'repeat',
            opacity: 0.07,
          }}
        />
        {/* No green overlay */}
      </div>

      <div className="relative z-10 w-full max-w-md px-4">
        <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-2xl">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <Logo size="lg" />
            </div>
            <div>
              <CardTitle className="text-3xl font-extrabold text-gray-900 tracking-tight">Sign in</CardTitle>
              <CardDescription className="text-gray-500 mt-2">Access your digital business card manager</CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-white/60"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-white/60 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <label className="flex items-center gap-2 text-sm text-gray-600 select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={e => setRememberMe(e.target.checked)}
                      className="accent-green-600 rounded"
                    />
                    Remember me
                  </label>
                  <button
                    type="button"
                    className="text-green-700 hover:underline text-sm font-medium"
                    onClick={handleForgotPassword}
                  >
                    Forgot password?
                  </button>
                </div>
              </div>

              {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>}

              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white text-base font-semibold py-3" disabled={isLoading}>
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <LogIn className="h-5 w-5" />
                    <span>Sign In</span>
                  </div>
                )}
              </Button>
            </form>
            {/* Password Reset Dialog */}
            <Dialog open={showReset} onOpenChange={setShowReset}>
              <DialogContent className="max-w-xs">
                <DialogHeader>
                  <DialogTitle>Reset Password</DialogTitle>
                  <DialogDescription>
                    Enter your email address and we'll send you a password reset link.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleResetSubmit} className="space-y-4">
                  <Input
                    type="email"
                    placeholder="Email address"
                    value={resetEmail}
                    onChange={e => setResetEmail(e.target.value)}
                    required
                    autoFocus
                  />
                  <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white" disabled={resetLoading}>
                    {resetLoading ? "Sending..." : "Send Reset Link"}
                  </Button>
                  {resetStatus && (
                    <div className="text-xs text-center text-gray-700 mt-2">{resetStatus}</div>
                  )}
                </form>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
