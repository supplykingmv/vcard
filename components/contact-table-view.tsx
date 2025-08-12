"use client"

import { useState } from "react"
import { Edit, Trash2, QrCode } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Contact } from "@/types/contact"
import { EditContactDialog } from "./edit-contact-dialog"

interface ContactTableViewProps {
  contacts: Contact[]
  onEdit: (contact: Contact) => void
  onDelete: (id: string) => void
  onShare: (contact: Contact) => void
}

export function ContactTableView({ contacts, onEdit, onDelete, onShare }: ContactTableViewProps) {
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
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50">
                <TableHead className="w-12"></TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Date Added</TableHead>
                <TableHead className="w-32">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map((contact) => (
                <TableRow key={contact.id} className="group hover:bg-gray-50/30 relative">
                  <TableCell>
                    <Avatar className="h-8 w-8 ring-2 ring-green-500/20">
                      <AvatarFallback className="bg-gradient-to-br from-green-500 to-green-600 text-white font-semibold text-xs">
                        {contact.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="font-medium">{contact.name}</TableCell>
                  <TableCell>{contact.title}</TableCell>
                  <TableCell>{contact.company}</TableCell>
                  <TableCell>
                    <a href={`mailto:${contact.email}`} className="text-green-600 hover:underline">
                      {contact.email}
                    </a>
                  </TableCell>
                  <TableCell>
                    <a href={`tel:${contact.phone}`} className="text-green-600 hover:underline">
                      {contact.phone}
                    </a>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`${getCategoryColor(contact.category)} text-xs`}>
                      {contact.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">{contact.dateAdded.toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingContact(contact)}
                        className="h-8 w-8 p-0 hover:bg-blue-100"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onShare(contact)}
                        className="h-8 w-8 p-0 hover:bg-green-100"
                      >
                        <QrCode className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDelete(contact.id)}
                        className="h-8 w-8 p-0 hover:bg-red-100 text-red-600"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
