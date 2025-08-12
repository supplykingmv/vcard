import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { auth } from "@/lib/firebase"
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth"
import { Eye, EyeOff, Save } from "lucide-react"

interface ChangePasswordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ChangePasswordDialog({ open, onOpenChange }: ChangePasswordDialogProps) {
  const { user, updateUser, logout } = useAuth()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess(false)
    if (!user) return
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("All fields are required.")
      return
    }
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.")
      return
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }
    if (currentPassword === newPassword) {
      setError("New password must be different from current password.")
      return
    }
    setLoading(true)
    try {
      // Update password in Firebase Auth
      if (!auth || !auth.currentUser) throw new Error('Auth is not initialized.');
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(auth.currentUser.email || '', currentPassword)
      await reauthenticateWithCredential(auth.currentUser, credential)
      await updatePassword(auth.currentUser, newPassword)
      setSuccess(true)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setTimeout(() => {
        logout()
        onOpenChange(false)
        alert("Password changed successfully. Please sign in again with your new password.")
      }, 1200)
    } catch (err) {
      if ((err as any)?.code === 'auth/wrong-password') {
        setError("Current password is incorrect.")
      } else {
        setError("Failed to change password. Please try again.")
      }
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
          <DialogDescription>Update your account password.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block mb-1 text-xs font-medium text-gray-700">Current Password</label>
            <div className="relative">
              <Input
                type={showCurrent ? "text" : "password"}
                autoCapitalize="none"
                autoCorrect="off"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="pr-10 text-xs"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowCurrent(v => !v)}
                tabIndex={-1}
                aria-label={showCurrent ? "Hide password" : "Show password"}
              >
                {showCurrent ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
              </Button>
            </div>
          </div>
          <div>
            <label className="block mb-1 text-xs font-medium text-gray-700">New Password</label>
            <div className="relative">
              <Input
                type={showNew ? "text" : "password"}
                autoCapitalize="none"
                autoCorrect="off"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="pr-10 text-xs"
                required
                minLength={6}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowNew(v => !v)}
                tabIndex={-1}
                aria-label={showNew ? "Hide password" : "Show password"}
              >
                {showNew ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
              </Button>
            </div>
          </div>
          <div>
            <label className="block mb-1 text-xs font-medium text-gray-700">Confirm New Password</label>
            <Input
              type="password"
              autoCapitalize="none"
              autoCorrect="off"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="text-xs"
              required
            />
          </div>
          {error && <div className="text-xs text-red-600 bg-red-50 p-2 rounded-lg">{error}</div>}
          {success && <div className="text-xs text-green-700 bg-green-50 p-2 rounded-lg">Password changed successfully!</div>}
          <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white text-xs font-semibold py-2" disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
} 