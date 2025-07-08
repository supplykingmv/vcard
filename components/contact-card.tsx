"use client"

import { useState } from "react"
import { Mail, Phone, Building, Edit, Trash2, QrCode, Pin } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import type { Contact } from "@/types/contact"
import { EditContactDialog } from "./edit-contact-dialog"
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import { QRCodeCanvas } from "qrcode.react"

interface ContactCardProps {
  contact: Contact
  onEdit: (contact: Contact) => void
  onDelete: (id: string) => void
  onShare: (contact: Contact) => void
  variant?: "default" | "large"
  showActions?: boolean
}

export function ContactCard({ contact, onEdit, onDelete, onShare, variant = "default", showActions = true }: ContactCardProps) {
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Work":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "Business":
        return "bg-green-100 text-green-800 border-green-200"
      case "Personal":
        return "bg-purple-100 text-purple-800 border-purple-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const handleEdit = (updatedContact: Contact) => {
    onEdit(updatedContact)
    setShowEditDialog(false)
  }

  // Business card dimensions: 3.4" x 2.1" at 96 DPI = 326px x 202px (landscape)
  const cardStyle = {
    width: "326px",
    height: "202px",
    minWidth: "326px",
    minHeight: "202px",
    maxWidth: "326px",
    maxHeight: "202px",
  }

  return (
    <>
      <Card
        className="group hover:shadow-xl transition-all duration-300 bg-white/90 backdrop-blur-sm border-white/20 hover:bg-white/95 relative overflow-hidden"
        style={cardStyle}
        data-contact-id={contact.id}
      >
        <CardContent
          className="p-3 h-full flex flex-col"
          style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
        >
          {/* Header with Avatar, Name and QR Code */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center flex-1 min-w-0">
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-gray-900 text-base leading-tight truncate" title={contact.name}>{contact.name}</h3>
                <p className="text-xs text-gray-600 leading-tight truncate" title={contact.title}>{contact.title}</p>
                <div className="flex items-center space-x-1 mt-0.5 min-w-0">
                  <Building className="h-2.5 w-2.5 text-gray-400 flex-shrink-0" />
                  <span className="text-xs font-medium text-gray-700 truncate" title={contact.company}>{contact.company}</span>
                </div>
              </div>
            </div>
            {/* QR Code removed from here */}
          </div>

          {/* Contact Information */}
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center space-x-1.5 min-w-0">
              <Mail className="h-3 w-3 text-gray-400 flex-shrink-0" />
              <a
                href={`mailto:${contact.email}`}
                className="text-xs text-green-600 hover:underline break-all leading-tight truncate min-w-0"
                style={{ wordBreak: "break-all" }}
                title={contact.email}
              >
                {contact.email}
              </a>
            </div>

            <div className="flex items-center space-x-1.5 min-w-0">
              <Phone className="h-3 w-3 text-gray-400 flex-shrink-0" />
              <a href={`tel:${contact.phone}`} className="text-xs text-green-600 hover:underline truncate min-w-0" title={contact.phone}>
                {contact.phone}
              </a>
            </div>

            {contact.address && (
              <div className="flex items-start space-x-1.5 min-w-0">
                <div className="h-3 w-3 text-gray-400 flex-shrink-0 mt-0.5 text-xs">📍</div>
                <span className="text-xs text-gray-600 leading-tight truncate" title={contact.address}>{contact.address}</span>
              </div>
            )}

            {/* Notes - will be hidden in business card download */}
            {contact.notes && (
              <div className="mt-1.5 pt-1.5 border-t border-gray-200" data-notes-section>
                <p className="text-xs text-gray-500 italic leading-tight">"{contact.notes}"</p>
              </div>
            )}
          </div>

          {/* Bottom section with category and date */}
          <div
            className="flex items-center justify-between pt-1.5 border-t border-gray-100 mt-auto min-h-0 relative"
            data-bottom-section
          >
            <Badge
              variant="outline"
              className={`${getCategoryColor(contact.category)} text-xs px-1 py-0 flex items-center gap-1`}
              data-category-badge
            >
              {contact.category}
              {contact.pinned && contact.category === "My Card" && (
                <Pin className="inline-block ml-1 text-yellow-500 w-3.5 h-3.5" fill="#facc15" />
              )}
            </Badge>
            <span className="text-xs text-gray-400 flex-shrink-0 ml-2" data-date-added>
              {contact.dateAdded ? new Date(contact.dateAdded).toLocaleDateString() : ""}
            </span>
            {showActions && (
              <div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 bg-white/90 rounded-full p-2 shadow-lg"
                style={{ pointerEvents: 'auto' }}
              >
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setShowEditDialog(true)}
                  className="h-9 w-9 p-0 hover:bg-blue-100"
                  aria-label="Edit"
                >
                  <Edit className="h-[1.24rem] w-[1.24rem]" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onShare(contact)}
                  className="h-9 w-9 p-0 hover:bg-green-100"
                  aria-label="Share"
                >
                  <QrCode className="h-[1.24rem] w-[1.24rem]" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setShowDeleteDialog(true)}
                  className="h-9 w-9 p-0 hover:bg-red-100 text-red-600"
                  aria-label="Delete"
                >
                  <Trash2 className="h-[1.24rem] w-[1.24rem]" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <EditContactDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        contact={contact}
        onEditContact={handleEdit}
      />
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contact</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <b>{contact.name}</b>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => {
                setShowDeleteDialog(false)
                onDelete(contact.id)
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
