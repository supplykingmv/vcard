"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { auth } from "@/lib/firebase"
import { verifyPasswordResetCode, confirmPasswordReset } from "firebase/auth"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"
import { Eye, EyeOff } from "lucide-react"
import dynamic from "next/dynamic"

const QrReader = dynamic(() => import("react-qr-reader").then(mod => mod.QrReader), { ssr: false })

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const oobCode = searchParams.get("oobCode") || ""
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (!oobCode) {
      setError("Invalid or missing reset code.")
      setLoading(false)
      return
    }
    if (!auth) {
      setError("Auth is not initialized.")
      setLoading(false)
      return
    }
    verifyPasswordResetCode(auth, oobCode)
      .then(setEmail)
      .catch(() => {
        setError("Invalid or expired reset link.")
      })
      .finally(() => setLoading(false))
  }, [oobCode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!auth) {
      setError("Auth is not initialized.")
      return
    }
    try {
      await confirmPasswordReset(auth, oobCode, password)
      setSuccess(true)
    } catch (err) {
      setError("Failed to reset password. Please try again.")
    }
  }

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>
  if (success) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-100/40 to-white">
      <div className="max-w-md w-full p-8 bg-white/90 rounded-xl shadow-2xl text-center">
        <Logo size="lg" className="mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-green-700 mb-2">Password Reset Successful</h1>
        <p className="mb-4 text-gray-600">Your password has been updated. You can now <a href="/" className="text-green-700 font-semibold underline">log in</a> with your new password.</p>
      </div>
    </div>
  )
  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-100/40 to-white">
      <div className="max-w-md w-full p-8 bg-white/90 rounded-xl shadow-2xl text-center">
        <Logo size="lg" className="mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-red-700 mb-2">Password Reset Error</h1>
        <p className="mb-4 text-gray-600">{error}</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-100/40 to-white">
      <div className="max-w-md w-full p-8 bg-white/90 rounded-xl shadow-2xl">
        <Logo size="lg" className="mx-auto mb-6" />
        <h1 className="text-2xl font-bold text-green-700 mb-2 text-center">Reset your password</h1>
        <p className="mb-6 text-gray-600 text-center">for <span className="font-semibold">{email}</span></p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block mb-2 text-gray-700 font-medium">New password</label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                autoCapitalize="none"
                autoCorrect="off"
                className="w-full bg-white/60 pr-10 text-lg"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Enter new password"
                autoFocus
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(v => !v)}
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
              </Button>
            </div>
          </div>
          <Button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white text-base font-semibold py-3 mt-2"
          >
            Save
          </Button>
        </form>
      </div>
    </div>
  )
} 