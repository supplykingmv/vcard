"use client"

import { useState, useEffect } from "react"
import { Plus, Search, Filter, Users, Scan } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ContactCard } from "@/components/contact-card"
import { ContactListView } from "@/components/contact-list-view"
import { ContactTableView } from "@/components/contact-table-view"
import { AddContactDialog } from "@/components/add-contact-dialog"
import { FilterSortPanel } from "@/components/filter-sort-panel"
import { QRCodeDialog } from "@/components/qr-code-dialog"
import { QRScannerDialog } from "@/components/qr-scanner-dialog"
import { ViewSelector } from "@/components/view-selector"
import { Logo } from "@/components/logo"
import { HeaderNav } from "@/components/header-nav"
import type { Contact } from "@/types/contact"
import { useAuth } from "@/contexts/auth-context"
import { addContact, updateContact, deleteContact, getContacts, subscribeToOnlineUsers, addNotification } from "@/lib/firebase"
import dynamic from 'next/dynamic'
const PullToRefresh = dynamic(() => import('react-pull-to-refresh'), { ssr: false })
import { useIsMobile } from '@/components/ui/use-mobile'

export type ViewType = "grid" | "list" | "cards" | "table"

export default function ContactManager() {
  const { user } = useAuth()
  const isMobile = useIsMobile()
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [showQRDialog, setShowQRDialog] = useState(false)
  const [showQRScanner, setShowQRScanner] = useState(false)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [sortBy, setSortBy] = useState<string>("name")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [groupBy, setGroupBy] = useState<string>("none")
  const [viewType, setViewType] = useState<ViewType>("grid")
  const [onlineUsers, setOnlineUsers] = useState<{ userId: string, lastActive: any }[]>([])
  const [manualData, setManualData] = useState<string>("")
  const [scanMode, setScanMode] = useState<string>("")
  const [cameraError, setCameraError] = useState<string>("")

  // Load contacts from Firestore on mount and when user changes
  useEffect(() => {
    if (user) {
      getContacts({ id: user.id, role: user.role }).then(setContacts)
      // Subscribe to online users
      const unsub = subscribeToOnlineUsers(setOnlineUsers)
      return () => unsub()
    }
  }, [user])

  const filteredAndSortedContacts = contacts
    .filter((contact) => {
      // Hide 'My Card' if the logged-in user's email does not match
      if (contact.category === "My Card" && (!user || contact.email !== user.email)) {
        return false
      }
      const matchesSearch =
        contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.email.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = filterCategory === "all" || contact.category === filterCategory
      return matchesSearch && matchesCategory
    })
    .map((contact) => {
      // Only show 'My Card' if logged in user's email matches the contact's email
      if (user && contact.email === user.email) {
        return { ...contact, category: "My Card", pinned: true } as Contact
      }
      return contact
    })
    .sort((a, b) => {
      // Pinned (My Business Card) always first
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name)
        case "company":
          return a.company.localeCompare(b.company)
        case "dateAdded":
          return b.dateAdded.getTime() - a.dateAdded.getTime()
        default:
          return 0
      }
    })

  const groupedContacts =
    groupBy === "category"
      ? filteredAndSortedContacts.reduce(
          (groups, contact) => {
            const category = contact.category || "Uncategorized"
            if (!groups[category]) {
              groups[category] = []
            }
            groups[category].push(contact)
            return groups
          },
          {} as Record<string, Contact[]>,
        )
      : { "All Contacts": filteredAndSortedContacts }

  const handleAddContact = async (contact: Omit<Contact, "id" | "dateAdded">) => {
    if (!user) return
    await addContact(user.id, contact)
    setContacts(await getContacts({ id: user.id, role: user.role }))
    // Send notification to all users except the user who added the contact
    await addNotification({
      message: `${user.name} added a new contact.`,
      senderId: user.id,
      senderName: user.name,
      type: "contact_add",
      excludeUserIds: [user.id],
    })
  }

  const handleEditContact = async (updatedContact: Contact) => {
    if (!user) return
    await updateContact(updatedContact.id, updatedContact)
    setContacts(await getContacts({ id: user.id, role: user.role }))
  }

  const handleDeleteContact = async (id: string) => {
    if (!user) return
    await deleteContact(id)
    setContacts(await getContacts({ id: user.id, role: user.role }))
  }

  const handleShareContact = (contact: Contact) => {
    setSelectedContact(contact)
    setShowQRDialog(true)
  }

  const renderContactsView = () => {
    if (viewType === "table") {
      return (
        <ContactTableView
          contacts={filteredAndSortedContacts}
          onEdit={handleEditContact}
          onDelete={handleDeleteContact}
          onShare={handleShareContact}
        />
      )
    }

    return (
      <div className="space-y-6">
        {Object.entries(groupedContacts).map(([groupName, groupContacts]) => (
          <div key={groupName}>
            {groupBy !== "none" && (
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-5 w-5 text-green-600" />
                <h2 className="text-xl font-semibold text-gray-800">{groupName}</h2>
                <div className="h-px bg-gradient-to-r from-green-500 to-transparent flex-1 ml-4" />
              </div>
            )}

            {viewType === "list" && (
              <ContactListView
                contacts={groupContacts}
                onEdit={handleEditContact}
                onDelete={handleDeleteContact}
                onShare={handleShareContact}
              />
            )}

            {(viewType === "grid" || viewType === "cards") && (
              <div className="flex flex-wrap gap-4 justify-start">
                {groupContacts.map((contact) => (
                  <ContactCard
                    key={contact.id}
                    contact={contact}
                    onEdit={handleEditContact}
                    onDelete={handleDeleteContact}
                    onShare={handleShareContact}
                    variant={viewType === "cards" ? "large" : "default"}
                    showActions={user?.role !== "viewer"}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  // Add a refresh handler
  const handleRefresh = async () => {
    if (user) {
      setContacts(await getContacts({ id: user.id, role: user.role }))
    }
  }

  const mainContent = (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #e6f9f0 0%, #d1fae5 50%, #fff 100%)' }}>
      {/* White gradient overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        background: 'linear-gradient(to bottom, #fff 0%, rgba(255,255,255,0.75) 100%)',
      }} />

      {/* Online Users Section (hidden for now) */}
      {/*
      <div className="flex items-center gap-2 px-4 py-2 bg-white/80 border-b border-green-100 shadow-sm">
        <span className="font-semibold text-green-700">Online Users:</span>
        {onlineUsers.length === 0 && <span className="text-gray-400">No users online</span>}
        {onlineUsers.map((u) => (
          <button
            key={u.userId}
            className="flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-br from-green-500 to-green-600 text-white font-bold text-xs uppercase shadow hover:ring-2 hover:ring-green-400 transition"
            title={u.userId}
            // onClick={() => openChatOrShareDialog(u.userId)} // Placeholder for chat/share
          >
            {u.userId
              .split("")[0]
              .toUpperCase()}
          </button>
        ))}
      </div>
      */}

      {/* Background Pattern */}
      <div className="absolute inset-0">
        {/* Geometric Line Pattern */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url('/line-pattern.png')`,
            backgroundSize: "400px 400px",
            backgroundRepeat: "repeat",
            opacity: 0.07,
          }}
        />
        {/* Simple Line Pattern Overlay */}
        <div
          className="absolute inset-10 opacity-10"
          style={{
            backgroundImage: `
          linear-gradient(45deg, #22c55e 1px, transparent 1px),
          linear-gradient(-45deg, #22c55e 1px, transparent 1px)
        `,
            backgroundSize: "20px 20px",
          }}
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Logo size="lg" className="rounded-xl w-10 h-10 sm:w-15 sm:h-15" />
              <div>
                <h1 className="text-xl sm:text-2xl md:text-4xl font-bold text-gray-800 leading-tight">Contact Manager</h1>
                <p className="text-[11px] sm:text-xs md:text-sm text-gray-600 leading-snug">
                  Manage your business cards and<br />contacts with ease
                </p>
              </div>
            </div>

            {/* User Profile Area */}
            <HeaderNav />
          </div>
        </div>

        {/* Search and Actions Bar */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 mb-6 shadow-lg border border-white/20">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search contacts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/50 border-gray-200"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <ViewSelector viewType={viewType} onViewChange={setViewType} />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilterPanel(!showFilterPanel)}
                className="bg-white/50 hover:bg-white/70"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              {user?.role !== "viewer" && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowQRScanner(true)}
                    className="bg-white/50 hover:bg-white/70"
                  >
                    <Scan className="h-4 w-4 mr-2" />
                    Scan QR
                  </Button>
                  <Button onClick={() => setShowAddDialog(true)} className="bg-green-600 hover:bg-green-700 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Contact
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilterPanel && (
          <FilterSortPanel
            sortBy={sortBy}
            setSortBy={setSortBy}
            filterCategory={filterCategory}
            setFilterCategory={setFilterCategory}
            groupBy={groupBy}
            setGroupBy={setGroupBy}
            onClose={() => setShowFilterPanel(false)}
          />
        )}

        {/* Remove the stats/counters section */}
        {/*
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center shadow-lg border border-white/20">
            <div className="text-2xl font-bold text-green-600">{contacts.length}</div>
            <div className="text-sm text-gray-600">Total Contacts</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center shadow-lg border border-white/20">
            <div className="text-2xl font-bold text-green-600">
              {contacts.filter((c) => c.category === "Work").length}
            </div>
            <div className="text-sm text-gray-600">Work</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center shadow-lg border border-white/20">
            <div className="text-2xl font-bold text-green-600">
              {contacts.filter((c) => c.category === "Business").length}
            </div>
            <div className="text-sm text-gray-600">Business</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center shadow-lg border border-white/20">
            <div className="text-2xl font-bold text-green-600">
              {contacts.filter((c) => c.category === "Personal").length}
            </div>
            <div className="text-sm text-gray-600">Personal</div>
          </div>
        </div>
        */}

        {/* Contacts View */}
        {renderContactsView()}

        {filteredAndSortedContacts.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No contacts found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm ? "Try adjusting your search terms" : "Get started by adding your first contact"}
            </p>
            {user?.role !== "viewer" && (
              <Button onClick={() => setShowAddDialog(true)} className="bg-green-600 hover:bg-green-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Add Contact
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <AddContactDialog open={showAddDialog} onOpenChange={setShowAddDialog} onAddContact={handleAddContact} />

      <QRCodeDialog open={showQRDialog} onOpenChange={setShowQRDialog} contact={selectedContact} />

      <QRScannerDialog
        open={showQRScanner}
        onOpenChange={setShowQRScanner}
        onContactScanned={handleAddContact}
      />
    </div>
  )

  return mainContent
}
