"use client"

import { useState, useEffect } from "react"
import { Download, Copy, Check, Share2 } from "lucide-react"
import { FaWhatsapp, FaTelegramPlane, FaViber, FaFacebookF } from "react-icons/fa"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { Contact } from "@/types/contact"
import { BusinessCardExport } from "./BusinessCardExport"
import { QRCodeCanvas } from "qrcode.react"

interface QRCodeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contact: Contact | null
}

export function QRCodeDialog({ open, onOpenChange, contact }: QRCodeDialogProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState("")
  const [copied, setCopied] = useState(false)
  const [showSocialPopup, setShowSocialPopup] = useState(false)

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

  // Add a helper to share the business card image
  const handleShareBusinessCard = async (platform: 'whatsapp' | 'telegram' | 'viber' | 'facebook') => {
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

      // Convert to blob
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png", 1.0))
      if (!blob) throw new Error("Failed to generate image blob")
      const file = new File([blob], `${contact.name.replace(/\s+/g, "_")}_business_card.png`, { type: "image/png" })

      // Try Web Share API
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Contact Card: ${contact.name}`,
          text: `Contact card for ${contact.name}`,
        })
        return
      }

      // Fallback: download image and open social app share URL
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `${contact.name.replace(/\s+/g, "_")}_business_card.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      // Open social app share URL
      let shareUrl = ""
      if (platform === "whatsapp") {
        shareUrl = `https://wa.me/?text=Contact%20card%20for%20${encodeURIComponent(contact.name)}`
      } else if (platform === "telegram") {
        shareUrl = `https://t.me/share/url?url=&text=Contact%20card%20for%20${encodeURIComponent(contact.name)}`
      } else if (platform === "viber") {
        shareUrl = `viber://forward?text=Contact%20card%20for%20${encodeURIComponent(contact.name)}`
      } else if (platform === "facebook") {
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=&quote=Contact%20card%20for%20${encodeURIComponent(contact.name)}`
      }
      window.open(shareUrl, "_blank")
    } catch (error) {
      alert("Failed to share business card. Please try again.")
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
          {/* QR Code (same size as ContactCard) */}
          <div className="flex justify-center">
            <div className="p-1.5 bg-white rounded shadow-sm border">
              {contact && (
                <QRCodeCanvas
                  value={`BEGIN:VCARD\nVERSION:3.0\nFN:${contact.name ? contact.name.trim().replace(/\s+/g, ' ') : ''}\nTEL:${contact.phone}\nEMAIL:${contact.email}\nADR:;;${contact.address || ''};;;;\nURL:${contact.website || ''}\nNOTE:${contact.notes || ''}\nEND:VCARD`}
                  size={128}
                  level="M"
                  includeMargin={false}
                />
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
                    Copy QR URL
                  </>
                )}
              </Button>
            </div>

            {/* Social Media Share Button */}
            <div className="relative mt-2">
              <Button onClick={() => setShowSocialPopup((v) => !v)} variant="outline" className="w-full bg-blue-50 text-blue-800 border-blue-200 flex items-center justify-center">
                <Share2 className="h-4 w-4 mr-2" />
                Social Media
              </Button>
              {showSocialPopup && (
                <div className="absolute left-1/2 top-full z-30 mt-2 -translate-x-1/2 bg-white rounded-lg shadow-lg border flex gap-3 p-3 animate-fade-in" style={{ minWidth: 180, maxWidth: 240 }}>
                  <button onClick={() => { setShowSocialPopup(false); handleShareBusinessCard('whatsapp') }} title="WhatsApp" className="hover:scale-110 transition-transform">
                    <FaWhatsapp className="text-green-500" size={24} />
                  </button>
                  <button onClick={() => { setShowSocialPopup(false); handleShareBusinessCard('telegram') }} title="Telegram" className="hover:scale-110 transition-transform">
                    <FaTelegramPlane className="text-blue-500" size={24} />
                  </button>
                  <button onClick={() => { setShowSocialPopup(false); handleShareBusinessCard('viber') }} title="Viber" className="hover:scale-110 transition-transform">
                    <FaViber className="text-purple-600" size={24} />
                  </button>
                  <button onClick={() => { setShowSocialPopup(false); handleShareBusinessCard('facebook') }} title="Facebook" className="hover:scale-110 transition-transform">
                    <FaFacebookF className="text-blue-700" size={24} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
