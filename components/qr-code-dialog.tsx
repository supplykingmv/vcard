"use client"

import { useState, useEffect } from "react"
import { Download, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { Contact } from "@/types/contact"
import { BusinessCardExport } from "./BusinessCardExport"

interface QRCodeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contact: Contact | null
}

export function QRCodeDialog({ open, onOpenChange, contact }: QRCodeDialogProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState("")
  const [copied, setCopied] = useState(false)
  const [contactDataCopied, setContactDataCopied] = useState(false)

  useEffect(() => {
    if (contact) {
      // Create vCard format with all fields
      const vCard = `BEGIN:VCARD
VERSION:3.0
FN:${contact.name}
ORG:${contact.company}
TITLE:${contact.title}
EMAIL:${contact.email}
TEL:${contact.phone}
ADR:;;${contact.address || ""};;;;
NOTE:${contact.notes || ""}
${contact.website ? `URL:${contact.website}` : ""}
END:VCARD`

      // Generate QR code URL using a QR code API
      const encodedVCard = encodeURIComponent(vCard)
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedVCard}`
      setQrCodeUrl(qrUrl)
    }
  }, [contact])

  const handleCopyContactData = async () => {
    if (contact) {
      const contactData = {
        name: contact.name,
        title: contact.title,
        company: contact.company,
        email: contact.email,
        phone: contact.phone,
        address: contact.address,
        notes: contact.notes,
      }

      try {
        await navigator.clipboard.writeText(JSON.stringify(contactData, null, 2))
        setContactDataCopied(true)
        setTimeout(() => setContactDataCopied(false), 2000)
      } catch (err) {
        console.error("Failed to copy contact data:", err)
      }
    }
  }

  const handleCopyQRCode = async () => {
    if (qrCodeUrl) {
      try {
        await navigator.clipboard.writeText(qrCodeUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        console.error("Failed to copy QR code URL:", err)
      }
    }
  }

  const handleDownloadQRCode = () => {
    if (qrCodeUrl && contact) {
      const link = document.createElement("a")
      link.href = qrCodeUrl
      link.download = `${contact.name.replace(/\s+/g, "_")}-qr-code.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const handleDownloadBusinessCard = async () => {
    if (!contact) return

    try {
      // Create an off-screen container
      const container = document.createElement("div")
      container.style.position = "fixed"
      container.style.left = "-9999px"
      container.style.top = "0"
      container.style.width = "326px"
      container.style.height = "202px"
      container.style.zIndex = "-9999"
      document.body.appendChild(container)

      // Render BusinessCardExport into the container using React 18 createRoot
      const ReactDOM = await import("react-dom/client")
      const root = ReactDOM.createRoot(container)
      root.render(<BusinessCardExport contact={contact} />)

      // Wait for render
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Import html2canvas dynamically
      const html2canvas = (await import("html2canvas")).default
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

      // Clean up
      root.unmount()
      document.body.removeChild(container)

      // Download the image
      const link = document.createElement("a")
      link.download = `${contact.name.replace(/\s+/g, "_")}_business_card.png`
      link.href = canvas.toDataURL("image/png", 1.0)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("Error generating business card:", error)
      alert("Failed to generate business card. Please try again.")
    }
  }

  if (!contact) return null

  // Debug: log the contact object being rendered
  console.debug('Share Contact Preview:', contact);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-900">Share Contact</DialogTitle>
          <DialogDescription className="text-sm">
            Share {(contact.name && contact.name.trim()) ? contact.name : contact.company}
            {"'"}s contact information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* QR Code */}
          <div className="flex justify-center">
            <div className="p-3 bg-white rounded-lg shadow-sm border">
              {qrCodeUrl ? (
                <img src={qrCodeUrl || "/placeholder.svg"} alt={`QR Code for ${(contact.name && contact.name.trim()) ? contact.name : contact.company}`} className="w-32 h-32" />
              ) : (
                <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                  <span className="text-gray-500 text-xs">Generating...</span>
                </div>
              )}
            </div>
          </div>

          {/* Contact Preview */}
          <div className="bg-gradient-to-r from-green-500/10 to-white/50 rounded-lg p-3 border border-green-500/20">
            <h3 className="font-semibold text-gray-900 mb-1 text-sm">{(contact.name && contact.name.trim()) ? contact.name : contact.company}</h3>
            <div className="space-y-1 text-xs text-gray-600">
              <p>
                {contact.title} at {contact.company}
              </p>
              <p>{contact.email}</p>
              <p>{contact.phone}</p>
              {contact.address && <p>{contact.address}</p>}
              {contact.notes && <p className="italic">"{contact.notes}"</p>}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            <Button onClick={handleDownloadBusinessCard} className="w-full bg-green-600 hover:bg-green-700 text-white">
              <Download className="h-4 w-4 mr-2" />
              Download Business Card
            </Button>

            <div className="grid grid-cols-2 gap-2">
              <Button onClick={handleDownloadQRCode} variant="outline" className="bg-transparent">
                <Download className="h-4 w-4 mr-2" />
                QR Code
              </Button>

              <Button onClick={handleCopyQRCode} variant="outline" className="bg-transparent">
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    QR URL
                  </>
                )}
              </Button>
            </div>

            <Button onClick={handleCopyContactData} variant="outline" className="w-full bg-transparent">
              {contactDataCopied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Contact Data Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Contact Data
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
