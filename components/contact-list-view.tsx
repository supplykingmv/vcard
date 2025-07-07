"use client"

import { useState } from "react"
import { Mail, Phone, Building, Edit, Trash2, QrCode } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Contact } from "@/types/contact"
import { EditContactDialog } from "./edit-contact-dialog"

interface ContactListViewProps {
  contacts: Contact[]
  onEdit: (contact: Contact) => void
  onDelete: (id: string) => void
  onShare: (contact: Contact) => void
}

export function ContactListView({ contacts, onEdit, onDelete, onShare }: ContactListViewProps) {
  const [editingContact, setEditingContact] = useState<Contact | null>(null)

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
    setEditingContact(null)
  }

  return (
    <>
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 overflow-hidden">
        <div className="divide-y divide-gray-100">
          {contacts.map((contact) => (
            <div key={contact.id} className="group p-4 hover:bg-gray-50/50 transition-colors relative">
              {/* Action Icons - always visible, right end */}
              <div className="absolute top-1 right-2 z-20 flex space-x-1">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setEditingContact(contact)}
                  className="h-8 w-8 p-0 hover:bg-blue-100"
                  aria-label="Edit"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onShare(contact)}
                  className="h-8 w-8 p-0 hover:bg-green-100"
                  aria-label="Share"
                >
                  <QrCode className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onDelete(contact.id)}
                  className="h-8 w-8 p-0 hover:bg-red-100 text-red-600"
                  aria-label="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1 min-w-0">
                  <Avatar className="h-10 w-10 ring-2 ring-green-500/20">
                    <AvatarFallback className="bg-gradient-to-br from-green-500 to-green-600 text-white font-semibold text-sm">
                      {contact.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">{contact.name}</h3>
                      <Badge variant="outline" className={`${getCategoryColor(contact.category)} text-xs`}>
                        {contact.category}
                      </Badge>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Building className="h-3 w-3" />
                        <span className="truncate">
                          {contact.title} at {contact.company}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{contact.email}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        <span>{contact.phone}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <EditContactDialog
        open={!!editingContact}
        onOpenChange={(open) => !open && setEditingContact(null)}
        contact={editingContact}
        onEditContact={handleEdit}
      />
    </>
  )
}
