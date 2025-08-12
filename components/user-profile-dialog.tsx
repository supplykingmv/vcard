"use client"

import { useState, useEffect } from "react"
import { User, Mail, Shield, Calendar, Eye, EyeOff, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAuth } from "@/contexts/auth-context"
import { addContact, updateContact, getContacts, subscribeToNotifications } from "@/lib/firebase"
import { QRCodeCanvas } from "qrcode.react"
import { ContactCard } from "@/components/contact-card"
import { FaWhatsapp, FaTelegramPlane, FaViber, FaFacebookF } from "react-icons/fa"
import { BusinessCardExport } from "./BusinessCardExport"
import html2canvas from "html2canvas"
import React, { useRef } from "react"

interface UserProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UserProfileDialog({ open, onOpenChange }: UserProfileDialogProps) {
  const { user, updateUser } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    website: "",
    address: "",
    company: "",
    title: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [customNotifMsg, setCustomNotifMsg] = useState("")
  const [notifSent, setNotifSent] = useState(false)
  const [userNotifications, setUserNotifications] = useState<any[]>([])
  const businessCardRef = useRef<HTMLDivElement>(null)
  const [showShareButtons, setShowShareButtons] = useState(true)

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        website: user.website || "",
        address: user.address || "",
        company: user.company || "",
        title: user.title || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
    }
  }, [user])

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

  useEffect(() => {
    if (open) setShowShareButtons(true)
  }, [open])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Name is required"
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid"
    }

    if (formData.newPassword) {
      if (!formData.currentPassword) {
        newErrors.currentPassword = "Current password is required to change password"
      }
      if (formData.newPassword.length < 6) {
        newErrors.newPassword = "New password must be at least 6 characters"
      }
      if (formData.newPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!user || !validateForm()) return

    // Verify current password if changing password
    if (formData.newPassword && formData.currentPassword !== user.password) {
      setErrors({ currentPassword: "Current password is incorrect" })
      return
    }

    const updateData: any = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      website: formData.website,
      address: formData.address,
      company: formData.company,
      title: formData.title,
    }

    if (formData.newPassword) {
      updateData.password = formData.newPassword
    }

    // Check if any profile fields (not password) have changed
    const profileFieldsChanged =
      user.name !== formData.name ||
      user.email !== formData.email ||
      user.phone !== formData.phone ||
      user.website !== formData.website ||
      user.address !== formData.address ||
      user.company !== formData.company ||
      user.title !== formData.title

    const success = await updateUser(user.id, updateData)
    if (success) {
      if (profileFieldsChanged) {
        try {
          // Fetch all contacts for the user
          const contacts = await getContacts({ id: user.id, role: user.role })
          // Find existing business card (My Card) by email and phone
          const existingCard = contacts.find(
            c => c.email === formData.email && c.phone === formData.phone && c.category === "My Card"
          )
          if (existingCard) {
            await updateContact(existingCard.id, {
              name: formData.name,
              title: formData.title,
              company: formData.company,
              email: formData.email,
              phone: formData.phone,
              category: "My Card",
              website: formData.website,
              address: formData.address,
              notes: "",
            })
          } else {
            await addContact(user.id, {
              name: formData.name,
              title: formData.title,
              company: formData.company,
              email: formData.email,
              phone: formData.phone,
              category: "My Card",
              website: formData.website,
              address: formData.address,
              notes: "",
            })
          }
        } catch (e) {
          // Optionally handle error
        }
      }
      setIsEditing(false)
      setFormData({
        ...formData,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
      setErrors({})
    }
  }

  const handleCancel = () => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        website: user.website || "",
        address: user.address || "",
        company: user.company || "",
        title: user.title || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
    }
    setIsEditing(false)
    setErrors({})
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

  // Share handler
  const handleShareBusinessCard = async (platform: 'whatsapp' | 'telegram' | 'viber' | 'facebook') => {
    setShowShareButtons(false)
    await new Promise((resolve) => setTimeout(resolve, 100)) // allow UI to update
    if (!user) return
    try {
      // Render business card to image
      const container = businessCardRef.current
      if (!container) return
      const canvas = await html2canvas(container, {
        width: 326,
        height: 202,
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        allowTaint: true,
        foreignObjectRendering: false,
        logging: false,
        imageTimeout: 15000,
      })
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png", 1.0))
      if (!blob) throw new Error("Failed to generate image blob")
      const file = new File([blob], `${user.name.replace(/\s+/g, "_")}_business_card.png`, { type: "image/png" })
      // Try Web Share API
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Contact Card: ${user.name}`,
          text: `Contact card for ${user.name}`,
        })
        return
      }
      // Fallback: open social app share URL
      let shareUrl = ""
      if (platform === "whatsapp") {
        shareUrl = `https://wa.me/?text=Contact%20card%20for%20${encodeURIComponent(user.name)}`
      } else if (platform === "telegram") {
        shareUrl = `https://t.me/share/url?url=&text=Contact%20card%20for%20${encodeURIComponent(user.name)}`
      } else if (platform === "viber") {
        shareUrl = `viber://forward?text=Contact%20card%20for%20${encodeURIComponent(user.name)}`
      } else if (platform === "facebook") {
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=&quote=Contact%20card%20for%20${encodeURIComponent(user.name)}`
      }
      window.open(shareUrl, "_blank")
    } catch (error) {
      alert("Failed to share business card. Please try again.")
    }
  }

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto p-2 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-xl font-semibold text-gray-900 flex items-center gap-2">
            <User className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
            User Profile
          </DialogTitle>
          <DialogDescription>View and manage your profile information.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Profile Header */}
          <Card className="bg-gradient-to-r from-green-50 to-white border-green-200 w-full">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start sm:space-x-4 space-y-4 sm:space-y-0">
                <Avatar className="h-16 w-16 ring-4 ring-green-500/20">
                  <AvatarFallback className="bg-gradient-to-br from-green-500 to-green-600 text-white font-bold text-base sm:text-xl">
                    {user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 w-full">
                  <h3 className="text-base sm:text-xl font-semibold text-gray-900">{user.name}</h3>
                  <p className="text-xs sm:text-sm text-gray-600">{user.email}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <Badge
                      variant="outline"
                      className={
                        user.role === "admin"
                          ? "bg-red-100 text-red-800 border-red-200"
                          : "bg-blue-100 text-blue-800 border-blue-200"
                      }
                    >
                      <Shield className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      {user.role}
                    </Badge>
                    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 text-xs sm:text-sm">
                      Active
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isEditing ? (
                // View Mode
                <div className="space-y-4 relative">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs sm:text-sm font-medium text-gray-700">Full Name</Label>
                      <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-xs sm:text-sm text-gray-900">{user.name}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs sm:text-sm font-medium text-gray-700">Email Address</Label>
                      <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-xs sm:text-sm text-gray-900">{user.email}</span>
                      </div>
                    </div>
                  </div>

                  {/* In the profile view mode, display Organization and Job Title */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs sm:text-sm font-medium text-gray-700">Organization</Label>
                      <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                        <span className="text-xs sm:text-sm text-gray-900">{user.company || "-"}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs sm:text-sm font-medium text-gray-700">Job Title</Label>
                      <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                        <span className="text-xs sm:text-sm text-gray-900">{user.title || "-"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs sm:text-sm font-medium text-gray-700">Account Created</Label>
                    <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-xs sm:text-sm text-gray-900">{formatDate(user.dateAdded)}</span>
                    </div>
                  </div>
                  {/* Update Profile Button */}
                  <button
                    className="absolute right-0 bottom-0 text-green-700 hover:underline text-sm font-medium px-3 py-1 bg-transparent border-none cursor-pointer"
                    onClick={() => setIsEditing(true)}
                    type="button"
                  >
                    Update Profile
                  </button>
                </div>
              ) : (
                // Edit Mode
                <form className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Enter your full name"
                        className={errors.name ? "border-red-500" : ""}
                      />
                      {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="Enter your email"
                        className={errors.email ? "border-red-500" : ""}
                      />
                      {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="Enter your phone number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        placeholder="Enter your website"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="company">Organization</Label>
                      <Input
                        id="company"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        placeholder="Enter your organization"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="title">Job Title</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Enter your job title"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Enter your address"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-4">
                    <Button type="button" onClick={handleSave} className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto text-xs sm:text-sm">
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                    <Button type="button" variant="outline" onClick={handleCancel} className="w-full sm:w-auto text-xs sm:text-sm">
                      Cancel
                    </Button>
                  </div>
                  {/* Contact Card & QR Code Preview */}
                  {/* Removed business card preview from edit form */}
                </form>
              )}
            </CardContent>
          </Card>
        </div>
        {/* Notification Center Section */}
        {/* Removed Notification Center from profile dialog */}
        {/* Admin Custom Notification Section */}
        {/* Removed Send Notification to All Users section from User Profile Dialog */}
      </DialogContent>
    </Dialog>
  )
}
