"use client"

import React from "react"

import { useState } from "react"
import { Plus, Edit, Trash2, Users, Shield, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { useAuth } from "@/contexts/auth-context"
import type { User as UserType } from "@/types/user"

interface UserManagementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UserManagementDialog({ open, onOpenChange }: UserManagementDialogProps) {
  const { user: currentUser, getUsers, addUser, updateUser, deleteUser } = useAuth()
  const [users, setUsers] = useState<UserType[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingUser, setEditingUser] = useState<UserType | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user" as "admin" | "user",
    isActive: true,
  })

  // Refresh users when dialog opens
  React.useEffect(() => {
    if (open) {
      (async () => {
        setUsers(await getUsers())
      })()
    }
  }, [open, getUsers])

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "user",
      isActive: true,
    })
    setShowAddForm(false)
    setEditingUser(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (editingUser) {
      // Update existing user
      const success = await updateUser(editingUser.id, {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        isActive: formData.isActive,
        ...(formData.password && { password: formData.password }),
      })
      if (success) {
        setUsers(await getUsers())
        resetForm()
      }
    } else {
      // Add new user
      const success = await addUser(formData)
      if (success) {
        setUsers(await getUsers())
        resetForm()
      } else {
        alert("Failed to add user. Email might already exist.")
      }
    }
  }

  const handleEdit = (user: UserType) => {
    setEditingUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      isActive: user.isActive,
    })
    setShowAddForm(true)
  }

  const handleDelete = async (userId: string) => {
    if (confirm("Are you sure you want to delete this user?")) {
      const success = await deleteUser(userId)
      if (success) {
        setUsers(await getUsers())
      }
    }
  }

  const getRoleColor = (role: string) => {
    return role === "admin" ? "bg-red-100 text-red-800 border-red-200" : "bg-blue-100 text-blue-800 border-blue-200"
  }

  const getStatusColor = (isActive: boolean) => {
    return isActive ? "bg-green-100 text-green-800 border-green-200" : "bg-gray-100 text-gray-800 border-gray-200"
  }

  // Helper function to safely format date
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return "Unknown"
    try {
      const dateObj = date instanceof Date ? date : new Date(date)
      return dateObj.toLocaleDateString()
    } catch (error) {
      return "Unknown"
    }
  }

  if (currentUser?.role !== "admin") {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Users className="h-5 w-5 text-green-600" />
            User Management
          </DialogTitle>
          <DialogDescription>Manage users who can access the Contact Manager application.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add User Button */}
          {!showAddForm && (
            <Button onClick={() => setShowAddForm(true)} className="bg-green-600 hover:bg-green-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Add New User
            </Button>
          )}

          {/* Add/Edit User Form */}
          {showAddForm && (
            <Card className="bg-gray-50/50">
              <CardHeader>
                <CardTitle className="text-lg">{editingUser ? "Edit User" : "Add New User"}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="John Doe"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="john@example.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="password">Password {editingUser ? "(leave blank to keep current)" : "*"}</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Enter password"
                        required={!editingUser}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Select
                        value={formData.role}
                        onValueChange={(value) => setFormData({ ...formData, role: value as "admin" | "user" })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                    />
                    <Label htmlFor="isActive">Active User</Label>
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white">
                      {editingUser ? "Update User" : "Add User"}
                    </Button>
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Users List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Current Users ({users.length})</h3>
            <div className="grid gap-4">
              {users.map((user) => (
                <Card key={user.id} className="bg-white/80 backdrop-blur-sm border-white/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                          {user.role === "admin" ? (
                            <Shield className="h-5 w-5 text-white" />
                          ) : (
                            <User className="h-5 w-5 text-white" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{user.name}</h4>
                          <p className="text-sm text-gray-600">{user.email}</p>
                          <p className="text-xs text-gray-500">Added: {formatDate(user.dateAdded)}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <Badge variant="outline" className={getRoleColor(user.role)}>
                          {user.role}
                        </Badge>
                        <Badge variant="outline" className={getStatusColor(user.isActive)}>
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>

                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(user)}
                            className="h-8 w-8 p-0 hover:bg-blue-100"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          {user.id !== currentUser?.id && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(user.id)}
                              className="h-8 w-8 p-0 hover:bg-red-100 text-red-600"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
