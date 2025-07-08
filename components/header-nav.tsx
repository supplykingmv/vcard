"use client"

import { useState } from "react"
import { LogOut, Settings, Users, User, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { UserManagementDialog } from "@/components/user-management-dialog"
import { useAuth } from "@/contexts/auth-context"
import { UserProfileDialog } from "@/components/user-profile-dialog"
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog"
import { subscribeToNotifications, getNotifications } from "@/lib/firebase"
import { useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { NotificationDialog } from "@/components/notification-dialog"
import { ChangePasswordDialog } from "./change-password-dialog"

export function HeaderNav() {
  const { user, logout, updateUser } = useAuth()
  const [showUserManagement, setShowUserManagement] = useState(false)
  const [showUserProfile, setShowUserProfile] = useState(false)
  const [showSignOutDialog, setShowSignOutDialog] = useState(false)
  const [showNotifDropdown, setShowNotifDropdown] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [unread, setUnread] = useState(false)
  const [readIds, setReadIds] = useState<string[]>([])
  const [cleared, setCleared] = useState(false)
  const { toast } = useToast()
  const [showNotificationDialog, setShowNotificationDialog] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)

  useEffect(() => {
    // Fetch initial notifications
    getNotifications().then(setNotifications)
    // Subscribe to notifications
    const unsub = subscribeToNotifications((notifs) => {
      // If notifications are cleared, don't show badge or highlight
      if (cleared) return setNotifications(notifs)
      // Show toast and badge for new notification
      if (notifs.length > 0 && notifications.length > 0 && notifs[0].id !== notifications[0].id) {
        toast({
          title: "New Notification",
          description: notifs[0].message,
        })
        setUnread(true)
      }
      setNotifications(notifs)
    })
    return () => unsub()
  }, [cleared])

  if (!user) return null

  const handleLogout = () => {
    setShowSignOutDialog(true)
  }

  const confirmSignOut = () => {
    logout()
    setShowSignOutDialog(false)
  }

  // Filter notifications to exclude those cleared by the user and those with excludeUserIds containing the current user
  const visibleNotifications = notifications.filter(n =>
    !user?.clearedNotifications?.includes(n.id) &&
    !(n.excludeUserIds && Array.isArray(n.excludeUserIds) && n.excludeUserIds.includes(user?.id))
  )

  return (
    <>
      <div className="flex items-center space-x-4">
        {/* Notification Bell */}
        <div className="relative">
          <Button variant="ghost" className="h-10 w-10 rounded-full" onClick={() => { setShowNotifDropdown((v) => !v); setUnread(false); setReadIds(visibleNotifications.map(n => n.id)); }} aria-label="Notifications">
            {/* Green circle background */}
            <span className="absolute inset-0 rounded-full" style={{ background: 'rgba(16, 185, 129, 0.2)' }} />
            <Bell className="h-6 w-6 text-gray-700 relative z-10" />
            {(unread || notifications.some(n => !readIds.includes(n.id))) && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full z-20" />}
          </Button>
          {showNotifDropdown && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
              <div className="flex items-center justify-between p-3 border-b font-semibold text-gray-800">
                <span>Notifications</span>
                <div className="flex gap-2">
                  <button className="text-xs text-blue-600 hover:underline" onClick={() => { setReadIds(visibleNotifications.map(n => n.id)); setUnread(false); }}>Mark all as read</button>
                  <button className="text-xs text-red-600 hover:underline" onClick={async () => {
                    if (user && updateUser) {
                      await updateUser(user.id, { clearedNotifications: [...new Set([...(user.clearedNotifications || []), ...notifications.map(n => n.id)])] })
                    }
                    setNotifications([]); setReadIds([]); setCleared(true);
                  }}>Clear all</button>
                </div>
              </div>
              {visibleNotifications.length === 0 ? (
                <div className="p-4 text-gray-500 text-center">No notifications</div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {visibleNotifications.slice(0, 10).map((notif) => (
                    <li key={notif.id} className={`p-3 hover:bg-gray-50 ${!readIds.includes(notif.id) ? 'bg-green-50 font-semibold' : ''}` }>
                      <div className="text-sm text-gray-900">{notif.message}</div>
                      <div className="text-xs text-gray-500 mt-1">{notif.senderName} • {notif.createdAt ? new Date(notif.createdAt).toLocaleString() : ""}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-gray-900">{user.name}</p>
          <div className="flex items-center justify-end space-x-2">
            <p className="text-xs text-gray-600">{user.email}</p>
            <Badge
              variant="outline"
              className={
                user.role === "admin"
                  ? "bg-red-100 text-red-800 border-red-200 text-xs"
                  : "bg-blue-100 text-blue-800 border-blue-200 text-xs"
              }
            >
              {user.role}
            </Badge>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10 ring-2 ring-green-500/20">
                <AvatarFallback className="bg-gradient-to-br from-green-500 to-green-600 text-white font-semibold uppercase">
                  {user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <div className="flex items-center justify-start gap-2 p-2">
              <div className="flex flex-col space-y-1 leading-none">
                <p className="font-medium">{user.name}</p>
                <p className="w-[200px] truncate text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer" onClick={() => setShowUserProfile(true)}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            {(user.role === "admin" || user.role === "superadmin") && (
              <DropdownMenuItem className="cursor-pointer" onClick={() => setShowNotificationDialog(true)}>
                <Bell className="mr-2 h-4 w-4" />
                <span>Notification</span>
              </DropdownMenuItem>
            )}
            {user.role === "admin" && (
              <DropdownMenuItem className="cursor-pointer" onClick={() => setShowUserManagement(true)}>
                <Users className="mr-2 h-4 w-4" />
                <span>Manage Users</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer" onClick={() => setShowChangePassword(true)}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Change Password</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer text-red-600" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <UserManagementDialog open={showUserManagement} onOpenChange={setShowUserManagement} />
      <UserProfileDialog open={showUserProfile} onOpenChange={setShowUserProfile} />
      <NotificationDialog open={showNotificationDialog} onOpenChange={setShowNotificationDialog} user={user} />
      <ChangePasswordDialog open={showChangePassword} onOpenChange={setShowChangePassword} />

      {/* Custom Sign Out Dialog */}
      <AlertDialog open={showSignOutDialog} onOpenChange={setShowSignOutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-green-700 flex items-center gap-2">
              <LogOut className="h-5 w-5 text-green-600" />
              Sign Out
            </AlertDialogTitle>
          </AlertDialogHeader>
          <div className="py-2 text-gray-700 text-base">
            Are you sure you want to sign out?
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-100 text-gray-700 hover:bg-gray-200">Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-green-600 hover:bg-green-700 text-white" onClick={confirmSignOut}>Sign Out</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
