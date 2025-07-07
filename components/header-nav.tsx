"use client"

import { useState } from "react"
import { LogOut, Settings, Users, User } from "lucide-react"
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

export function HeaderNav() {
  const { user, logout } = useAuth()
  const [showUserManagement, setShowUserManagement] = useState(false)
  const [showUserProfile, setShowUserProfile] = useState(false)
  const [showSignOutDialog, setShowSignOutDialog] = useState(false)

  if (!user) return null

  const handleLogout = () => {
    setShowSignOutDialog(true)
  }

  const confirmSignOut = () => {
    logout()
    setShowSignOutDialog(false)
  }

  return (
    <>
      <div className="flex items-center space-x-4">
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
            <DropdownMenuItem className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            {user.role === "admin" && (
              <DropdownMenuItem className="cursor-pointer" onClick={() => setShowUserManagement(true)}>
                <Users className="mr-2 h-4 w-4" />
                <span>Manage Users</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer text-red-600" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <UserManagementDialog open={showUserManagement} onOpenChange={setShowUserManagement} />
      <UserProfileDialog open={showUserProfile} onOpenChange={setShowUserProfile} />

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
