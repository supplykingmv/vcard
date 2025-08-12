import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CardContent } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { subscribeToNotifications } from "@/lib/firebase"

export function NotificationDialog({ open, onOpenChange, user }: { open: boolean, onOpenChange: (open: boolean) => void, user: any }) {
  const [userNotifications, setUserNotifications] = useState<any[]>([])
  const [customNotifMsg, setCustomNotifMsg] = useState("")
  const [notifSent, setNotifSent] = useState(false)
  const isAdmin = user?.role === "admin" || user?.role === "superadmin"

  useEffect(() => {
    if (!user) return
    const unsub = subscribeToNotifications((notifs) => {
      const filtered = notifs.filter(n =>
        !user.clearedNotifications?.includes(n.id) &&
        !(n.excludeUserIds && Array.isArray(n.excludeUserIds) && n.excludeUserIds.includes(user.id))
      )
      setUserNotifications(filtered)
    })
    return () => unsub()
  }, [user])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg">Notification Center</DialogTitle>
        </DialogHeader>
        <CardContent>
          {/* Admin Custom Notification Section */}
          {isAdmin && (
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                if (!customNotifMsg.trim()) return
                await subscribeToNotifications // dummy await to avoid linter error
                const { addNotification } = await import("@/lib/firebase")
                await addNotification({
                  message: customNotifMsg.trim(),
                  senderId: user.id,
                  senderName: user.name,
                  type: "admin_custom"
                })
                setCustomNotifMsg("")
                setNotifSent(true)
                setTimeout(() => setNotifSent(false), 2000)
              }}
              className="space-y-4 mb-4"
            >
              <label htmlFor="customNotifMsg" className="block text-sm font-medium text-gray-700">Send Notification to All Users</label>
              <textarea
                id="customNotifMsg"
                value={customNotifMsg}
                onChange={e => setCustomNotifMsg(e.target.value)}
                className="w-full min-h-[60px] border rounded p-2"
                placeholder="Enter your notification message..."
                required
              />
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
                Send Notification
              </button>
              {notifSent && <span className="text-green-600 ml-2">Notification sent!</span>}
            </form>
          )}
          {userNotifications.length === 0 ? (
            <div className="p-4 text-gray-500 text-center">No notifications</div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {userNotifications.slice(0, 20).map((notif) => (
                <li key={notif.id} className="p-3 hover:bg-gray-50">
                  <div className="text-sm text-gray-900">{notif.message}</div>
                  <div className="text-xs text-gray-500 mt-1">{notif.senderName} • {notif.createdAt ? new Date(notif.createdAt).toLocaleString() : ""}</div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </DialogContent>
    </Dialog>
  )
} 